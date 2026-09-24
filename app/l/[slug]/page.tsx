import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicList } from "@/lib/agent-lists"
import { AgentListView } from "@/components/agent-list-view"
import { AgentListViewBeacon } from "@/components/agent-list-view-beacon"

export const dynamic = "force-dynamic"

const SITE_DEFAULT_OG = "/placeholder.jpg"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const list = await getPublicList(slug)
  if (!list) {
    return { title: "List not found · Miami Apartment Guy", robots: { index: false, follow: false } }
  }
  const title = `${list.title || "Apartment picks"} · Miami Apartment Guy`
  const description = `${list.items.length} hand-picked ${list.items.length === 1 ? "unit" : "units"} from ${list.agentName}`
  const image = list.items[0]?.snapshot.photo_url || SITE_DEFAULT_OG

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, images: [{ url: image }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  }
}

export default async function PublicListPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const list = await getPublicList(slug)
  if (!list) notFound()

  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <AgentListViewBeacon slug={list.slug} />
      <AgentListView
        data={{
          slug: list.slug,
          title: list.title,
          createdAt: list.createdAt,
          agentName: list.agentName,
          agentPhone: list.agentPhone,
          items: list.items,
        }}
      />
    </main>
  )
}
