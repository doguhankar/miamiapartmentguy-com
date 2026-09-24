import { NextResponse } from "next/server"
import { getVerifiedAgent, normalizeSlug, slugAvailable, validateSlug } from "@/lib/agent-lists"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!(await getVerifiedAgent())) return NextResponse.json({ error: "Agent login required." }, { status: 401 })
  const raw = new URL(req.url).searchParams.get("slug") ?? ""
  const slug = normalizeSlug(raw)
  const invalid = validateSlug(slug)
  if (invalid) return NextResponse.json({ slug, available: false, reason: invalid })
  const available = await slugAvailable(slug)
  return NextResponse.json({ slug, available, reason: available ? null : "That link name is taken." })
}
