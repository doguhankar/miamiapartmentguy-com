import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { manychatAdapter } from '@/lib/inbox/providers/manychat'
import { ingestEvents } from '@/lib/inbox/ingest'
import { decryptSecret } from '@/lib/inbox/crypto'
import { verifySharedSecret } from '@/lib/inbox/webhook-verify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Manychat External Request -> MAG. Contact + conversation link only; never creates messages.
// Headers: x-mag-account = social_accounts.id, x-mag-secret = that account's secret.
export async function POST(request: NextRequest) {
  const accountId = request.headers.get('x-mag-account')
  const secret = request.headers.get('x-mag-secret')
  if (!accountId || !secret || !/^[0-9a-f-]{36}$/i.test(accountId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: acc } = await admin.from('social_accounts').select('id,provider,status').eq('id', accountId).maybeSingle()
  const { data: cred } = await admin.from('social_account_credentials').select('webhook_secret_enc').eq('account_id', accountId).maybeSingle()

  let expected: string | null = null
  try {
    expected = cred?.webhook_secret_enc ? decryptSecret(cred.webhook_secret_enc) : null
  } catch {
    expected = null
  }
  // same response for unknown account / wrong secret / wrong provider: no account probing
  if (!acc || acc.provider !== 'manychat' || !verifySharedSecret(secret, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (acc.status === 'not_connected') return NextResponse.json({ error: 'Account is not connected' }, { status: 409 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const events = manychatAdapter.normalizeWebhook(body)
  if (!events.length) return NextResponse.json({ ok: true, ignored: true })

  const summary = await ingestEvents(admin, 'manychat', events, accountId)
  if (summary.failed > 0) return NextResponse.json({ ok: false, summary }, { status: 500 })
  return NextResponse.json({ ok: true, summary })
}
