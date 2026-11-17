import { createHmac, timingSafeEqual } from 'node:crypto'

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  if (x.length !== y.length) return false
  return timingSafeEqual(x, y)
}

/** Meta signs the RAW body: header is "sha256=<hex hmac-sha256(appSecret, rawBody)>". */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string | undefined): boolean {
  if (!appSecret || !header) return false
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  return safeEqual(header, expected)
}

/** Meta's GET handshake: echo hub.challenge only if hub.verify_token matches. */
export function metaVerifyChallenge(
  params: URLSearchParams,
  verifyToken: string | undefined,
): { ok: true; challenge: string } | { ok: false } {
  if (!verifyToken) return { ok: false }
  if (params.get('hub.mode') !== 'subscribe') return { ok: false }
  const token = params.get('hub.verify_token') ?? ''
  if (!safeEqual(token, verifyToken)) return { ok: false }
  return { ok: true, challenge: params.get('hub.challenge') ?? '' }
}

export function verifySharedSecret(provided: string | null, expected: string | null | undefined): boolean {
  if (!provided || !expected) return false
  return safeEqual(provided, expected)
}
