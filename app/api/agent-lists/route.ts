import { NextResponse } from "next/server"
import { getVerifiedAgent, publishList } from "@/lib/agent-lists"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const agent = await getVerifiedAgent()
  if (!agent) return NextResponse.json({ error: "Agent login required." }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }) }
  const b = body as { title?: string; slug?: string; items?: unknown }
  if (!Array.isArray(b.items)) return NextResponse.json({ error: "Bad request." }, { status: 400 })

  const result = await publishList(agent, {
    title: typeof b.title === "string" ? b.title : null,
    slug: typeof b.slug === "string" ? b.slug : null,
    items: b.items as { building_id: string; unit_number: string; note?: string | null }[],
  })
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ slug: result.slug, url: `/l/${result.slug}` }, { status: 201 })
}
