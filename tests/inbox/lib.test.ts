import { createHmac, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret } from '@/lib/inbox/crypto'
import { metaVerifyChallenge, verifyMetaSignature, verifySharedSecret } from '@/lib/inbox/webhook-verify'
import { instagramAdapter } from '@/lib/inbox/providers/instagram'
import { tiktokAdapter } from '@/lib/inbox/providers/tiktok'
import { canAssign, canManageAccount, canSendClientMessages, canViewConversation, canWriteLeadFor, resolveActor } from '@/lib/inbox/authz'
import { decideConnection, saveConnection, signState, verifyState } from '@/lib/inbox/connect'
import { ingestEvents } from '@/lib/inbox/ingest'
import type { Actor } from '@/lib/inbox/types'
import { makeAdmin } from './fake-admin'

const key = randomBytes(32)

describe('credential encryption', () => {
  it('round-trips and never stores plaintext', () => {
    const ct = encryptSecret('IGQVJ-secret-token', key)
    expect(ct).not.toContain('IGQVJ')
    expect(decryptSecret(ct, key)).toBe('IGQVJ-secret-token')
  })
  it('uses a fresh IV each time', () => {
    expect(encryptSecret('x', key)).not.toBe(encryptSecret('x', key))
  })
  it('rejects tampering and the wrong key', () => {
    const ct = encryptSecret('hello', key)
    const parts = ct.split('.')
    parts[3] = Buffer.from('tampered').toString('base64url')
    expect(() => decryptSecret(parts.join('.'), key)).toThrow()
    expect(() => decryptSecret(ct, randomBytes(32))).toThrow()
  })
})

describe('webhook authenticity', () => {
  const secret = 'app-secret'
  const body = JSON.stringify({ object: 'instagram', entry: [] })
  const sig = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')

  it('accepts a correct Meta signature', () => expect(verifyMetaSignature(body, sig, secret)).toBe(true))
  it('rejects a body that was altered after signing', () => expect(verifyMetaSignature(body + ' ', sig, secret)).toBe(false))
  it('rejects a wrong secret, a missing header, and a missing server secret', () => {
    expect(verifyMetaSignature(body, sig, 'other')).toBe(false)
    expect(verifyMetaSignature(body, null, secret)).toBe(false)
    expect(verifyMetaSignature(body, sig, undefined)).toBe(false)
    expect(verifyMetaSignature(body, 'sha256=', secret)).toBe(false)
  })
  it('answers the Meta handshake only for the right token', () => {
    const ok = new URLSearchParams({ 'hub.mode': 'subscribe', 'hub.verify_token': 'tok', 'hub.challenge': '12345' })
    expect(metaVerifyChallenge(ok, 'tok')).toEqual({ ok: true, challenge: '12345' })
    expect(metaVerifyChallenge(ok, 'nope').ok).toBe(false)
    expect(metaVerifyChallenge(ok, undefined).ok).toBe(false)
  })
  it('compares shared secrets safely', () => {
    expect(verifySharedSecret('abc', 'abc')).toBe(true)
    expect(verifySharedSecret('abc', 'abd')).toBe(false)
    expect(verifySharedSecret(null, 'abc')).toBe(false)
    expect(verifySharedSecret('abc', null)).toBe(false)
  })
})

describe('instagram adapter', () => {
  const payload = (messaging: any[]) => ({ object: 'instagram', entry: [{ id: 'IGACC', time: 1, messaging }] })

  it('maps inbound and echo messages to the right direction and contact', () => {
    const ev = instagramAdapter.normalizeWebhook(
      payload([
        { sender: { id: 'CLIENT' }, recipient: { id: 'IGACC' }, timestamp: 1700000000000, message: { mid: 'm1', text: 'hi' } },
        { sender: { id: 'IGACC' }, recipient: { id: 'CLIENT' }, timestamp: 1700000001000, message: { mid: 'm2', text: 'hello!', is_echo: true } },
      ]),
    )
    expect(ev).toHaveLength(2)
    expect(ev[0]).toMatchObject({ direction: 'inbound', threadId: 'CLIENT', externalAccountId: 'IGACC', messageId: 'm1' })
    expect(ev[1]).toMatchObject({ direction: 'outbound', threadId: 'CLIENT', messageId: 'm2' })
  })
  it('ignores seen/reaction/self/deleted/empty events instead of inventing messages', () => {
    const ev = instagramAdapter.normalizeWebhook(
      payload([
        { sender: { id: 'C' }, recipient: { id: 'IGACC' }, timestamp: 1, read: { mid: 'm1' } },
        { sender: { id: 'C' }, recipient: { id: 'IGACC' }, timestamp: 1, message: { mid: 'm3', is_self: true, text: 'x' } },
        { sender: { id: 'C' }, recipient: { id: 'IGACC' }, timestamp: 1, message: { mid: 'm4', is_deleted: true } },
        { sender: { id: 'C' }, recipient: { id: 'IGACC' }, timestamp: 1, message: { mid: 'm5' } },
      ]),
    )
    expect(ev).toEqual([])
  })
  it('represents attachment-only messages honestly', () => {
    const [e] = instagramAdapter.normalizeWebhook(payload([{ sender: { id: 'C' }, recipient: { id: 'IGACC' }, timestamp: 1, message: { mid: 'm6', attachments: [{}, {}] } }]))
    expect(e.kind === 'message' && e.body).toBe('[2 attachments]')
  })
  it('handles batches and ignores other objects', () => {
    expect(instagramAdapter.normalizeWebhook({ object: 'page', entry: [] })).toEqual([])
    expect(instagramAdapter.normalizeWebhook(null)).toEqual([])
    const two = { object: 'instagram', entry: [{ id: 'A', messaging: [{ sender: { id: 'x' }, recipient: { id: 'A' }, timestamp: 1, message: { mid: 'a1', text: 'a' } }] }, { id: 'B', messaging: [{ sender: { id: 'y' }, recipient: { id: 'B' }, timestamp: 1, message: { mid: 'b1', text: 'b' } }] }] }
    expect(instagramAdapter.normalizeWebhook(two).map(e => e.externalAccountId)).toEqual(['A', 'B'])
  })
})

describe('tiktok adapter', () => {
  it('tiktok refuses to parse anything until it is properly enabled', () => {
    expect(tiktokAdapter.enabled).toBe(false)
    expect(() => tiktokAdapter.normalizeWebhook({ any: 'thing' })).toThrow(/not enabled/i)
  })
})

describe('authorization rules', () => {
  const agent = (email: string, grant: Actor['grant'] = null, approved = true): Actor => ({ email, approved, grant })
  const convo = { agent_id: 'seb@mag.test', assigned_to: null as string | null }

  it('requires current approval for everything', () => {
    const revoked = agent('seb@mag.test', null, false)
    expect(canViewConversation(revoked, convo)).toBe(false)
    expect(canViewConversation(null, convo)).toBe(false)
    expect(canManageAccount(revoked, { owner_email: 'seb@mag.test' })).toBe(false)
  })
  it('lets ordinary agents see only their own or assigned conversations', () => {
    expect(canViewConversation(agent('seb@mag.test'), convo)).toBe(true)
    expect(canViewConversation(agent('chaz@mag.test'), convo)).toBe(false)
    expect(canViewConversation(agent('chaz@mag.test'), { ...convo, assigned_to: 'Chaz@mag.test' })).toBe(true)
  })
  it('team visibility, reassigning and sending are separate grants', () => {
    const viewOnly = agent('lead@mag.test', { viewTeam: true, reassign: false, send: false })
    expect(canViewConversation(viewOnly, convo)).toBe(true)
    expect(canAssign(viewOnly, convo, 'chaz@mag.test', true)).toBe(false)
    expect(canSendClientMessages(viewOnly)).toBe(false)
    expect(canWriteLeadFor(viewOnly, convo)).toBe(false)
    expect(canAssign(agent('lead@mag.test', { viewTeam: true, reassign: true, send: false }), convo, 'chaz@mag.test', true)).toBe(true)
    expect(canSendClientMessages(agent('lead@mag.test', { viewTeam: true, reassign: true, send: false }))).toBe(false)
  })
  it('never assigns to an unapproved agent, even with the reassign grant', () => {
    expect(canAssign(agent('lead@mag.test', { viewTeam: true, reassign: true, send: false }), convo, 'eve@mag.test', false)).toBe(false)
  })
  it('allows claiming an unassigned conversation and releasing your own, nothing else', () => {
    const me = agent('seb@mag.test')
    expect(canAssign(me, convo, 'seb@mag.test', true)).toBe(true)
    expect(canAssign(me, convo, 'chaz@mag.test', true)).toBe(false)
    expect(canAssign(me, { ...convo, assigned_to: 'seb@mag.test' }, null, true)).toBe(true)
  })
  it('account management is owner-only, even for a team lead', () => {
    const lead = agent('lead@mag.test', { viewTeam: true, reassign: true, send: true })
    expect(canManageAccount(lead, { owner_email: 'seb@mag.test' })).toBe(false)
    expect(canManageAccount(agent('seb@mag.test'), { owner_email: 'SEB@mag.test' })).toBe(true)
  })

  it('resolves the actor fresh each time: revoked approval and revoked grants take effect immediately', async () => {
    const { admin, tables } = makeAdmin(
      {
        agent_allowlist: [{ email: 'lead@mag.test', approved: true }],
        inbox_team_roles: [{ email: 'lead@mag.test', can_view_team: true, can_reassign: false, can_send_client_messages: false, revoked_at: null }],
      },
      { users: { tok: 'Lead@mag.test' } },
    )
    expect(await resolveActor(admin, 'tok')).toEqual({ email: 'lead@mag.test', approved: true, grant: { viewTeam: true, reassign: false, send: false } })
    tables.inbox_team_roles[0].revoked_at = '2026-11-17T00:00:00Z'
    expect((await resolveActor(admin, 'tok'))?.grant).toBeNull()
    tables.agent_allowlist[0].approved = false
    expect(await resolveActor(admin, 'tok')).toEqual({ email: 'lead@mag.test', approved: false, grant: null })
    expect(await resolveActor(admin, 'bad')).toBeNull()
    expect(await resolveActor(admin, null)).toBeNull()
  })
})

describe('OAuth state + reconnect safety', () => {
  const secret = 'state-secret'
  it('round-trips and expires', () => {
    const t = signState({ email: 'Don@mag.test', provider: 'instagram', iat: 1_000 }, secret)
    expect(verifyState(t, secret, 600_000, 2_000)?.email).toBe('don@mag.test')
    expect(verifyState(t, secret, 600_000, 1_000 + 600_001)).toBeNull()
  })
  it('rejects tampered, foreign-secret and missing state', () => {
    const t = signState({ email: 'don@mag.test', provider: 'instagram' }, secret)
    const [b, s] = t.split('.')
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(b, 'base64url').toString()), email: 'evil@x.test' })).toString('base64url')
    expect(verifyState(`${forged}.${s}`, secret)).toBeNull()
    expect(verifyState(t, 'other-secret')).toBeNull()
    expect(verifyState(null, secret)).toBeNull()
    expect(verifyState(t, undefined)).toBeNull()
  })

  const rows = [
    { id: 'a1', provider: 'instagram', owner_email: 'don@mag.test', external_account_id: 'IG_DON' },
    { id: 'a2', provider: 'instagram', owner_email: 'seb@mag.test', external_account_id: null },
  ]
  it('reconnecting your own account updates it in place', () => {
    expect(decideConnection(rows, { provider: 'instagram', ownerEmail: 'Don@mag.test', externalAccountId: 'IG_DON' })).toEqual({ action: 'update', id: 'a1' })
  })
  it('refuses to attach an account that belongs to someone else', () => {
    expect(decideConnection(rows, { provider: 'instagram', ownerEmail: 'seb@mag.test', externalAccountId: 'IG_DON' }).action).toBe('refuse')
  })
  it('binds the owner\'s empty slot first, else creates', () => {
    expect(decideConnection(rows, { provider: 'instagram', ownerEmail: 'seb@mag.test', externalAccountId: 'IG_SEB' })).toEqual({ action: 'bind_slot', id: 'a2' })
    expect(decideConnection(rows, { provider: 'instagram', ownerEmail: 'chaz@mag.test', externalAccountId: 'IG_CHAZ' })).toEqual({ action: 'create' })
  })

  it('stores only ciphertext and keeps observed capabilities across a reconnect', async () => {
    const { admin, tables } = makeAdmin({
      social_accounts: [{ id: 'a1', provider: 'instagram', owner_email: 'don@mag.test', external_account_id: 'IG_DON', capabilities: { receive_messages: true, outbound_events: true } }],
    })
    const res = await saveConnection(
      admin,
      { provider: 'instagram', ownerEmail: 'don@mag.test', externalAccountId: 'IG_DON', handle: '@don', label: 'Don IG', scopes: ['instagram_business_basic'], capabilities: { webhooks: true }, accessToken: 'PLAIN-TOKEN', tokenExpiresAt: null },
      key,
    )
    expect(res).toMatchObject({ ok: true, id: 'a1', action: 'update' })
    expect(tables.social_accounts).toHaveLength(1) // no duplicate row
    expect(tables.social_accounts[0].capabilities).toEqual({ receive_messages: true, outbound_events: true, webhooks: true })
    expect(tables.social_accounts[0].status).toBe('connected')
    const stored = JSON.stringify(tables.social_account_credentials)
    expect(stored).not.toContain('PLAIN-TOKEN')
    expect(decryptSecret(tables.social_account_credentials[0].access_token_enc, key)).toBe('PLAIN-TOKEN')
  })
  it('refuses a cross-owner connection without touching credentials', async () => {
    const { admin, tables } = makeAdmin({
      social_accounts: [{ id: 'a1', provider: 'instagram', owner_email: 'don@mag.test', external_account_id: 'IG_DON' }],
    })
    const res = await saveConnection(admin, { provider: 'instagram', ownerEmail: 'seb@mag.test', externalAccountId: 'IG_DON', handle: null, label: 'x', scopes: [], capabilities: {}, accessToken: 't', tokenExpiresAt: null }, key)
    expect(res.ok).toBe(false)
    expect(tables.social_account_credentials ?? []).toHaveLength(0)
  })
})

describe('ingestion', () => {
  const ev = (direction: 'inbound' | 'outbound', id: string) => ({
    kind: 'message' as const, eventId: `ig:${id}`, externalAccountId: 'IG_DON', threadId: 'C1', externalUserId: 'C1',
    userHandle: null, userName: null, direction, body: 'x', messageId: id, sentAt: '2026-11-17T00:00:00Z', conversationUrl: null,
  })
  const seed = () => ({ social_accounts: [{ id: 'a1', provider: 'instagram', status: 'connected', external_account_id: 'IG_DON', capabilities: {} }] })

  it('records capabilities only from observed events', async () => {
    const { admin, tables } = makeAdmin(seed())
    await ingestEvents(admin, 'instagram', [ev('inbound', 'm1')])
    expect(tables.social_accounts[0].capabilities).toEqual({ receive_messages: true }) // outbound NOT assumed
    await ingestEvents(admin, 'instagram', [ev('outbound', 'm2')])
    expect(tables.social_accounts[0].capabilities).toEqual({ receive_messages: true, outbound_events: true })
  })
  it('counts duplicates from the database and skips unknown / disconnected accounts', async () => {
    const { admin } = makeAdmin(seed(), { rpc: () => ({ data: { status: 'duplicate' }, error: null }) })
    expect(await ingestEvents(admin, 'instagram', [ev('inbound', 'm1')])).toEqual({ ok: 0, duplicate: 1, skipped: 0, failed: 0 })
    const unknown = makeAdmin({}).admin
    expect(await ingestEvents(unknown, 'instagram', [ev('inbound', 'm1')])).toEqual({ ok: 0, duplicate: 0, skipped: 1, failed: 0 })
    const off = makeAdmin({ social_accounts: [{ id: 'a1', provider: 'instagram', status: 'not_connected', external_account_id: 'IG_DON' }] }).admin
    expect((await ingestEvents(off, 'instagram', [ev('inbound', 'm1')])).skipped).toBe(1)
  })
  it('reports failures and stores a short error on the account so the Connections screen can show it', async () => {
    const { admin, tables } = makeAdmin(seed(), { rpc: () => ({ data: null, error: { message: 'db down' } }) })
    expect((await ingestEvents(admin, 'instagram', [ev('inbound', 'm1')])).failed).toBe(1)
    expect(tables.social_accounts[0].last_error).toBe('db down')
  })
})
