import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { makeAdmin } from './fake-admin'

const holder = vi.hoisted(() => ({ admin: null as any }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => holder.admin }))

import { POST as sendPost } from '@/app/api/inbox/conversations/[id]/send/route'
import { canSendOn } from '@/lib/inbox/authz'
import { encryptSecret } from '@/lib/inbox/crypto'
import { IgSendError, sendTextMessage } from '@/lib/inbox/providers/instagram'
import { formatLeft, replyWindow, validateText } from '@/lib/inbox/send'

const mins = (n: number) => new Date(Date.now() - n * 60_000).toISOString()

describe('reply window + text rules', () => {
  it('opens for 24h from the last inbound message and never without one', () => {
    expect(replyWindow(mins(10)).open).toBe(true)
    expect(replyWindow(mins(23 * 60 + 59)).open).toBe(true)
    expect(replyWindow(mins(24 * 60 + 1)).open).toBe(false)
    expect(replyWindow(null)).toMatchObject({ open: false, expiresAt: null })
  })
  it('validates text', () => {
    expect(validateText('  hi  ')).toEqual({ ok: true, text: 'hi' })
    expect(validateText('   ').ok).toBe(false)
    expect(validateText(5).ok).toBe(false)
    expect(validateText('x'.repeat(1001)).ok).toBe(false)
    expect(validateText('é'.repeat(501)).ok).toBe(false) // counted in bytes
  })
  it('formats time left', () => expect(formatLeft(90 * 60_000)).toBe('1h 30m left'))
})

describe('who may send', () => {
  const actor = (email: string, send = false, viewTeam = false) => ({ email, approved: true, grant: send || viewTeam ? { viewTeam, reassign: false, send } : null })
  const convo = { agent_id: 'don@mag.test', assigned_to: null as string | null }
  it('owner and assignee can; a view-only team lead cannot; the send grant can', () => {
    expect(canSendOn(actor('don@mag.test'), convo)).toBe(true)
    expect(canSendOn(actor('chaz@mag.test'), { ...convo, assigned_to: 'chaz@mag.test' })).toBe(true)
    expect(canSendOn(actor('seb@mag.test', false, true), convo)).toBe(false)
    expect(canSendOn(actor('seb@mag.test', true, true), convo)).toBe(true)
    expect(canSendOn(actor('chaz@mag.test'), convo)).toBe(false)
    expect(canSendOn({ ...actor('don@mag.test'), approved: false }, convo)).toBe(false)
  })
})

describe('Instagram Send API client', () => {
  it('posts JSON with a bearer token and returns the message id', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ message_id: 'mid.1' }), { status: 200 }))
    expect(await sendTextMessage('TOK', 'C1', 'hello', f as any)).toBe('mid.1')
    const [url, init] = f.mock.calls[0] as any
    expect(String(url)).toContain('/me/messages')
    expect(init.headers.authorization).toBe('Bearer TOK')
    expect(JSON.parse(init.body)).toEqual({ recipient: { id: 'C1' }, message: { text: 'hello' } })
  })
  it('flags auth failures and never leaks the token in errors', async () => {
    const f = async () => new Response(JSON.stringify({ error: { code: 190, message: 'bad TOK' } }), { status: 400 })
    const e = await sendTextMessage('TOK', 'C1', 'x', f as any).catch(x => x)
    expect(e).toBeInstanceOf(IgSendError)
    expect(e.authFailure).toBe(true)
    expect(e.message).not.toContain('TOK')
  })
  it('treats a 200 without an id as a failure', async () => {
    const f = async () => new Response('{}', { status: 200 })
    await expect(sendTextMessage('T', 'C', 'x', f as any)).rejects.toBeInstanceOf(IgSendError)
  })
})

describe('POST /api/inbox/conversations/[id]/send', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    process.env.INBOX_CRED_KEY = randomBytes(32).toString('base64')
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message_id: 'mid.9' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  const seed = (over: { lastInbound?: string | null; status?: string; tokenExpires?: string | null } = {}) =>
    makeAdmin(
      {
        agent_allowlist: ['don', 'seb', 'chaz'].map(n => ({ email: `${n}@mag.test`, approved: true })),
        inbox_team_roles: [{ email: 'seb@mag.test', can_view_team: true, can_reassign: false, can_send_client_messages: false, revoked_at: null }],
        social_accounts: [{ id: 'a1', provider: 'instagram', owner_email: 'don@mag.test', status: over.status ?? 'connected', external_account_id: 'IG_DON', capabilities: {} }],
        social_account_credentials: [{ account_id: 'a1', access_token_enc: encryptSecret('PLAIN-IG-TOKEN'), token_expires_at: over.tokenExpires ?? null }],
        inbox_conversations: [{ id: 'c1', agent_id: 'don@mag.test', assigned_to: null, account_id: 'a1', external_thread_id: 'CLIENT1', last_inbound_at: over.lastInbound === undefined ? mins(30) : over.lastInbound, status: 'open' }],
      },
      { users: { don: 'don@mag.test', seb: 'seb@mag.test', chaz: 'chaz@mag.test' } },
    )
  const call = (token: string | null, text: unknown = 'hello there') =>
    sendPost(new NextRequest('https://mag.test/x', { method: 'POST', body: JSON.stringify({ text }), headers: token ? { authorization: `Bearer ${token}` } : {} }), { params: Promise.resolve({ id: 'c1' }) })

  it('rejects anonymous callers and hides other agents\' conversations', async () => {
    holder.admin = seed().admin
    expect((await call(null)).status).toBe(401)
    expect((await call('chaz')).status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('a team lead who can only view cannot send', async () => {
    holder.admin = seed().admin
    expect((await call('seb')).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('the send grant lets a team lead send', async () => {
    const m = seed()
    m.tables.inbox_team_roles[0].can_send_client_messages = true
    holder.admin = m.admin
    expect((await call('seb')).status).toBe(200)
  })
  it('sends from the conversation\'s own account, once, with the decrypted token, and stores the message under the echo id', async () => {
    const m = seed()
    holder.admin = m.admin
    const res = await call('don')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.authorization).toBe('Bearer PLAIN-IG-TOKEN')
    expect(JSON.parse(init.body).recipient.id).toBe('CLIENT1')
    expect(m.calls.rpc[0]).toMatchObject({ name: 'inbox_ingest', args: { p_event_id: 'ig:mid.9', p_direction: 'outbound', p_external_message_id: 'mid.9' } })
    // our own send must not count as proof the platform delivers echoes
    expect(m.tables.social_accounts[0].capabilities).toEqual({ send_replies: true })
  })
  it('refuses with a clear reason when the window is closed or there is no inbound message', async () => {
    holder.admin = seed({ lastInbound: mins(25 * 60) }).admin
    const closed = await call('don')
    expect(closed.status).toBe(409)
    expect((await closed.json()).error).toMatch(/24-hour/)
    holder.admin = seed({ lastInbound: null }).admin
    expect((await call('don')).status).toBe(409)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('refuses when the account needs reconnecting or the token expired', async () => {
    holder.admin = seed({ status: 'needs_reconnect' }).admin
    expect((await call('don')).status).toBe(409)
    const m = seed({ tokenExpires: mins(5) })
    holder.admin = m.admin
    expect((await call('don')).status).toBe(409)
    expect(m.tables.social_accounts[0].status).toBe('needs_reconnect')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('on an Instagram failure stores nothing, keeps the user\'s text retryable, and flags auth failures', async () => {
    const m = seed()
    holder.admin = m.admin
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code: 1, message: 'boom' } }), { status: 500 }))
    const res = await call('don')
    expect(res.status).toBe(502)
    expect((await res.json()).retryable).toBe(true)
    expect(m.calls.rpc).toHaveLength(0)
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code: 190, message: 'expired' } }), { status: 400 }))
    expect((await call('don')).status).toBe(409)
    expect(m.tables.social_accounts[0].status).toBe('needs_reconnect')
    expect(m.calls.rpc).toHaveLength(0)
  })
  it('validates the text before doing anything', async () => {
    holder.admin = seed().admin
    expect((await call('don', '   ')).status).toBe(400)
    expect((await call('don', 'x'.repeat(1001))).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
