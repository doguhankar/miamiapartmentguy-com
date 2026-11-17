import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// TikTok Business Messaging is not enabled yet (see lib/inbox/providers/tiktok.ts).
// This route refuses everything rather than accept unverified events.
const notEnabled = () =>
  NextResponse.json(
    { error: 'TikTok messaging is not enabled. Business Messaging API approval and webhook verification are still required.' },
    { status: 501 },
  )

export const GET = notEnabled
export const POST = notEnabled
