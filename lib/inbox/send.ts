// Pure rules for replying through Instagram. No network here.

export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000
export const MAX_TEXT_BYTES = 1000 // Send API text limit

export type SendWindow = { open: boolean; expiresAt: string | null; msLeft: number }

/** The window runs 24h from the client's LAST inbound message. No inbound message = no window (we never cold-DM). */
export function replyWindow(lastInboundAt: string | null, now = Date.now()): SendWindow {
  if (!lastInboundAt) return { open: false, expiresAt: null, msLeft: 0 }
  const end = new Date(lastInboundAt).getTime() + REPLY_WINDOW_MS
  const msLeft = Math.max(0, end - now)
  return { open: msLeft > 0, expiresAt: new Date(end).toISOString(), msLeft }
}

export function validateText(raw: unknown): { ok: true; text: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Write a message first.' }
  const text = raw.trim()
  if (!text) return { ok: false, error: 'Write a message first.' }
  if (new TextEncoder().encode(text).length > MAX_TEXT_BYTES) return { ok: false, error: 'That message is too long for Instagram (limit about 1000 characters).' }
  return { ok: true, text }
}

export function formatLeft(msLeft: number): string {
  const m = Math.floor(msLeft / 60000)
  if (m < 60) return `${m}m left`
  return `${Math.floor(m / 60)}h ${m % 60}m left`
}
