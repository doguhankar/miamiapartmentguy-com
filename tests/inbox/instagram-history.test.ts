import { describe, expect, it } from 'vitest'
import { fetchHistoryPage, IgHistoryError } from '@/lib/inbox/providers/instagram'

const ME = '17841400000000000'
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('fetchHistoryPage', () => {
  it('maps inbound/outbound messages, uses ig:<id> event ids, and returns a cursor', async () => {
    const calls: string[] = []
    const f = (async (url: string) => {
      calls.push(url)
      if (url.includes('/conversations')) return json({ data: [{ id: 'c1' }], paging: { cursors: { after: 'CUR' }, next: 'x' } })
      return json({
        data: [
          { id: 'm2', created_time: '2026-11-18T15:20:00+0000', from: { id: ME, username: 'miamiapartmentguy' }, to: { data: [{ id: 'U1', username: 'client1' }] }, message: 'Sure, what is your budget?' },
          { id: 'm1', created_time: '2026-11-18T15:10:00+0000', from: { id: 'U1', username: 'client1' }, to: { data: [{ id: ME }] }, message: 'Hi, looking for a 1BR' },
          { id: 'm0', created_time: '2026-11-18T15:00:00+0000', from: { id: 'U1', username: 'client1' }, to: { data: [{ id: ME }] }, attachments: { data: [{}, {}] } },
          { id: 'mx', created_time: '2026-11-18T15:00:00+0000', from: { id: 'U1' }, to: { data: [{ id: ME }] } },
        ],
      })
    }) as unknown as typeof fetch

    const page = await fetchHistoryPage('TOKEN', ME, null, f)
    expect(page.conversations).toBe(1)
    expect(page.nextCursor).toBe('CUR')
    expect(page.events.map((e) => e.kind === 'message' && [e.eventId, e.direction, e.threadId, e.body])).toEqual([
      ['ig:m2', 'outbound', 'U1', 'Sure, what is your budget?'],
      ['ig:m1', 'inbound', 'U1', 'Hi, looking for a 1BR'],
      ['ig:m0', 'inbound', 'U1', '[2 attachments]'],
    ])
    const first = page.events[0]
    expect(first.kind === 'message' && first.sentAt).toBe('2026-11-18T15:20:00.000Z')
    expect(first.kind === 'message' && first.userHandle).toBe('client1')
  })

  it('passes the cursor and never puts the token in a URL', async () => {
    const urls: string[] = []
    const f = (async (url: string) => {
      urls.push(url)
      return json({ data: [] })
    }) as unknown as typeof fetch
    const page = await fetchHistoryPage('SECRET-TOKEN', ME, 'ABC', f)
    expect(urls[0]).toContain('after=ABC')
    expect(urls.join(' ')).not.toContain('SECRET-TOKEN')
    expect(page.nextCursor).toBeNull()
    expect(page.events).toEqual([])
  })

  it('reports an auth failure as such and a refusal with Meta\'s reason', async () => {
    const auth = (async () => json({ error: { code: 190, message: 'expired' } }, 400)) as unknown as typeof fetch
    await expect(fetchHistoryPage('T', ME, null, auth)).rejects.toMatchObject({ name: 'IgHistoryError', authFailure: true })
    const refused = (async () => json({ error: { code: 100, message: 'Unsupported get request' } }, 400)) as unknown as typeof fetch
    const err = await fetchHistoryPage('T', ME, null, refused).catch((e) => e)
    expect(err).toBeInstanceOf(IgHistoryError)
    expect(err.message).toContain('Unsupported get request')
    expect(err.authFailure).toBe(false)
  })
})
