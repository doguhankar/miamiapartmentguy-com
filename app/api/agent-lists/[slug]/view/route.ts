import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getVerifiedAgent } from "@/lib/agent-lists"

export const dynamic = "force-dynamic"

const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|facebookcatalog|whatsapp|telegram|slack|discord|twitter|linkedin|skype|applebot|embedly|quora|pinterest|vkshare|headless|lighthouse/i

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ua = req.headers.get("user-agent") ?? ""
  if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 })
  if (await getVerifiedAgent()) return new NextResponse(null, { status: 204 }) // agents don't count

  const admin = createAdminClient()
  const { data: list } = await admin.from("agent_lists").select("id, hidden").eq("slug", slug).maybeSingle()
  if (!list || list.hidden) return new NextResponse(null, { status: 204 })

  await admin.from("agent_list_views").insert({ list_id: list.id })
  return new NextResponse(null, { status: 204 })
}
