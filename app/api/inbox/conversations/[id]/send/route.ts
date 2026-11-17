import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bearer, canSendOn, canViewConversation, resolveActor } from '@/lib/inbox/authz'
import { decryptSecret } from '@/lib/inbox/crypto'
import { ingestEvents, recordAccountError } from '@/lib/inbox/ingest'
import { IgSendError, sendTextMessage } from '@/lib/inbox/providers/instagram'
import { replyWindow, validateText } from '@/lib/inbox/send'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST { text } -> sends one Instagram reply from the conversation's own connected account.
// Nothing is stored as "sent" unless Instagram accepted it. No delivered/read status is invented.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const actor = await resolveActor(admin, bearer(request))
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!actor.approved) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: convo } = await admin
    .from('inbox_conversations')
    .select('id,agent_id,assigned_to,account_id,external_thread_id,last_inbound_at,status')
    .eq('id', id)
    .maybeSingle()
  // not found and not visible look the same
  if (!convo || !canViewConversation(actor, convo)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canSendOn(actor, convo)) return NextResponse.json({ error: 'You do not have permission to send on this conversation.' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { text?: unknown } | null
  const v = validateText(body?.text)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

  if (!convo.account_id || !convo.external_thread_id) return NextResponse.json({ error: 'This conversation is not linked to a connected account.' }, { status: 409 })
  const { data: acc } = await admin.from('social_accounts').select('id,provider,status,external_account_id,capabilities').eq('id', convo.account_id).maybeSingle()
  if (!acc || acc.provider !== 'instagram') return NextResponse.json({ error: 'Sending is only available for Instagram right now.' }, { status: 409 })
  if (acc.status !== 'connected') return NextResponse.json({ error: 'This Instagram account needs to be reconnected before you can send.' }, { status: 409 })

  const win = replyWindow(convo.last_inbound_at)
  if (!win.open) {
    return NextResponse.json(
      { error: convo.last_inbound_at ? 'The 24-hour reply window has closed. You can reply after the client messages again.' : 'There is no client message to reply to yet. Instagram does not allow starting a conversation.' },
      { status: 409 },
    )
  }

  const { data: cred } = await admin.from('social_account_credentials').select('access_token_enc,token_expires_at').eq('account_id', acc.id).maybeSingle()
  if (!cred?.access_token_enc || (cred.token_expires_at && new Date(cred.token_expires_at).getTime() <= Date.now())) {
    await recordAccountError(admin, acc.id, 'Authorization expired. Reconnect to resume.', 'needs_reconnect')
    return NextResponse.json({ error: 'This account\'s authorization expired. The account owner needs to reconnect.' }, { status: 409 })
  }

  let mid: string
  try {
    mid = await sendTextMessage(decryptSecret(cred.access_token_enc), acc.external_account_id!, convo.external_thread_id, v.text)
  } catch (e) {
    if (e instanceof IgSendError) {
      if (e.authFailure) await recordAccountError(admin, acc.id, e.message, 'needs_reconnect')
      return NextResponse.json({ error: e.message, retryable: !e.authFailure }, { status: e.authFailure ? 409 : 502 })
    }
    console.error('[inbox/send] unexpected failure')
    return NextResponse.json({ error: 'Could not send. Nothing was sent; try again.', retryable: true }, { status: 502 })
  }

  // Store it under the SAME event id the echo webhook will use, so the echo dedupes. observe:false:
  // our own send is not evidence that the platform delivers echo events.
  const summary = await ingestEvents(
    admin,
    'instagram',
    [{ kind: 'message', eventId: `ig:${mid}`, externalAccountId: acc.external_account_id!, threadId: convo.external_thread_id, externalUserId: convo.external_thread_id, userHandle: null, userName: null, direction: 'outbound', body: v.text, messageId: mid, sentAt: new Date().toISOString(), conversationUrl: null }],
    { observe: false },
  )
  if (!acc.capabilities?.send_replies) {
    await admin.from('social_accounts').update({ capabilities: { ...(acc.capabilities ?? {}), send_replies: true }, updated_at: new Date().toISOString() }).eq('id', acc.id)
  }
  // The send succeeded even if local storage hiccuped; the echo webhook will fill it in.
  return NextResponse.json({ ok: true, messageId: mid, stored: summary.failed === 0 })
}
