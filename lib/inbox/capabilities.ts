import type { CapabilityKey, ProviderId } from './types'

// Connection-capability matrix. "documented" means the official docs describe it;
// it is NOT the same as "available to MAG today". Runtime capabilities on a
// connected account (social_accounts.capabilities) are only set from things we
// actually observe, never from this table.
//
// Verified 2026-11-16 against official documentation (sources below).
// TikTok's portal pages render client-side, so its endpoint/scope details could
// only be confirmed from search-indexed official pages; those are marked unverified.

export type MatrixCell = { state: 'supported' | 'documented-not-built' | 'not-available' | 'unverified'; note: string }

export type ProviderMatrix = {
  provider: ProviderId
  title: string
  accountTypes: string
  supportsAllFour: string
  access: string[]
  cells: Record<'receive' | 'outboundEvents' | 'history' | 'reply' | 'webhooks' | 'leadSync' | 'link', MatrixCell>
  sources: string[]
}

export const CAPABILITY_MATRIX: ProviderMatrix[] = [
  {
    provider: 'instagram',
    title: 'Instagram (API with Unified Login)',
    accountTypes: 'Instagram professional accounts (Business or Creator). Clients log in with Instagram or Facebook. No Facebook Page needed; a business portfolio is required.',
    supportsAllFour: 'Yes for both Instagram accounts. Each owner connects through Business Login; while the app is in Standard Access, each must have a role on the Meta app (admin/developer/tester).',
    access: [
      'Meta app with the "Manage messaging & content on Instagram" use case, owned by a business portfolio, using Facebook Login for Business',
      'A configuration (config_id) requesting instagram_basic + instagram_manage_messages; the client approves it and shares their Instagram account',
      'Standard Access (given when the configuration is saved) works for people with a role on the app. Advanced Access (App Review) is only needed to connect other clients.',
      'Webhook callback + verify token in the app dashboard (fields: messages, messaging_seen), then each shared account is subscribed via /subscribed_apps',
    ],
    cells: {
      receive: { state: 'supported', note: 'messages webhook. Conversations start only when the Instagram user messages first.' },
      outboundEvents: { state: 'supported', note: 'Echo events are documented. MAG only marks this capability after it actually observes one for the account, so reply status stays "unavailable" until then.' },
      history: { state: 'unverified', note: 'No conversation/history listing endpoint appears in the Instagram messaging docs we read. No backfill is built; only events received after connecting are stored.' },
      reply: { state: 'supported', note: 'Send API with a 24-hour window from the client\'s last message (human-agent tag for up to 7 days is not requested yet). Built: owner/assignee, or an explicit send grant. Untested against a live account.' },
      webhooks: { state: 'supported', note: 'Verification handshake + X-Hub-Signature-256 (HMAC-SHA256 with the Meta app secret). Retries for up to 36 hours, so dedupe is required. Meta says the app must be published/Live to receive notifications for app users: unverified for accounts with a role while in Development mode.' },
      leadSync: { state: 'supported', note: 'Handle and display name from webhook payload; profile lookup optional.' },
      link: { state: 'not-available', note: 'No documented deep link to a thread; MAG stores a link only when one is supplied.' },
    },
    sources: [
      'https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api',
      'https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login',
      'https://developers.facebook.com/docs/instagram-platform/webhooks',
      'https://developers.facebook.com/docs/instagram-platform/app-review',
    ],
  },
  {
    provider: 'tiktok',
    title: 'TikTok (Business Messaging API)',
    accountTypes: 'TikTok Business Account, set to accept direct messages from everyone. Not available for accounts in the EEA, Switzerland or the UK.',
    supportsAllFour: 'Unconfirmed. Requires TikTok to approve a developer app for the Business Messaging API (reviews are a prerequisite). Both accounts must be eligible Business Accounts in an eligible region.',
    access: [
      'TikTok developer app + approval for the Business Messaging API (special permission and review)',
      'Each account owner authorizes the app',
      'Webhook subscription with event type DIRECT_MESSAGE',
    ],
    cells: {
      receive: { state: 'unverified', note: 'TikTok documents a DIRECT_MESSAGE webhook. Exact payload and signature scheme not confirmed.' },
      outboundEvents: { state: 'unverified', note: 'Not confirmed.' },
      history: { state: 'unverified', note: 'Docs list "Get a list of conversations" and "Get a list of messages" endpoints; limits not confirmed.' },
      reply: { state: 'documented-not-built', note: 'A send endpoint is listed. Conversations must be user-initiated. Not built.' },
      webhooks: { state: 'unverified', note: 'Webhook configuration endpoints are documented; verification method not confirmed, so the webhook route is disabled rather than guessed.' },
      leadSync: { state: 'not-available', note: 'Nothing separate from the messaging API.' },
      link: { state: 'not-available', note: 'Not documented.' },
    },
    sources: [
      'https://business-api.tiktok.com/portal/docs/business-messaging-api/v1.3',
      'https://business-api.tiktok.com/portal/docs/access-to-business-messaging-api/v1.3',
      'https://business-api.tiktok.com/portal/docs/direct-messages/v1.3',
    ],
  },
]

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  receive_messages: 'Receives incoming messages',
  outbound_events: 'Sees messages we send (needed for reply status)',
  read_history: 'Backfills past messages',
  send_replies: 'Sends replies from MAG',
  webhooks: 'Live webhook events',
  lead_sync: 'Contact / lead data sync',
  conversation_link: 'Link to native conversation',
}
