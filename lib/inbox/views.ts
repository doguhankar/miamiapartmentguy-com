import type { Conversation } from './types'

// Pure view logic for the dashboard. No data is invented here: a conversation only lands in
// "waiting" views when the integration supplied enough events to compute reply_status.

export type ViewKey = 'new' | 'waiting_us' | 'waiting_client' | 'follow_up' | 'resolved'

export const VIEW_LABELS: Record<ViewKey, string> = {
  new: 'New / unassigned',
  waiting_us: 'Waiting for our reply',
  waiting_client: 'Waiting for client',
  follow_up: 'Follow-up due',
  resolved: 'Resolved',
}

export function isFollowUpDue(c: Pick<Conversation, 'follow_up_at' | 'status'>, now = Date.now()) {
  return c.status !== 'closed' && !!c.follow_up_at && new Date(c.follow_up_at).getTime() <= now
}

/** A conversation can sit in more than one view (e.g. unassigned AND follow-up due). */
export function inView(c: Conversation, view: ViewKey, now = Date.now()): boolean {
  if (view === 'resolved') return c.status === 'closed'
  if (c.status === 'closed') return false
  switch (view) {
    case 'new': return !c.assigned_to
    case 'waiting_us': return c.reply_status === 'waiting_us'
    case 'waiting_client': return c.reply_status === 'waiting_client'
    case 'follow_up': return isFollowUpDue(c, now)
  }
}

export function countViews(list: Conversation[], now = Date.now()): Record<ViewKey, number> {
  const out: Record<ViewKey, number> = { new: 0, waiting_us: 0, waiting_client: 0, follow_up: 0, resolved: 0 }
  for (const c of list) for (const k of Object.keys(out) as ViewKey[]) if (inView(c, k, now)) out[k]++
  return out
}

export function replyStatusLabel(c: Pick<Conversation, 'reply_status'>) {
  if (c.reply_status === 'waiting_us') return 'Waiting for our reply'
  if (c.reply_status === 'waiting_client') return 'Waiting for client'
  return 'Reply status unavailable'
}
