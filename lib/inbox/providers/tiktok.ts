import type { NormalizedEvent } from '../types'
import { type ProviderAdapter, ProviderNotEnabled } from './adapter'

// TikTok Business Messaging API: NOT enabled in this release.
//
// What the official documentation (business-api.tiktok.com) says exists:
//   - Business Messaging API for TikTok Business Accounts; not available for accounts in the EEA, Switzerland or the UK
//   - developers must complete TikTok's reviews before getting access
//   - endpoints to list conversations, list messages, send a message, check account capability
//   - webhooks configured at the developer-app level, event type DIRECT_MESSAGE
//
// What we could NOT verify (the portal renders client-side, so only search-indexed snippets were readable):
//   - the exact OAuth scopes and review steps
//   - the webhook payload shape and how a webhook is authenticated
//   - history limits and rate limits
//
// So this adapter refuses to parse anything. Guessing a webhook signature scheme would mean either
// accepting forged events or silently dropping real ones. Enabling TikTok is: get approval, read the
// portal in a browser, implement `verify` + `normalizeWebhook` here, flip `enabled`, and add tests.

export const tiktokAdapter: ProviderAdapter = {
  id: 'tiktok',
  enabled: false,
  normalizeWebhook(_body: unknown): NormalizedEvent[] {
    throw new ProviderNotEnabled(
      'tiktok',
      'TikTok messaging is not enabled: Business Messaging API approval and webhook verification details are still required.',
    )
  },
}
