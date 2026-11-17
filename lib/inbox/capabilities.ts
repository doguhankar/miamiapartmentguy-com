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
    title: 'Instagram (API with Instagram Login)',
    accountTypes: 'Instagram professional accounts only (Business or Creator). No Facebook Page required with Instagram Login.',
    supportsAllFour: 'Yes for both Instagram accounts. Each owner connects through Business Login; while the app is in Standard Access, each must have a role on the Meta app (admin/developer/tester).',
    access: [
      'Meta developer app with the "Instagram" product (API setup with Instagram login)',
      'Permissions: instagram_business_basic + instagram_business_manage_messages',
      'Standard Access is enough for accounts you own or manage. Advanced Access (App Review + Business Verification) is only needed to serve accounts that do not have a role on the app.',
      'Webhook endpoint configured in the app dashboard; fields: messages (echoes included), messaging_seen',
    ],
    cells: {
      receive: { state: 'supported', note: 'messages webhook. Conversations start only when the Instagram user messages first.' },
      outboundEvents: { state: 'supported', note: 'Echo events are documented. MAG only marks this capability after it actually observes one for the account, so reply status stays "unavailable" until then.' },
      history: { state: 'unverified', note: 'No conversation/history listing endpoint appears in the Instagram Login messaging docs we read. No backfill is built; only events received after connecting are stored.' },
      reply: { state: 'documented-not-built', note: 'Send API exists with a 24-hour window (human-agent tag for longer). Not built: sending needs Don\'s explicit approval.' },
      webhooks: { state: 'supported', note: 'Verification handshake + X-Hub-Signature-256 (HMAC-SHA256 with app secret). Retries for up to 36 hours, so dedupe is required.' },
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
  {
    provider: 'manychat',
    title: 'Manychat (interim: lead data + conversation link)',
    accountTypes: 'One Manychat account (API key) per workspace. Don and Sebastian need separate keys if they use separate accounts.',
    supportsAllFour: 'Only as a data bridge. Account switching in Manychat is not a unified inbox.',
    access: [
      'Paid Manychat plan for External Request / Dynamic Block',
      'Public API key per account (Settings → API)',
      'A Manychat flow with an External Request block that POSTs contact data to MAG with a shared secret header',
    ],
    cells: {
      receive: { state: 'not-available', note: 'Manychat documents outbound requests from flows and a Public API for contact state and sending. No inbound message-event feed or inbox read API is documented.' },
      outboundEvents: { state: 'not-available', note: 'Not documented.' },
      history: { state: 'not-available', note: 'No conversation history API documented.' },
      reply: { state: 'documented-not-built', note: 'Send Content exists in the Public API. Not built.' },
      webhooks: { state: 'not-available', note: 'No event subscriptions documented; MAG receives External Request calls instead.' },
      leadSync: { state: 'supported', note: 'Contact name, handle and subscriber id via External Request. MAG creates a contact thread with NO messages.' },
      link: { state: 'supported', note: 'MAG stores a conversation link if the flow supplies one.' },
    },
    sources: [
      'https://help.manychat.com/hc/en-us/articles/14281252007580-Dev-Tools-Basics',
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
