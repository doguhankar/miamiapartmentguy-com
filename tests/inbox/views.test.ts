import { describe, expect, it } from 'vitest'
import { countViews, inView, replyStatusLabel } from '@/lib/inbox/views'
import { DEMO_CONVERSATIONS } from '@/lib/inbox/demo-data'

describe('dashboard views (main workflow)', () => {
  const now = Date.now()
  it('puts unassigned open conversations in New and assigned ones out', () => {
    const [c1, c2] = DEMO_CONVERSATIONS
    expect(inView(c1, 'new', now)).toBe(true)
    expect(inView(c2, 'new', now)).toBe(false)
  })
  it('only uses waiting views when reply status was computable', () => {
    const c3 = DEMO_CONVERSATIONS.find(c => c.id === 'demo-c3')!
    expect(c3.reply_status).toBe('unavailable')
    expect(inView(c3, 'waiting_us', now)).toBe(false)
    expect(inView(c3, 'waiting_client', now)).toBe(false)
    expect(replyStatusLabel(c3)).toBe('Reply status unavailable')
  })
  it('follow-up due and resolved behave', () => {
    const c2 = DEMO_CONVERSATIONS.find(c => c.id === 'demo-c2')!
    expect(inView(c2, 'follow_up', now)).toBe(true)
    const c5 = DEMO_CONVERSATIONS.find(c => c.id === 'demo-c5')!
    expect(inView(c5, 'resolved', now)).toBe(true)
    expect(inView(c5, 'new', now)).toBe(false)
  })
  it('counts match the views', () => {
    const n = countViews(DEMO_CONVERSATIONS, now)
    expect(n.resolved).toBe(1)
    expect(n.waiting_us).toBe(1)
    expect(n.waiting_client).toBe(1)
  })
})
