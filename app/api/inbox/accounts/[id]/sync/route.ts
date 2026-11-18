import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bearer, resolveActor } from '@/lib/inbox/authz'
import { decryptSecret } from '@/lib/inbox/crypto'
import { ingestEvents, recordAccountError } from '@/lib/inbox/ingest'
import { fetchHistoryPage, IgHistoryError } from '@/lib/inbox/providers/instagram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST { cursor?: string } -> imports one batch of past Instagram conversations for an account the caller owns.
// Read-only toward Instagram (nothing is sent). The client calls again with `nextCursor` until it is null.
// Old messages must not look like new unread ones, so unread counts are put back after each batch.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const actor = await resolveActor(admin, bearer(request))
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!actor.approved) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: acc } = await admin
    .from('social_accounts')
    .select('id,provider,owner_email,status,external_account_id,capabilities')
    .eq('id', id)
    .maybeSingle()
  // not found and not yours look the same
  if (!acc || acc.provider !== 'instagram' || acc.owner_email.toLowerCase() !== actor.email) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (acc.status !== 'connected' || !acc.external_account_id) return NextResponse.json({ error: 'Reconnect this Instagram account before importing history.' }, { status: 409 })

  const body = (await request.json().catch(() => null)) as { cursor?: unknown } | null
  const cursor = typeof body?.cursor === 'string' && body.cursor.length < 2000 ? body.cursor : null

  const { data: cred } = await admin.from('social_account_credentials').select('access_token_enc,token_expires_at').eq('account_id', acc.id).maybeSingle()
  if (!cred?.access_token_enc || (cred.token_expires_at && new Date(cred.token_expires_at).getTime() <= Date.now())) {
    await recordAccountError(admin, acc.id, 'Authorization expired. Reconnect to resume.', 'needs_reconnect')
    return NextResponse.json({ error: 'This account\'s authorization expired. Reconnect, then try again.' }, { status: 409 })
  }

  let page
  try {
    page = await fetchHistoryPage(decryptSecret(cred.access_token_enc), acc.external_account_id, cursor)
  } catch (e) {
    if (e instanceof IgHistoryError) {
      if (e.authFailure) await recordAccountError(admin, acc.id, e.message, 'needs_reconnect')
      return NextResponse.json({ error: e.message }, { status: e.authFailure ? 409 : 502 })
    }
    console.error('[inbox/sync] unexpected failure')
    return NextResponse.json({ error: 'Could not read history. Nothing was imported; try again.' }, { status: 502 })
  }

  // Remember unread counts for conversations that already exist, so the import does not inflate them.
  const threads = [...new Set(page.events.map((e) => e.threadId))]
  const prior = new Map<string, number>()
  if (threads.length) {
    const { data: rows } = await admin.from('inbox_conversations').select('external_thread_id,unread_count').eq('account_id', acc.id).in('external_thread_id', threads)
    for (const r of rows ?? []) prior.set(r.external_thread_id as string, (r.unread_count as number) ?? 0)
  }

  const summary = await ingestEvents(admin, 'instagram', page.events, { observe: false })

  for (const t of threads) {
    await admin.from('inbox_conversations').update({ unread_count: prior.get(t) ?? 0 }).eq('account_id', acc.id).eq('external_thread_id', t)
  }

  // only evidence counts: history is "available" once Instagram actually returned messages
  if (page.events.length > 0 && !acc.capabilities?.read_history) {
    await admin.from('social_accounts').update({ capabilities: { ...(acc.capabilities ?? {}), read_history: true }, updated_at: new Date().toISOString() }).eq('id', acc.id)
  }

  return NextResponse.json({
    ok: true,
    conversations: page.conversations,
    messages: page.events.length,
    imported: summary.ok,
    duplicates: summary.duplicate,
    failed: summary.failed,
    nextCursor: page.nextCursor,
  })
}
