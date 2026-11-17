import { createHmac, randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptSecret } from './crypto'
import { safeEqual } from './webhook-verify'
import type { Capabilities, ProviderId } from './types'

// ── signed OAuth state ───────────────────────────────────────────────────────
// The callback is a top-level redirect from Instagram with no Authorization header, so the
// MAG user is carried in a signed, short-lived state value (CSRF protection + identity).

export type OAuthState = { email: string; provider: ProviderId; nonce: string; iat: number }

export function signState(payload: Omit<OAuthState, 'nonce' | 'iat'> & { nonce?: string; iat?: number }, secret: string): string {
  const body: OAuthState = {
    email: payload.email.toLowerCase(),
    provider: payload.provider,
    nonce: payload.nonce ?? randomBytes(12).toString('base64url'),
    iat: payload.iat ?? Date.now(),
  }
  const b = Buffer.from(JSON.stringify(body)).toString('base64url')
  const sig = createHmac('sha256', secret).update(b).digest('base64url')
  return `${b}.${sig}`
}

export function verifyState(token: string | null, secret: string | undefined, maxAgeMs = 10 * 60 * 1000, now = Date.now()): OAuthState | null {
  if (!token || !secret) return null
  const [b, sig] = token.split('.')
  if (!b || !sig) return null
  const expected = createHmac('sha256', secret).update(b).digest('base64url')
  if (!safeEqual(sig, expected)) return null
  try {
    const s = JSON.parse(Buffer.from(b, 'base64url').toString('utf8')) as OAuthState
    if (!s.email || !s.provider || typeof s.iat !== 'number') return null
    if (now - s.iat > maxAgeMs || s.iat > now + 60_000) return null
    return s
  } catch {
    return null
  }
}

// ── reconnect-safe account binding ───────────────────────────────────────────

export type ExistingAccount = { id: string; provider: string; owner_email: string; external_account_id: string | null }

export type ConnectionDecision =
  | { action: 'update'; id: string } // same account, same owner: refresh credentials in place
  | { action: 'bind_slot'; id: string } // owner's pre-created slot with no external id yet
  | { action: 'create' }
  | { action: 'refuse'; reason: string }

/**
 * Pure decision so reconnect behaviour is testable:
 *  - the same Instagram account can never be attached to a second owner,
 *  - reconnecting your own account updates it in place (conversations and history are kept),
 *  - otherwise the owner's empty slot for that provider is used before creating a new row.
 */
export function decideConnection(
  existing: ExistingAccount[],
  incoming: { provider: ProviderId; ownerEmail: string; externalAccountId: string },
): ConnectionDecision {
  const owner = incoming.ownerEmail.toLowerCase()
  const same = existing.find(a => a.provider === incoming.provider && a.external_account_id === incoming.externalAccountId)
  if (same) {
    if (same.owner_email.toLowerCase() !== owner) {
      return { action: 'refuse', reason: 'This account is already connected under a different MAG user. Ask Don to disconnect it first.' }
    }
    return { action: 'update', id: same.id }
  }
  const slot = existing.find(
    a => a.provider === incoming.provider && a.owner_email.toLowerCase() === owner && a.external_account_id === null,
  )
  if (slot) return { action: 'bind_slot', id: slot.id }
  return { action: 'create' }
}

export type SaveConnectionInput = {
  provider: ProviderId
  ownerEmail: string
  externalAccountId: string
  handle: string | null
  label: string
  scopes: string[]
  capabilities: Capabilities
  accessToken: string
  clientBusinessId?: string | null
  tokenExpiresAt: Date | null
}

export async function saveConnection(
  admin: SupabaseClient,
  input: SaveConnectionInput,
  key?: Buffer,
): Promise<{ ok: true; id: string; action: ConnectionDecision['action'] } | { ok: false; reason: string }> {
  const { data: rows, error } = await admin
    .from('social_accounts')
    .select('id,provider,owner_email,external_account_id')
    .eq('provider', input.provider) // tiny table; matching is done in decideConnection, no user input in the query
  if (error) return { ok: false, reason: error.message }

  const decision = decideConnection((rows ?? []) as ExistingAccount[], input)
  if (decision.action === 'refuse') return { ok: false, reason: decision.reason }

  const fields = {
    external_account_id: input.externalAccountId,
    handle: input.handle,
    status: 'connected',
    capabilities: input.capabilities,
    granted_scopes: input.scopes,
    last_error: null,
    last_error_at: null,
    last_success_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  let id: string
  if (decision.action === 'create') {
    const { data, error: insErr } = await admin
      .from('social_accounts')
      .insert({ provider: input.provider, owner_email: input.ownerEmail.toLowerCase(), label: input.label, ...fields })
      .select('id')
      .single()
    if (insErr || !data) return { ok: false, reason: insErr?.message ?? 'Could not save the connection' }
    id = data.id
  } else {
    id = decision.id
    // reconnect: keep previously OBSERVED capabilities; add what was just granted
    const { data: current } = await admin.from('social_accounts').select('capabilities').eq('id', id).maybeSingle()
    const merged = { ...((current?.capabilities as Capabilities | null) ?? {}), ...input.capabilities }
    const { error: upErr } = await admin.from('social_accounts').update({ ...fields, capabilities: merged }).eq('id', id)
    if (upErr) return { ok: false, reason: upErr.message }
  }

  const { error: credErr } = await admin.from('social_account_credentials').upsert(
    {
      account_id: id,
      access_token_enc: encryptSecret(input.accessToken, key),
      token_expires_at: input.tokenExpiresAt?.toISOString() ?? null,
      client_business_id: input.clientBusinessId ?? null,
      key_version: 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'account_id' },
  )
  if (credErr) return { ok: false, reason: credErr.message }

  return { ok: true, id, action: decision.action }
}
