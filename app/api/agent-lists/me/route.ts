import { NextResponse } from "next/server"
import { getVerifiedAgent } from "@/lib/agent-lists"

export const dynamic = "force-dynamic"

export async function GET() {
  const agent = await getVerifiedAgent()
  return NextResponse.json(
    agent ? { agent: true, name: agent.name } : { agent: false },
    { headers: { "Cache-Control": "no-store" } },
  )
}
