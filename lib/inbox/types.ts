// Shared types for the social inbox. Mirrors supabase/migrations/20261117000000_social_inbox_v2.sql

export type ProviderId = 'instagram' | 'tiktok'

export type AccountStatus = 'not_connected' | 'pending_approval' | 'connected' | 'needs_reconnect' | 'error'

/** Only ever set from something we actually observed or the provider granted. */
export type CapabilityKey =
  | 'receive_messages' // inbound message events observed
  | 'outbound_events' // events for messages WE sent observed (needed for reply status)
  | 'read_history' // can backfill past messages
  | 'send_replies' // MAG may send through the API (not enabled in this release)
  | 'webhooks' // webhook subscription confirmed
  | 'lead_sync' // contact / lead data sync
  | 'conversation_link' // deep link to the native conversation

export type Capabilities = Partial<Record<CapabilityKey, boolean>>

export type ReplyStatus = 'waiting_us' | 'waiting_client' | 'unavailable'

export type ConversationStatus = 'open' | 'snoozed' | 'closed'

export type SocialAccount = {
  id: string
  provider: ProviderId
  owner_email: string
  label: string
  external_account_id: string | null
  handle: string | null
  status: AccountStatus
  capabilities: Capabilities
  granted_scopes: string[]
  last_sync_at: string | null
  last_success_at: string | null
  last_error: string | null
  last_error_at: string | null
}

export type Conversation = {
  id: string
  agent_id: string
  lead_id: number | null
  channel: string
  account_id: string | null
  identity_id: string | null
  contact_name: string | null
  contact_handle: string | null
  contact_phone: string | null
  assigned_to: string | null
  status: ConversationStatus
  reply_status: ReplyStatus
  unread_count: number
  next_action: string | null
  follow_up_at: string | null
  conversation_url: string | null
  last_message_at: string | null
  last_message_preview: string | null
  last_inbound_at: string | null
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  body: string | null
  sender_name: string | null
  sent_at: string
}

export type Note = {
  id: string
  conversation_id: string
  author_email: string
  body: string
  created_at: string
}

/** One provider event, normalised. */
export type NormalizedEvent =
  | {
      kind: 'message'
      eventId: string // unique per provider event; used for dedupe
      externalAccountId: string
      threadId: string
      externalUserId: string
      userHandle: string | null
      userName: string | null
      direction: 'inbound' | 'outbound'
      body: string
      messageId: string
      sentAt: string // ISO
      conversationUrl: string | null
    }
  | {
      kind: 'contact'
      externalAccountId: string
      threadId: string
      externalUserId: string
      userHandle: string | null
      userName: string | null
      conversationUrl: string | null
    }

/** Who is calling, resolved server-side from a verified token. */
export type Actor = {
  email: string
  approved: boolean
  grant: { viewTeam: boolean; reassign: boolean; send: boolean } | null
}
