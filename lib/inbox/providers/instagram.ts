import type { NormalizedEvent } from '../types'
import type { ProviderAdapter } from './adapter'

// Instagram API with UNIFIED LOGIN (the setup Meta gives new apps; built on Facebook Login for Business).
// Clients log in with Instagram or Facebook, no Facebook Page needed, business portfolio required.
// One Business Integration System User Access Token covers every Instagram account the client shared.
// Official docs (read 2026-11-16):
//   https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-unified-login/get-started
//   https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-unified-login/authentication
//   https://developers.facebook.com/documentation/instagram-platform/webhooks/setup
// NOT confirmed by an official Unified Login page: the exact send endpoint. The Instagram Login messaging guide
// documents POST /<IG_ID>/messages; we call the same path on graph.facebook.com with the system-user token.
// The first live send is the verification, and failures are reported honestly.

const AUTHORIZE_URL = 'https://www.facebook.com/dialog/oauth'
const GRAPH = 'https://graph.facebook.com/v27.0'
export const WEBHOOK_FIELDS = 'messages,messaging_seen'

type FetchLike = typeof fetch

/** Facebook Login for Business dialog URL for a configuration. config_id is not a secret. */
export function authorizeUrl(p: { clientId: string; configId: string; redirectUri: string; state: string }): string {
  const u = new URL(AUTHORIZE_URL)
  u.searchParams.set('client_id', p.clientId)
  u.searchParams.set('config_id', p.configId)
  u.searchParams.set('redirect_uri', p.redirectUri)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('state', p.state)
  return u.toString()
}

export type TokenSet = { accessToken: string; expiresInSec: number | null }

/** Server-side only: uses the META app id + secret (not an Instagram app id). */
export async function exchangeCode(p: { clientId: string; clientSecret: string; code: string; redirectUri?: string }, f: FetchLike = fetch): Promise<TokenSet> {
  const u = new URL(`${GRAPH}/oauth/access_token`)
  u.searchParams.set('client_id', p.clientId)
  u.searchParams.set('client_secret', p.clientSecret)
  u.searchParams.set('code', p.code)
  // Meta requires the exact redirect_uri that the login dialog used
  if (p.redirectUri) u.searchParams.set('redirect_uri', p.redirectUri)
  const res = await f(u)
  if (!res.ok) {
    let why = ''
    try {
      const e = ((await res.json()) as any)?.error
      // Meta's own reason only (code/type/message); never echo secrets
      why = [e?.code, e?.error_subcode, e?.type, e?.message].filter(Boolean).join(' / ').split(p.clientSecret).join('***')
    } catch {}
    throw new Error(`Meta rejected the authorization code (${res.status})${why ? `: ${why}` : ''}. Start the connection again.`)
  }
  const j = (await res.json()) as any
  if (!j?.access_token) throw new Error('Meta did not return an access token.')
  return { accessToken: String(j.access_token), expiresInSec: typeof j.expires_in === 'number' ? j.expires_in : null }
}

export type SharedAccount = { id: string; username: string | null }

/** With this token type /me is the system user, so the shared Instagram accounts come from assigned_instagram_accounts. */
export async function fetchSharedAccounts(accessToken: string, f: FetchLike = fetch): Promise<SharedAccount[]> {
  const u = new URL(`${GRAPH}/me/assigned_instagram_accounts`)
  u.searchParams.set('fields', 'id,username')
  const res = await f(u, { headers: { authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`Could not read the shared Instagram accounts (${res.status}).`)
  const j = (await res.json()) as any
  const data = Array.isArray(j?.data) ? j.data : []
  return data.filter((a: any) => a?.id).map((a: any) => ({ id: String(a.id), username: a.username ?? null }))
}

/** Needed later to refresh/fetch this client's token via the Business Integration System User Token Management API. */
export async function fetchClientBusinessId(accessToken: string, f: FetchLike = fetch): Promise<string | null> {
  try {
    const u = new URL(`${GRAPH}/me`)
    u.searchParams.set('fields', 'client_business_id')
    const res = await f(u, { headers: { authorization: `Bearer ${accessToken}` } })
    if (!res.ok) return null
    const j = (await res.json()) as any
    return j?.client_business_id ? String(j.client_business_id) : null
  } catch {
    return null
  }
}

/** After a client connects, each shared account must be subscribed to the app's webhook fields (documented step). */
export async function subscribeWebhooks(accessToken: string, igAccountId: string, f: FetchLike = fetch): Promise<boolean> {
  try {
    const res = await f(`${GRAPH}/${encodeURIComponent(igAccountId)}/subscribed_apps`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: `Bearer ${accessToken}` },
      body: new URLSearchParams({ subscribed_fields: WEBHOOK_FIELDS }),
    })
    if (!res.ok) return false
    const j = (await res.json().catch(() => ({}))) as any
    return j?.success === true
  } catch {
    return false
  }
}

export class IgSendError extends Error {
  constructor(message: string, public status: number, public authFailure: boolean) {
    super(message)
    this.name = 'IgSendError'
  }
}

/**
 * Send a text reply (Send API). Rules from the docs: the client must have messaged first, and the reply must be
 * inside the 24-hour window (the route enforces the window before calling this). Max 1000 bytes of text.
 * Returns the message id; the same id later arrives as an echo webhook, which dedupes against it.
 */
export async function sendTextMessage(accessToken: string, igAccountId: string, recipientId: string, text: string, f: FetchLike = fetch): Promise<string> {
  const res = await f(`${GRAPH}/${encodeURIComponent(igAccountId)}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  })
  const j = (await res.json().catch(() => ({}))) as any
  if (!res.ok) {
    const code = j?.error?.code
    const auth = res.status === 401 || code === 190 || code === 102
    const msg = auth
      ? 'Instagram rejected this account\'s authorization. The account owner needs to reconnect.'
      : code === 10 || code === 551 || /window|24/i.test(String(j?.error?.message ?? ''))
        ? 'Instagram says this conversation is outside its reply window.'
        : 'Instagram could not send this message.'
    throw new IgSendError(msg, res.status, auth)
  }
  const id = j?.message_id
  if (!id) throw new IgSendError('Instagram accepted the request but returned no message id.', 502, false)
  return String(id)
}

const attachmentsText = (n: number) => `[${n} attachment${n > 1 ? 's' : ''}]`

export const instagramAdapter: ProviderAdapter = {
  id: 'instagram',
  enabled: true,
  normalizeWebhook(body: unknown): NormalizedEvent[] {
    const out: NormalizedEvent[] = []
    const b = body as any
    if (!b || b.object !== 'instagram' || !Array.isArray(b.entry)) return out

    for (const entry of b.entry) {
      const accountId = entry?.id != null ? String(entry.id) : null
      if (!accountId || !Array.isArray(entry.messaging)) continue

      for (const ev of entry.messaging) {
        const m = ev?.message
        if (!m?.mid) continue // seen/reaction/postback events carry no message: ignored, never invented
        if (m.is_deleted) continue
        if (m.is_self) continue // self-message test events

        const isEcho = !!m.is_echo // a message our account sent
        const contactId = isEcho ? ev.recipient?.id : ev.sender?.id
        if (contactId == null) continue

        const attachments = Array.isArray(m.attachments) ? m.attachments.length : 0
        const text = typeof m.text === 'string' ? m.text : ''
        const bodyText = text || (attachments ? attachmentsText(attachments) : '')
        if (!bodyText) continue

        const ts = Number(ev.timestamp)
        out.push({
          kind: 'message',
          eventId: `ig:${m.mid}`,
          externalAccountId: accountId,
          threadId: String(contactId),
          externalUserId: String(contactId),
          userHandle: null,
          userName: null,
          direction: isEcho ? 'outbound' : 'inbound',
          body: bodyText,
          messageId: String(m.mid),
          sentAt: Number.isFinite(ts) && ts > 0 ? new Date(ts).toISOString() : new Date().toISOString(),
          conversationUrl: null,
        })
      }
    }
    return out
  },
}
