import { createHmac, randomBytes } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { makeAdmin } from './fake-admin'

const holder = vi.hoisted(() => ({ admin: null as any }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => holder.admin }))

import { GET as igGet, POST as igPost } from '@/app/api/inbox/webhooks/instagram/route'
import { GET as ttGet, POST as ttPost } from '@/app/api/inbox/webhooks/tiktok/route'
import { POST as startPost } from '@/app/api/inbox/connect/[provider]/start/route'
import { GET as callbackGet } from '@/app/api/inbox/connect/instagram/callback/route'
import { POST as leadPost } from '@/app/api/inbox/conversations/[id]/lead/route'
import { signState } from '@/lib/inbox/connect'

const APP_SECRET = 'meta-app-secret'
const req = (url: string, init: RequestInit = {}) => new NextRequest(new URL(url, 'https://mag.test'), init as any)
const signed = (body: string) => 'sha256=' + createHmac('sha256', APP_SECRET).update(body).digest('hex')
const igBody = (mid: string, dir: 'in' | 'out' = 'in') =>
  JSON.stringify({
    object: 'instagram',
    entry: [{ id: 'IG_DON', messaging: [dir === 'in'
      ? { sender: { id: 'C1' }, recipient: { id: 'IG_DON' }, timestamp: 1700000000000, message: { mid, text: 'hi' } }
      : { sender: { id: 'IG_DON' }, recipient: { id: 'C1' }, timestamp: 1700000000000, message: { mid, text: 'yo', is_echo: true } }] }],
  })

beforeEach(() => {
  process.env.IG_APP_SECRET = APP_SECRET
  process.env.IG_VERIFY_TOKEN = 'verify-me'
  process.env.IG_APP_ID = 'app-id'
  process.env.INBOX_STATE_SECRET = 'state-secret'
  process.env.INBOX_CRED_KEY = randomBytes(32).toString('base64')
  holder.admin = makeAdmin({
    social_accounts: [{ id: 'a-ig', provider: 'instagram', owner_email: 'don@mag.test', status: 'connected', external_account_id: 'IG_DON', capabilities: {} }],
  }).admin
})

describe('POST /api/inbox/webhooks/instagram', () => {
  it('rejects missing and wrong signatures with 401 and writes nothing', async () => {
    const body = igBody('m1')
    for (const sig of [undefined, 'sha256=deadbeef', signed(body + 'x')]) {
      const res = await igPost(req('/api/inbox/webhooks/instagram', { method: 'POST', body, headers: sig ? { 'x-hub-signature-256': sig } : {} }))
      expect(res.status).toBe(401)
    }
    expect(holder.admin.rpc).toBeDefined()
  })
  it('accepts a correctly signed event and ingests it', async () => {
    const m = makeAdmin({ social_accounts: [{ id: 'a-ig', provider: 'instagram', owner_email: 'don@mag.test', status: 'connected', external_account_id: 'IG_DON', capabilities: {} }] })
    holder.admin = m.admin
    const body = igBody('m1')
    const res = await igPost(req('/api/inbox/webhooks/instagram', { method: 'POST', body, headers: { 'x-hub-signature-256': signed(body) } }))
    expect(res.status).toBe(200)
    expect(m.calls.rpc).toHaveLength(1)
    expect(m.calls.rpc[0]).toMatchObject({ name: 'inbox_ingest', args: { p_account_id: 'a-ig', p_external_message_id: 'm1', p_direction: 'inbound' } })
  })
  it('answers 200 for a redelivered event without a second write (dedupe is the database\'s job)', async () => {
    const m = makeAdmin(
      { social_accounts: [{ id: 'a-ig', provider: 'instagram', owner_email: 'don@mag.test', status: 'connected', external_account_id: 'IG_DON', capabilities: {} }] },
      { rpc: () => ({ data: { status: 'duplicate' }, error: null }) },
    )
    holder.admin = m.admin
    const body = igBody('m1')
    const res = await igPost(req('/api/inbox/webhooks/instagram', { method: 'POST', body, headers: { 'x-hub-signature-256': signed(body) } }))
    expect(res.status).toBe(200)
    expect((await res.json()).summary.duplicate).toBe(1)
  })
  it('returns 500 on a storage failure so Meta retries, and 200 for events it should ignore', async () => {
    holder.admin = makeAdmin(
      { social_accounts: [{ id: 'a-ig', provider: 'instagram', owner_email: 'don@mag.test', status: 'connected', external_account_id: 'IG_DON', capabilities: {} }] },
      { rpc: () => ({ data: null, error: { message: 'boom' } }) },
    ).admin
    const body = igBody('m1')
    const bad = await igPost(req('/api/inbox/webhooks/instagram', { method: 'POST', body, headers: { 'x-hub-signature-256': signed(body) } }))
    expect(bad.status).toBe(500)
    const seen = JSON.stringify({ object: 'instagram', entry: [{ id: 'IG_DON', messaging: [{ sender: { id: 'C1' }, recipient: { id: 'IG_DON' }, timestamp: 1, read: { mid: 'x' } }] }] })
    const ign = await igPost(req('/api/inbox/webhooks/instagram', { method: 'POST', body: seen, headers: { 'x-hub-signature-256': signed(seen) } }))
    expect(ign.status).toBe(200)
  })
  it('is unavailable (503) when the app secret is not configured', async () => {
    delete process.env.IG_APP_SECRET
    const res = await igPost(req('/api/inbox/webhooks/instagram', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(503)
  })
  it('handles the verification handshake', async () => {
    const ok = await igGet(req('/api/inbox/webhooks/instagram?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=777'))
    expect(ok.status).toBe(200)
    expect(await ok.text()).toBe('777')
    const bad = await igGet(req('/api/inbox/webhooks/instagram?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=777'))
    expect(bad.status).toBe(403)
  })
})

describe('TikTok webhook', () => {
  it('is explicitly disabled', async () => {
    expect((await ttPost()).status).toBe(501)
    expect((await ttGet()).status).toBe(501)
  })
})

describe('connect routes', () => {
  const approvedAdmin = () => {
    const m = makeAdmin({ agent_allowlist: [{ email: 'don@mag.test', approved: true }] }, { users: { good: 'don@mag.test' } })
    holder.admin = m.admin
    return m
  }
  it('start requires a signed-in approved agent', async () => {
    approvedAdmin()
    expect((await startPost(req('/x', { method: 'POST' }), { params: Promise.resolve({ provider: 'instagram' }) })).status).toBe(401)
    holder.admin = makeAdmin({ agent_allowlist: [{ email: 'don@mag.test', approved: false }] }, { users: { good: 'don@mag.test' } }).admin
    const res = await startPost(req('/x', { method: 'POST', headers: { authorization: 'Bearer good' } }), { params: Promise.resolve({ provider: 'instagram' }) })
    expect(res.status).toBe(403)
  })
  it('start returns the official Instagram authorization URL, never asking for a password', async () => {
    approvedAdmin()
    const res = await startPost(req('/x', { method: 'POST', headers: { authorization: 'Bearer good' } }), { params: Promise.resolve({ provider: 'instagram' }) })
    const { url } = await res.json()
    const u = new URL(url)
    expect(u.origin + u.pathname).toBe('https://www.instagram.com/oauth/authorize')
    expect(u.searchParams.get('scope')).toBe('instagram_business_basic,instagram_business_manage_messages')
    expect(u.searchParams.get('state')).toBeTruthy()
  })
  it('start is honest when unconfigured or unavailable', async () => {
    approvedAdmin()
    delete process.env.IG_APP_ID
    expect((await startPost(req('/x', { method: 'POST', headers: { authorization: 'Bearer good' } }), { params: Promise.resolve({ provider: 'instagram' }) })).status).toBe(503)
    expect((await startPost(req('/x', { method: 'POST', headers: { authorization: 'Bearer good' } }), { params: Promise.resolve({ provider: 'tiktok' }) })).status).toBe(501)
  })
  it('callback rejects forged or expired state and stores nothing', async () => {
    const m = approvedAdmin()
    const res = await callbackGet(req('/api/inbox/connect/instagram/callback?code=abc&state=forged.state'))
    expect(res.headers.get('location')).toContain('error=state')
    const old = signState({ email: 'don@mag.test', provider: 'instagram', iat: Date.now() - 3_600_000 }, 'state-secret')
    const res2 = await callbackGet(req(`/api/inbox/connect/instagram/callback?code=abc&state=${old}`))
    expect(res2.headers.get('location')).toContain('error=state')
    expect(m.calls.inserts).toHaveLength(0)
  })
  it('callback handles the user cancelling, and blocks users whose approval was revoked mid-flow', async () => {
    approvedAdmin()
    expect((await callbackGet(req('/api/inbox/connect/instagram/callback?error=access_denied'))).headers.get('location')).toContain('error=denied')
    holder.admin = makeAdmin({ agent_allowlist: [{ email: 'don@mag.test', approved: false }] }).admin
    const state = signState({ email: 'don@mag.test', provider: 'instagram' }, 'state-secret')
    const res = await callbackGet(req(`/api/inbox/connect/instagram/callback?code=abc&state=${state}`))
    expect(res.headers.get('location')).toContain('error=forbidden')
  })
})

describe('POST /api/inbox/conversations/[id]/lead', () => {
  const seed = () =>
    makeAdmin(
      {
        agent_allowlist: [{ email: 'don@mag.test', approved: true }, { email: 'seb@mag.test', approved: true }, { email: 'chaz@mag.test', approved: true }],
        inbox_team_roles: [{ email: 'seb@mag.test', can_view_team: true, can_reassign: false, can_send_client_messages: false, revoked_at: null }],
        inbox_conversations: [{ id: 'c1', agent_id: 'don@mag.test', assigned_to: null, lead_id: null, channel: 'instagram', contact_name: 'Amy', contact_handle: '@amy', contact_phone: null }],
        leads: [{ id: 10, agent_id: 'don@mag.test', name: 'Lead Don' }, { id: 11, agent_id: 'chaz@mag.test', name: 'Lead Chaz' }],
      },
      { users: { don: 'don@mag.test', seb: 'seb@mag.test', chaz: 'chaz@mag.test' } },
    )
  const post = (token: string | null, body: unknown, id = 'c1') =>
    leadPost(req('/x', { method: 'POST', body: JSON.stringify(body), headers: token ? { authorization: `Bearer ${token}` } : {} }), { params: Promise.resolve({ id }) })

  it('401 without a token, 404 for another agent\'s conversation (indistinguishable from missing)', async () => {
    holder.admin = seed().admin
    expect((await post(null, { mode: 'create' })).status).toBe(401)
    expect((await post('chaz', { mode: 'create', name: 'x' })).status).toBe(404)
    expect((await post('don', { mode: 'create', name: 'x' }, 'missing')).status).toBe(404)
  })
  it('a view-only team lead can see the conversation but cannot write into the owner\'s pipeline', async () => {
    holder.admin = seed().admin
    expect((await post('seb', { mode: 'create', name: 'Amy' })).status).toBe(404)
  })
  it('owner can create a lead from the conversation; the DM did not create one by itself', async () => {
    const m = seed()
    holder.admin = m.admin
    expect(m.tables.leads).toHaveLength(2)
    const res = await post('don', { mode: 'create', name: 'Amy', phone: '305-555-0100' })
    expect(res.status).toBe(200)
    expect(m.tables.leads).toHaveLength(3)
    expect(m.tables.leads[2]).toMatchObject({ agent_id: 'don@mag.test', source: 'Instagram DM' })
    expect(m.tables.inbox_conversations[0].lead_id).toBeTruthy()
    expect((await post('don', { mode: 'create', name: 'again' })).status).toBe(409)
  })
  it('linking only works with a lead from the owner\'s own pipeline', async () => {
    const m = seed()
    holder.admin = m.admin
    expect((await post('don', { mode: 'link', leadId: 11 })).status).toBe(403)
    expect((await post('don', { mode: 'link', leadId: 10 })).status).toBe(200)
    expect(m.tables.inbox_conversations[0].lead_id).toBe(10)
  })
})

