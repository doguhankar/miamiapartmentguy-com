'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SocialAccount } from '@/lib/inbox/types'
import { CAPABILITY_LABELS, CAPABILITY_MATRIX } from '@/lib/inbox/capabilities'
import { DEMO_ACCOUNTS } from '@/lib/inbox/demo-data'

// ── /agent/inbox/connections — connection state, granted capabilities, last sync, errors ──
// Capabilities shown here are only the ones MAG has actually observed or been granted.
// Nothing here asks for a social-media password: Instagram uses its own authorization page.

const CONNECT_MSG: Record<string, string> = {
  denied: 'You cancelled the connection. Nothing was saved.',
  state: 'That connection link expired or was invalid. Start again.',
  config: 'Instagram is not configured on the server yet (see docs/inbox/SETUP.md).',
  forbidden: 'Your agent approval is not active, so the connection was not saved.',
  not_professional: 'That Instagram account is not a professional account. Switch it to Business or Creator in Instagram, then reconnect.',
  missing_permission: 'The messaging permission was not granted. Reconnect and accept the messaging permission.',
  owned_by_other: 'That Instagram account is already connected by another agent.',
  exchange: 'Instagram did not complete the connection. Try again; if it repeats, check the app settings.',
}
const STATE_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  connected: { bg: '#E7F7F1', fg: '#0F6E56', label: 'Connected' },
  pending_approval: { bg: '#FEF3E2', fg: '#B45309', label: 'Waiting on platform approval' },
  needs_reconnect: { bg: '#FEECEB', fg: '#B42318', label: 'Needs reconnect' },
  error: { bg: '#FEECEB', fg: '#B42318', label: 'Error' },
  not_connected: { bg: '#F2F2F0', fg: '#717171', label: 'Not connected' },
}
const MATRIX_STYLE: Record<string, string> = { supported: '#0F6E56', 'documented-not-built': '#2F80ED', unverified: '#B45309', 'not-available': '#717171' }
const CELL_LABEL: Record<string, string> = { supported: 'Supported', 'documented-not-built': 'Documented, not built', unverified: 'Unverified', 'not-available': 'Not available' }
const ROWS: [keyof (typeof CAPABILITY_MATRIX)[number]['cells'], string][] = [['receive', 'Receive messages'], ['outboundEvents', 'See messages we send'], ['history', 'Past history'], ['reply', 'Reply from MAG'], ['webhooks', 'Webhooks'], ['leadSync', 'Lead data'], ['link', 'Conversation link']]

const ago = (iso: string | null) => (iso ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date(iso)) : 'never')

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Connections />
    </Suspense>
  )
}

function Connections() {
  const sp = useSearchParams()
  const demo = sp.get('demo') === '1'
  const [ready, setReady] = useState<'loading' | 'ok' | 'denied' | 'signed_out'>('loading')
  const [email, setEmail] = useState('')
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [secret, setSecret] = useState<{ id: string; value: string } | null>(null)
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null)

  const load = useCallback(async () => {
    const { data } = await sbRef.current!.from('social_accounts').select('id,provider,owner_email,label,external_account_id,handle,status,capabilities,granted_scopes,last_sync_at,last_success_at,last_error,last_error_at').order('provider')
    setAccounts((data ?? []) as SocialAccount[])
  }, [])

  useEffect(() => {
    if (demo) {
      setReady('ok')
      setEmail('demo.don@example.test')
      setAccounts(DEMO_ACCOUNTS)
      return
    }
    if (!sbRef.current) sbRef.current = createClient()
    const sb = sbRef.current
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const e = (session.user.email ?? '').toLowerCase()
        setTimeout(async () => {
          setEmail(e)
          const { data } = await sb.from('agent_allowlist').select('approved').ilike('email', e).eq('approved', true).maybeSingle()
          if (!data) return setReady('denied')
          setReady('ok')
          load()
        }, 0)
      } else if (event === 'INITIAL_SESSION') setReady('signed_out')
    })
    return () => subscription?.unsubscribe()
  }, [demo, load])

  useEffect(() => {
    const c = sp.get('connected')
    const e = sp.get('error')
    if (c) setMsg(`Connected ${c}.${sp.get('note') === 'webhook_manual' ? ' Webhook subscription could not be confirmed automatically; subscribe in the Meta app dashboard.' : ''}`)
    else if (e) setMsg(CONNECT_MSG[e] ?? 'Connection failed.')
  }, [sp])

  const token = async () => (await sbRef.current!.auth.getSession()).data.session?.access_token ?? ''

  const connect = async (provider: string) => {
    if (demo) return setMsg('Demo mode: nothing is connected.')
    const res = await fetch(`/api/inbox/connect/${provider}/start`, { method: 'POST', headers: { authorization: `Bearer ${await token()}` } })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) return setMsg(j.error ?? 'Could not start the connection.')
    window.location.href = j.url
  }

  const makeSecret = async (id: string) => {
    if (demo) return setMsg('Demo mode: nothing is generated.')
    const res = await fetch(`/api/inbox/accounts/${id}/webhook-secret`, { method: 'POST', headers: { authorization: `Bearer ${await token()}` } })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) return setMsg(j.error ?? 'Could not create the secret.')
    setSecret({ id, value: j.secret })
    load()
  }

  if (ready !== 'ok') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F7F7F5', fontFamily: '"Inter", sans-serif', color: '#717171' }}>
        {ready === 'loading' ? 'Loading…' : ready === 'denied' ? 'This account is not currently approved for agent access.' : <a href="/agent">Sign in on the agent portal</a>}
      </div>
    )
  }

  return (
    <div style={{ background: '#F7F7F5', minHeight: '100vh', fontFamily: '"Inter", sans-serif', color: '#222', padding: '16px 16px 60px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <a href={demo ? '/agent/inbox?demo=1' : '/agent/inbox'} style={{ fontSize: 13, color: '#E0447B', fontWeight: 700, textDecoration: 'none' }}>← Back to inbox</a>
        <h1 style={{ fontSize: 24, margin: '10px 0 4px' }}>Connections</h1>
        <p style={{ color: '#717171', fontSize: 14, margin: '0 0 14px' }}>What MAG is connected to, what it can actually do, and when it last heard from each account. MAG never asks for your social-media password.</p>
        {demo && <div style={{ background: '#FEF3E2', color: '#B45309', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>DEMO MODE: synthetic sample accounts, nothing real.</div>}
        {msg && <div role="status" style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{msg}</div>}

        {accounts.length === 0 && <div style={{ background: '#fff', borderRadius: 12, padding: 18, fontSize: 14, color: '#717171' }}>No account slots exist yet. An admin creates them (see docs/inbox/SETUP.md), or connect Instagram below.</div>}

        <div style={{ display: 'grid', gap: 12 }}>
          {accounts.map(a => {
            const s = STATE_STYLE[a.status] ?? STATE_STYLE.not_connected
            const mine = a.owner_email.toLowerCase() === email
            const caps = Object.entries(a.capabilities).filter(([, v]) => v).map(([k]) => CAPABILITY_LABELS[k as keyof typeof CAPABILITY_LABELS] ?? k)
            return (
              <div key={a.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #EBEBEB' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: 16 }}>{a.label}</b>
                  <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999 }}>{s.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#717171' }}>Owner: {a.owner_email.split('@')[0]}</span>
                </div>
                <div style={{ fontSize: 13, color: '#717171', margin: '8px 0' }}>Last successful sync: {ago(a.last_success_at)}</div>
                <div style={{ fontSize: 13, margin: '6px 0' }}>
                  <b>Granted / observed:</b> {caps.length ? caps.join(' · ') : 'nothing confirmed yet'}
                </div>
                {a.last_error && <div style={{ background: '#FEECEB', color: '#B42318', borderRadius: 8, padding: '8px 10px', fontSize: 13, margin: '8px 0' }}>{a.last_error} <small>({ago(a.last_error_at)})</small></div>}
                {a.status === 'pending_approval' && <div style={{ fontSize: 13, color: '#B45309' }}>Waiting for {a.provider === 'tiktok' ? 'TikTok Business Messaging API approval' : 'platform approval'}. Message sync is not active.</div>}
                {a.provider === 'manychat' && <div style={{ fontSize: 13, color: '#717171' }}>Lead and conversation-link sync only. This is not message sync.</div>}
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {mine && a.provider === 'instagram' && <button style={btn} onClick={() => connect('instagram')}>{a.status === 'connected' ? 'Reconnect' : a.status === 'needs_reconnect' ? 'Reconnect now' : 'Connect Instagram'}</button>}
                  {mine && a.provider === 'manychat' && <button style={btn} onClick={() => makeSecret(a.id)}>{a.status === 'connected' ? 'Rotate webhook secret' : 'Generate webhook secret'}</button>}
                  {!mine && <span style={{ fontSize: 12, color: '#717171' }}>Only the owner can connect or reconnect this account.</span>}
                </div>
                {secret?.id === a.id && (
                  <div style={{ marginTop: 10, background: '#F7F7F5', borderRadius: 8, padding: 10, fontSize: 12, wordBreak: 'break-all' }}>
                    Shown once. Copy it into your Manychat External Request header <code>x-mag-secret</code> (and <code>x-mag-account: {a.id}</code>):<br />
                    <code style={{ fontWeight: 700 }}>{secret.value}</code>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {!accounts.some(a => a.provider === 'instagram' && a.owner_email.toLowerCase() === email) && (
          <button style={{ ...btn, marginTop: 12 }} onClick={() => connect('instagram')}>Connect my Instagram</button>
        )}

        <h2 style={{ fontSize: 18, margin: '28px 0 6px' }}>Capability matrix</h2>
        <p style={{ color: '#717171', fontSize: 13, margin: '0 0 10px' }}>What each platform documents (checked against official docs on 2026-11-16). Documented does not mean available to MAG: runtime capabilities above only appear once observed.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {CAPABILITY_MATRIX.map(p => (
            <details key={p.provider} style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 12, padding: 14 }}>
              <summary style={{ fontWeight: 800, cursor: 'pointer' }}>{p.title}</summary>
              <p style={{ fontSize: 13 }}><b>Accounts:</b> {p.accountTypes}</p>
              <p style={{ fontSize: 13 }}><b>Don + Sebastian, both platforms:</b> {p.supportsAllFour}</p>
              <ul style={{ fontSize: 13, paddingLeft: 18 }}>{p.access.map(x => <li key={x}>{x}</li>)}</ul>
              <div style={{ display: 'grid', gap: 6 }}>
                {ROWS.map(([k, label]) => (
                  <div key={k} style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8 }}>
                    <span style={{ color: '#717171' }}>{label}</span>
                    <span><b style={{ color: MATRIX_STYLE[p.cells[k].state] }}>{CELL_LABEL[p.cells[k].state]}</b>. {p.cells[k].note}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = { background: '#111', color: '#fff', border: 0, borderRadius: 9, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
