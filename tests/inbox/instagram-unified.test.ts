import { describe, expect, it, vi } from 'vitest'
import { authorizeUrl, exchangeCode, fetchClientBusinessId, fetchSharedAccounts, subscribeWebhooks } from '@/lib/inbox/providers/instagram'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })

describe('Instagram Unified Login client', () => {
  it('builds the Facebook Login for Business URL with config_id', () => {
    const u = new URL(authorizeUrl({ clientId: 'A', configId: 'C', redirectUri: 'https://x.test/cb', state: 'S' }))
    expect(u.origin + u.pathname).toBe('https://www.facebook.com/dialog/oauth')
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ client_id: 'A', config_id: 'C', redirect_uri: 'https://x.test/cb', response_type: 'code', state: 'S' })
  })
  it('exchanges the code with the META app id/secret on graph.facebook.com', async () => {
    const f = vi.fn(async () => json({ access_token: 'SUAT', expires_in: 5000 }))
    expect(await exchangeCode({ clientId: 'A', clientSecret: 'SEC', code: 'CODE', redirectUri: 'https://x.test/cb' }, f as any)).toEqual({ accessToken: 'SUAT', expiresInSec: 5000 })
    const url = new URL(String((f.mock.calls[0] as any)[0]))
    expect(url.origin + url.pathname).toBe('https://graph.facebook.com/v27.0/oauth/access_token')
    expect(url.searchParams.get('code')).toBe('CODE')
    expect(url.searchParams.get('redirect_uri')).toBe('https://x.test/cb')
  })
  it('fails clearly (without leaking secrets) when Meta rejects the code', async () => {
    const f = async () => json({ error: { message: 'bad SEC' } }, 400)
    const e = await exchangeCode({ clientId: 'A', clientSecret: 'SEC', code: 'C' }, f as any).catch(x => x)
    expect(e).toBeInstanceOf(Error)
    expect(e.message).not.toContain('SEC')
    expect(e.message).toContain('bad ***')
  })
  it('lists every shared Instagram account from assigned_instagram_accounts', async () => {
    const f = vi.fn(async () => json({ data: [{ id: '1', username: 'don' }, { id: '2', username: 'seb' }, {}] }))
    expect(await fetchSharedAccounts('T', f as any)).toEqual([{ id: '1', username: 'don' }, { id: '2', username: 'seb' }])
    expect(String((f.mock.calls[0] as any)[0])).toContain('/me/assigned_instagram_accounts')
    expect((f.mock.calls[0] as any)[1].headers.authorization).toBe('Bearer T')
  })
  it('reads the client business id and tolerates failure', async () => {
    expect(await fetchClientBusinessId('T', (async () => json({ client_business_id: '99' })) as any)).toBe('99')
    expect(await fetchClientBusinessId('T', (async () => json({}, 400)) as any)).toBeNull()
  })
  it('subscribes each account to messages with the system-user token, and reports failure honestly', async () => {
    const f = vi.fn(async () => json({ success: true }))
    expect(await subscribeWebhooks('T', 'IG1', f as any)).toBe(true)
    const [url, init] = f.mock.calls[0] as any
    expect(String(url)).toBe('https://graph.facebook.com/v27.0/IG1/subscribed_apps')
    expect(String(init.body)).toContain('messages')
    expect(await subscribeWebhooks('T', 'IG1', (async () => json({}, 400)) as any)).toBe(false)
  })
})
