import type { Conversation, Message, Note, SocialAccount } from './types'

// SYNTHETIC DEMO DATA. Fake people, fake handles, fake phone numbers. Lives only in this file:
// it is never written to the database and the UI never mixes it with live rows.
export const DEMO_ME = 'demo.agent@example.test'

const iso = (minAgo: number) => new Date(Date.now() - minAgo * 60_000).toISOString()

export const DEMO_ACCOUNTS: SocialAccount[] = [
  { id: 'demo-don-ig', provider: 'instagram', owner_email: 'demo.don@example.test', label: 'Don Instagram (demo)', external_account_id: null, handle: '@demo_don', status: 'connected', capabilities: { receive_messages: true, outbound_events: true, webhooks: true }, granted_scopes: [], last_sync_at: iso(2), last_success_at: iso(2), last_error: null, last_error_at: null },
  { id: 'demo-don-tt', provider: 'tiktok', owner_email: 'demo.don@example.test', label: 'Don TikTok (demo)', external_account_id: null, handle: '@demo_don', status: 'pending_approval', capabilities: {}, granted_scopes: [], last_sync_at: null, last_success_at: null, last_error: null, last_error_at: null },
  { id: 'demo-seb-ig', provider: 'instagram', owner_email: 'demo.seb@example.test', label: 'Seb Instagram (demo)', external_account_id: null, handle: '@demo_seb', status: 'connected', capabilities: { receive_messages: true }, granted_scopes: [], last_sync_at: iso(40), last_success_at: iso(40), last_error: null, last_error_at: null },
  { id: 'demo-seb-tt', provider: 'tiktok', owner_email: 'demo.seb@example.test', label: 'Seb TikTok (demo)', external_account_id: null, handle: '@demo_seb', status: 'needs_reconnect', capabilities: {}, granted_scopes: [], last_sync_at: iso(3000), last_success_at: iso(3000), last_error: 'Authorization expired. Reconnect to resume.', last_error_at: iso(60) },
]

const base = { agent_id: DEMO_ME, lead_id: null, identity_id: null, contact_phone: null, unread_count: 0, conversation_url: null, created_at: iso(5000) }

export const DEMO_CONVERSATIONS: Conversation[] = [
  { ...base, id: 'demo-c1', channel: 'instagram', account_id: 'demo-don-ig', contact_name: 'Sample Client A', contact_handle: '@sample_a', assigned_to: null, status: 'open', reply_status: 'waiting_us', unread_count: 2, next_action: null, follow_up_at: null, last_message_at: iso(6), last_message_preview: 'Do you have 1 beds under $2.5k near Brickell?', last_inbound_at: iso(6) },
  { ...base, id: 'demo-c2', channel: 'instagram', account_id: 'demo-don-ig', contact_name: 'Sample Client B', contact_handle: '@sample_b', assigned_to: DEMO_ME, status: 'open', reply_status: 'waiting_client', next_action: 'Send 3 Edgewater options', follow_up_at: iso(30), last_message_at: iso(300), last_message_preview: 'Sent you a few options, let me know which you like', last_inbound_at: iso(900) },
  { ...base, id: 'demo-c3', channel: 'instagram', account_id: 'demo-seb-ig', contact_name: 'Sample Client C', contact_handle: '@sample_c', assigned_to: 'demo.seb@example.test', status: 'open', reply_status: 'unavailable', next_action: null, follow_up_at: null, last_message_at: iso(120), last_message_preview: 'Is the Wynwood one pet friendly?', last_inbound_at: iso(120) },
  { ...base, id: 'demo-c4', channel: 'tiktok', account_id: 'demo-seb-tt', contact_name: 'Sample Client D', contact_handle: '@sample_d', assigned_to: null, status: 'open', reply_status: 'unavailable', next_action: null, follow_up_at: null, conversation_url: null, last_message_at: iso(4000), last_message_preview: 'Lead data only (no message sync for this account)', last_inbound_at: null },
  { ...base, id: 'demo-c5', channel: 'instagram', account_id: 'demo-don-ig', contact_name: 'Sample Client E', contact_handle: '@sample_e', assigned_to: DEMO_ME, status: 'closed', reply_status: 'waiting_client', next_action: null, follow_up_at: null, last_message_at: iso(9000), last_message_preview: 'Signed the lease, thanks!', last_inbound_at: iso(9000) },
]

export const DEMO_MESSAGES: Record<string, Message[]> = {
  'demo-c1': [
    { id: 'dm1', conversation_id: 'demo-c1', direction: 'inbound', body: 'Hey! saw your reel', sender_name: null, sent_at: iso(9) },
    { id: 'dm2', conversation_id: 'demo-c1', direction: 'inbound', body: 'Do you have 1 beds under $2.5k near Brickell?', sender_name: null, sent_at: iso(6) },
  ],
  'demo-c2': [
    { id: 'dm3', conversation_id: 'demo-c2', direction: 'inbound', body: 'Looking for Edgewater, move in next month', sender_name: null, sent_at: iso(900) },
    { id: 'dm4', conversation_id: 'demo-c2', direction: 'outbound', body: 'Sent you a few options, let me know which you like', sender_name: 'Demo Agent', sent_at: iso(300) },
  ],
  'demo-c3': [{ id: 'dm5', conversation_id: 'demo-c3', direction: 'inbound', body: 'Is the Wynwood one pet friendly?', sender_name: null, sent_at: iso(120) }],
}

export const DEMO_NOTES: Record<string, Note[]> = {
  'demo-c2': [{ id: 'dn1', conversation_id: 'demo-c2', author_email: DEMO_ME, body: 'Budget flexible if parking is included. (internal note)', created_at: iso(280) }],
}
