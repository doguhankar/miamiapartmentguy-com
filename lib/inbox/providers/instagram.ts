import type { NormalizedEvent } from '../types'
import type { ProviderAdapter } from './adapter'

// Instagram API with Instagram Login (no Facebook Page needed).
// Official docs (verified 2026-11-16):
//   Business Login:  https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login
//   Messaging API:   https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api
//   Webhooks:        https://developers.facebook.com/docs/instagram-platform/webhooks

export const IG_SCOPES = ['instagram_business_basic', 'instagram_business_manage_messages']

const AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize'
const SHORT_TOKEN_URL = 'https://api.instagram.com/oauth/access_token'
const LONG_TOKEN_URL = 'https://graph.instagram.com/access_token'
const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token'
const GRAPH = 'https://graph.instagram.com/v21.0'

type FetchLike = typeof fetch

export function authorizeUrl(p: { clientId: string; redirectUri: string; state: string }): string {
  const u = new URL(AUTHORIZE_URL)
  u.searchParams.set('client_id', p.clientId)
  u.searchParams.set('redirect_uri', p.redirectUri)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', IG_SCOPES.join(','))
  u.searchParams.set('state', p.state)
  return u.toString()
}

export type TokenSet = { accessToken: string; userId: string; permissions: string[]; expiresInSec: number | null }

/** Step 2 + 3 of Business Login: code -> short-lived -> long-lived (~60 days). Server-side only (needs the app secret). */
export async function exchangeCode(
  p: { clientId: string; clientSecret: string; redirectUri: string; code: string },
  f: FetchLike = fetch,
): Promise<TokenSet> {
  const code = p.code.replace(/#_$/, '') // docs: strip the trailing "#_"
  const shortRes = await f(SHORT_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: p.clientId,
      client_secret: p.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: p.redirectUri,
      code,
    }),
  })
  if (!shortRes.ok) throw new Error(`Instagram rejected the authorization code (${shortRes.status}). Start the connection again.`)
  const shortJson = (await shortRes.json()) as any
  const short = Array.isArray(shortJson?.data) ? shortJson.data[0] : shortJson
  if (!short?.access_token || !short?.user_id) throw new Error('Instagram did not return an access token.')

  const longUrl = new URL(LONG_TOKEN_URL)
  longUrl.searchParams.set('grant_type', 'ig_exchange_token')
  longUrl.searchParams.set('client_secret', p.clientSecret)
  longUrl.searchParams.set('access_token', short.access_token)
  const longRes = await f(longUrl)
  if (!longRes.ok) throw new Error(`Could not get a long-lived Instagram token (${longRes.status}).`)
  const long = (await longRes.json()) as any
  if (!long?.access_token) throw new Error('Instagram did not return a long-lived token.')

  const perms = typeof short.permissions === 'string' ? short.permissions.split(',') : (short.permissions ?? [])
  return {
    accessToken: long.access_token,
    userId: String(short.user_id),
    permissions: perms.map((x: string) => x.trim()).filter(Boolean),
    expiresInSec: typeof long.expires_in === 'number' ? long.expires_in : null,
  }
}

/** Refresh a long-lived token (must be >= 24h old and unexpired; each refresh adds ~60 days). */
export async function refreshToken(accessToken: string, f: FetchLike = fetch): Promise<{ accessToken: string; expiresInSec: number | null }> {
  const u = new URL(REFRESH_URL)
  u.searchParams.set('grant_type', 'ig_refresh_token')
  u.searchParams.set('access_token', accessToken)
  const res = await f(u)
  if (!res.ok) throw new Error(`Instagram token refresh failed (${res.status}). The owner must reconnect.`)
  const j = (await res.json()) as any
  if (!j?.access_token) throw new Error('Instagram token refresh returned no token.')
  return { accessToken: j.access_token, expiresInSec: typeof j.expires_in === 'number' ? j.expires_in : null }
}

export type IgProfile = { id: string; username: string | null; accountType: string | null }

/**
 * The webhook `entry.id` is the Instagram professional account id. We read both `user_id` and `id`
 * and prefer `user_id`; VERIFY on the first real connection that this matches entry.id
 * (the Connections screen shows the stored id so it is easy to compare).
 */
export async function fetchProfile(accessToken: string, f: FetchLike = fetch): Promise<IgProfile> {
  const u = new URL(`${GRAPH}/me`)
  u.searchParams.set('fields', 'user_id,username,account_type')
  u.searchParams.set('access_token', accessToken)
  const res = await f(u)
  if (!res.ok) throw new Error(`Could not read the Instagram profile (${res.status}).`)
  const j = (await res.json()) as any
  const id = j?.user_id ?? j?.id
  if (!id) throw new Error('Instagram did not return an account id.')
  return { id: String(id), username: j?.username ?? null, accountType: j?.account_type ?? null }
}

export function isProfessional(accountType: string | null): boolean {
  // Business and Creator accounts only. Personal accounts cannot use the messaging API.
  return !!accountType && /business|creator|media_creator/i.test(accountType)
}

/**
 * Best-effort per-account webhook subscription. The exact endpoint is not in the docs pages we could read,
 * so a failure is reported (webhooks=false) instead of assumed; the app-level webhook in the Meta dashboard
 * is the documented path.
 */
export async function subscribeWebhooks(accessToken: string, f: FetchLike = fetch): Promise<boolean> {
  try {
    const u = new URL(`${GRAPH}/me/subscribed_apps`)
    u.searchParams.set('subscribed_fields', 'messages,messaging_seen')
    u.searchParams.set('access_token', accessToken)
    const res = await f(u, { method: 'POST' })
    return res.ok
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
export async function sendTextMessage(accessToken: string, recipientId: string, text: string, f: FetchLike = fetch): Promise<string> {
  const res = await f(`${GRAPH}/me/messages`, {
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
