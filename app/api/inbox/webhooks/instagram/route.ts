import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { instagramAdapter } from '@/lib/inbox/providers/instagram'
import { ingestEvents } from '@/lib/inbox/ingest'
import { metaVerifyChallenge, verifyMetaSignature } from '@/lib/inbox/webhook-verify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Meta handshake: GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
export async function GET(request: NextRequest) {
  const res = metaVerifyChallenge(request.nextUrl.searchParams, process.env.IG_VERIFY_TOKEN)
  if (!res.ok) return new NextResponse('forbidden', { status: 403 })
  return new NextResponse(res.challenge, { status: 200, headers: { 'content-type': 'text/plain' } })
}

// Events. Signature is checked against the RAW body before anything is parsed.
export async function POST(request: NextRequest) {
  if (!process.env.IG_APP_SECRET) return NextResponse.json({ error: 'Instagram webhook is not configured' }, { status: 503 })

  const raw = await request.text()
  if (!verifyMetaSignature(raw, request.headers.get('x-hub-signature-256'), process.env.IG_APP_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const events = instagramAdapter.normalizeWebhook(body)
  if (!events.length) return NextResponse.json({ ok: true, ignored: true })

  const summary = await ingestEvents(createAdminClient(), 'instagram', events)
  // A failure returns 500 so Meta retries (for up to 36h). Retries are safe: events are deduped.
  if (summary.failed > 0) return NextResponse.json({ ok: false, summary }, { status: 500 })
  return NextResponse.json({ ok: true, summary })
}
