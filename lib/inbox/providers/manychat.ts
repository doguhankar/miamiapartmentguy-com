import type { NormalizedEvent } from '../types'
import type { ProviderAdapter } from './adapter'

// Manychat interim bridge: contact + conversation-link sync ONLY.
//
// Manychat's documented API lets external systems change contact state and send content, and lets a flow
// call OUT to a server (External Request). It documents no inbox read API, no message history and no
// inbound event subscription. So the only honest integration is: a flow's External Request POSTs the
// contact here. We create the contact thread and store the link. We never fabricate messages.
//
// Body (configured in the Manychat External Request block):
//   { "subscriber_id": "...", "first_name": "...", "last_name": "...", "username": "...",
//     "conversation_url": "https://..." }
// Auth: headers  x-mag-account: <social_accounts.id>   x-mag-secret: <per-account secret>

export const manychatAdapter: ProviderAdapter = {
  id: 'manychat',
  enabled: true,
  normalizeWebhook(body: unknown): NormalizedEvent[] {
    const b = body as any
    if (!b || typeof b !== 'object') return []
    const id = b.subscriber_id ?? b.id
    if (id == null || String(id).trim() === '') return []

    const first = typeof b.first_name === 'string' ? b.first_name.trim() : ''
    const last = typeof b.last_name === 'string' ? b.last_name.trim() : ''
    const name = [first, last].filter(Boolean).join(' ') || null
    const handle = typeof b.username === 'string' && b.username.trim() ? `@${b.username.trim().replace(/^@/, '')}` : null
    let url: string | null = null
    if (typeof b.conversation_url === 'string') {
      try {
        const u = new URL(b.conversation_url)
        if (u.protocol === 'https:') url = u.toString()
      } catch {
        url = null
      }
    }

    return [
      {
        kind: 'contact',
        externalAccountId: '', // resolved from the x-mag-account header by the route
        threadId: `mc:${String(id)}`,
        externalUserId: String(id),
        userHandle: handle,
        userName: name,
        conversationUrl: url,
      },
    ]
  },
}
