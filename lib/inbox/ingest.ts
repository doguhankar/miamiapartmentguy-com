import type { SupabaseClient } from '@supabase/supabase-js'
import type { Capabilities, NormalizedEvent, ProviderId } from './types'

// Turns verified, normalised events into database rows through the atomic
// inbox_ingest / inbox_upsert_contact SQL functions (dedupe ledger + identity +
// conversation + message in one transaction).

export type IngestSummary = { ok: number; duplicate: number; skipped: number; failed: number }

type AccountRow = { id: string; status: string; capabilities: Capabilities | null }

async function findAccount(admin: SupabaseClient, provider: ProviderId, externalId: string): Promise<AccountRow | null> {
  const { data } = await admin
    .from('social_accounts')
    .select('id,status,capabilities')
    .eq('provider', provider)
    .eq('external_account_id', externalId)
    .maybeSingle()
  return (data as AccountRow | null) ?? null
}

export async function recordAccountError(admin: SupabaseClient, accountId: string, message: string, status?: 'error' | 'needs_reconnect') {
  await admin
    .from('social_accounts')
    .update({
      last_error: message.slice(0, 500),
      last_error_at: new Date().toISOString(),
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
}

/**
 * Capabilities are recorded from evidence: the first signature-verified inbound event proves
 * receive_messages, the first echo of a message we sent proves outbound_events. Reply status
 * (waiting for us / waiting for client) is only computed once both are proven.
 */
async function observeCapability(admin: SupabaseClient, acc: AccountRow, key: 'receive_messages' | 'outbound_events') {
  const caps = acc.capabilities ?? {}
  if (caps[key]) return
  const next = { ...caps, [key]: true }
  await admin.from('social_accounts').update({ capabilities: next, updated_at: new Date().toISOString() }).eq('id', acc.id)
  acc.capabilities = next
}

export async function ingestEvents(
  admin: SupabaseClient,
  provider: ProviderId,
  events: NormalizedEvent[],
  /** observe=false: events we produced ourselves (a send) must not count as evidence of what the platform delivers */
  opts: { observe?: boolean } = {},
): Promise<IngestSummary> {
  const observe = opts.observe !== false
  const summary: IngestSummary = { ok: 0, duplicate: 0, skipped: 0, failed: 0 }
  const cache = new Map<string, AccountRow | null>()

  for (const ev of events) {
    if (!cache.has(ev.externalAccountId)) cache.set(ev.externalAccountId, await findAccount(admin, provider, ev.externalAccountId))
    const acc = cache.get(ev.externalAccountId) ?? null
    if (!acc || acc.status === 'not_connected') {
      summary.skipped++
      continue
    }

    try {
      if (ev.kind === 'message') {
        if (observe) await observeCapability(admin, acc, ev.direction === 'inbound' ? 'receive_messages' : 'outbound_events')
        const { data, error } = await admin.rpc('inbox_ingest', {
          p_account_id: acc.id,
          p_event_id: ev.eventId,
          p_external_thread_id: ev.threadId,
          p_external_user_id: ev.externalUserId,
          p_user_handle: ev.userHandle,
          p_user_name: ev.userName,
          p_direction: ev.direction,
          p_body: ev.body,
          p_external_message_id: ev.messageId,
          p_sent_at: ev.sentAt,
          p_conversation_url: ev.conversationUrl,
          p_raw: {},
        })
        if (error) throw new Error(error.message)
        const status = (data as { status?: string } | null)?.status
        if (status === 'ok') summary.ok++
        else if (status === 'duplicate') summary.duplicate++
        else summary.skipped++
      } else {
        const { data, error } = await admin.rpc('inbox_upsert_contact', {
          p_account_id: acc.id,
          p_external_thread_id: ev.threadId,
          p_external_user_id: ev.externalUserId,
          p_user_handle: ev.userHandle,
          p_user_name: ev.userName,
          p_conversation_url: ev.conversationUrl,
        })
        if (error) throw new Error(error.message)
        const status = (data as { status?: string } | null)?.status
        if (status === 'ok') summary.ok++
        else summary.skipped++
      }
    } catch (e) {
      summary.failed++
      await recordAccountError(admin, acc.id, e instanceof Error ? e.message : 'ingest failed')
    }
  }
  return summary
}
