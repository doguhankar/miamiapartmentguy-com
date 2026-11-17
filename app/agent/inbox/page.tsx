'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message, Note, SocialAccount } from '@/lib/inbox/types'
import { countViews, inView, replyStatusLabel, VIEW_LABELS, type ViewKey } from '@/lib/inbox/views'
import { DEMO_ACCOUNTS, DEMO_CONVERSATIONS, DEMO_ME, DEMO_MESSAGES, DEMO_NOTES } from '@/lib/inbox/demo-data'

// ── /agent/inbox — MAG social conversation dashboard ─────────────────────────
// Desktop: 4 panes (filters | list | conversation | details). Mobile: stacked screens.
// Honesty rules: no unread/read/delivery receipts are invented, and "waiting" views only
// include conversations where the integration supplied inbound AND outbound events.
// Demo mode (?demo=1) uses a static synthetic fixture, never written anywhere.

type AuthStatus = 'loading' | 'idle' | 'denied' | 'approved'
type LeadLite = { id: number; name: string | null; stage: string | null; phone: string | null; building_name: string | null; budget: string | null; move_in_timing: string | null }
type Grant = { viewTeam: boolean; reassign: boolean; send: boolean }
type Mobile = 'filters' | 'list' | 'thread' | 'details'

const C = { bg: '#F7F7F5', surface: '#FFFFFF', border: '#EBEBEB', ink: '#111111', text: '#222222', muted: '#717171', faint: '#B0B0B0', pink: '#E0447B', pinkSoft: '#FDEEF3', green: '#0F6E56', greenSoft: '#E7F7F1', blue: '#2F80ED', amber: '#B45309', amberSoft: '#FEF3E2', red: '#B42318', redSoft: '#FEECEB' }
const PROVIDER_LABEL: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', manychat: 'Manychat' }
const VIEWS = Object.keys(VIEW_LABELS) as ViewKey[]

function timeAgo(iso: string | null) {
  if (!iso) return ''
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).format(new Date(iso))
}
const clock = (iso: string) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date(iso))
const dayLabel = (iso: string) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }).format(new Date(iso))
const nm = (c: Conversation) => c.contact_name || c.contact_handle || c.contact_phone || 'Unknown'
const short = (email: string | null) => (email ? email.split('@')[0] : 'Unassigned')
// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm"
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <Inbox />
    </Suspense>
  )
}

function Inbox() {
  const demo = useSearchParams().get('demo') === '1'
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [me, setMe] = useState<{ email: string; name: string } | null>(null)
  const [grant, setGrant] = useState<Grant | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [convos, setConvos] = useState<Conversation[]>([])
  const [leads, setLeads] = useState<Record<number, LeadLite>>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [agents, setAgents] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [view, setView] = useState<ViewKey>('new')
  const [query, setQuery] = useState('')
  const [mobile, setMobile] = useState<Mobile>('list')
  const [toast, setToast] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [leadDraft, setLeadDraft] = useState({ name: '', phone: '' })
  const [leadPick, setLeadPick] = useState('')

  const sbRef = useRef<ReturnType<typeof createClient> | null>(null)
  const openIdRef = useRef<string | null>(null)
  openIdRef.current = openId
  const showToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 3400)
  }

  // ── demo mode: static fixture, local state only ──
  useEffect(() => {
    if (!demo) return
    setAuthStatus('approved')
    setMe({ email: DEMO_ME, name: 'Demo Agent' })
    setGrant({ viewTeam: false, reassign: false, send: false })
    setAccounts(DEMO_ACCOUNTS)
    setConvos(DEMO_CONVERSATIONS)
    setAgents([DEMO_ME])
  }, [demo])

  const loadAll = useCallback(async () => {
    const sb = sbRef.current
    if (!sb) return
    const [{ data: cv, error }, { data: acc }] = await Promise.all([
      sb.from('inbox_conversations').select('*').order('last_message_at', { ascending: false, nullsFirst: false }).limit(300),
      sb.from('social_accounts').select('id,provider,owner_email,label,external_account_id,handle,status,capabilities,granted_scopes,last_sync_at,last_success_at,last_error,last_error_at'),
    ])
    if (error) return showToast(`Could not load inbox: ${error.message}`)
    const list = (cv ?? []) as Conversation[]
    setConvos(list)
    setAccounts((acc ?? []) as SocialAccount[])
    const ids = Array.from(new Set(list.map(c => c.lead_id).filter((x): x is number => x != null)))
    if (ids.length) {
      const { data: ld } = await sb.from('leads').select('id,name,stage,phone,building_name,budget,move_in_timing').in('id', ids)
      setLeads(Object.fromEntries(((ld ?? []) as LeadLite[]).map(l => [l.id, l])))
    }
  }, [])

  const loadThread = useCallback(async (id: string) => {
    const sb = sbRef.current
    if (!sb) return
    const [{ data: ms }, { data: ns }] = await Promise.all([
      sb.from('inbox_messages').select('id,conversation_id,direction,body,sender_name,sent_at').eq('conversation_id', id).order('sent_at', { ascending: true }).limit(500),
      sb.from('inbox_notes').select('id,conversation_id,author_email,body,created_at').eq('conversation_id', id).order('created_at', { ascending: true }).limit(200),
    ])
    if (openIdRef.current === id) {
      setMessages((ms ?? []) as Message[])
      setNotes((ns ?? []) as Note[])
    }
  }, [])

  // ── live auth ──
  useEffect(() => {
    if (demo) return
    if (!sbRef.current) sbRef.current = createClient()
    const sb = sbRef.current
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const email = (session.user.email ?? '').toLowerCase()
        const name = session.user.user_metadata?.full_name || email.split('@')[0] || 'Agent'
        setTimeout(async () => {
          setMe({ email, name })
          const { data: ok } = await sb.from('agent_allowlist').select('approved').ilike('email', email).eq('approved', true).maybeSingle()
          if (!ok) return setAuthStatus('denied')
          const { data: role } = await sb.from('inbox_team_roles').select('can_view_team,can_reassign,can_send_client_messages,revoked_at').ilike('email', email).is('revoked_at', null).maybeSingle()
          setGrant(role ? { viewTeam: !!role.can_view_team, reassign: !!role.can_reassign, send: !!role.can_send_client_messages } : null)
          const { data: al } = await sb.from('agent_allowlist').select('email').eq('approved', true)
          setAgents(Array.from(new Set([email, ...((al ?? []) as { email: string }[]).map(a => a.email.toLowerCase())])))
          setAuthStatus('approved')
          loadAll()
        }, 0)
      } else if (event === 'INITIAL_SESSION' && !session?.user) setAuthStatus('idle')
      else if (event === 'SIGNED_OUT') {
        setMe(null)
        setAuthStatus('idle')
      }
    })
    return () => subscription?.unsubscribe()
  }, [demo, loadAll])

  // ── realtime ──
  useEffect(() => {
    if (demo || authStatus !== 'approved') return
    const sb = sbRef.current
    if (!sb) return
    const ch = sb
      .channel('social-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_conversations' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_accounts' }, () => loadAll())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_messages' }, (p: { new: { conversation_id?: string } }) => {
        if (p.new?.conversation_id === openIdRef.current) loadThread(p.new.conversation_id!)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_notes' }, (p: { new: { conversation_id?: string } }) => {
        if (p.new?.conversation_id === openIdRef.current) loadThread(p.new.conversation_id!)
      })
      .subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }, [demo, authStatus, loadAll, loadThread])

  const open = convos.find(c => c.id === openId) ?? null
  const openLead = open?.lead_id ? leads[open.lead_id] : undefined
  const openAccount = open ? accounts.find(a => a.id === open.account_id) : undefined

  const openConvo = (c: Conversation) => {
    setOpenId(c.id)
    setMobile('thread')
    setLeadDraft({ name: c.contact_name ?? '', phone: c.contact_phone ?? '' })
    setLeadPick('')
    if (demo) {
      setMessages(DEMO_MESSAGES[c.id] ?? [])
      setNotes(DEMO_NOTES[c.id] ?? [])
      return
    }
    setMessages([])
    setNotes([])
    loadThread(c.id)
    if (c.unread_count > 0) {
      sbRef.current?.from('inbox_conversations').update({ unread_count: 0 }).eq('id', c.id).then(() => setConvos(p => p.map(x => (x.id === c.id ? { ...x, unread_count: 0 } : x))))
    }
  }

  // one place for every conversation edit: RLS + the guard trigger decide in live mode
  const patch = async (c: Conversation, fields: Partial<Pick<Conversation, 'assigned_to' | 'next_action' | 'follow_up_at' | 'status'>>, ok?: string) => {
    if (demo) {
      setConvos(p => p.map(x => (x.id === c.id ? { ...x, ...fields } : x)))
      return ok && showToast(`${ok} (demo only)`)
    }
    const { error } = await sbRef.current!.from('inbox_conversations').update(fields).eq('id', c.id)
    if (error) return showToast(error.code === '42501' ? 'Not allowed: you do not have access to do that.' : `Could not save: ${error.message}`)
    setConvos(p => p.map(x => (x.id === c.id ? { ...x, ...fields } : x)))
    if (ok) showToast(ok)
  }

  const addNote = async () => {
    const body = noteText.trim()
    if (!open || !body || !me) return
    if (demo) {
      setNotes(p => [...p, { id: `dn-${Date.now()}`, conversation_id: open.id, author_email: me.email, body, created_at: new Date().toISOString() }])
      setNoteText('')
      return showToast('Note added (demo only)')
    }
    const { error } = await sbRef.current!.from('inbox_notes').insert({ conversation_id: open.id, author_email: me.email, body })
    if (error) return showToast(`Could not add note: ${error.message}`)
    setNoteText('')
    loadThread(open.id)
  }

  const callLeadApi = async (payload: object) => {
    if (!open) return
    if (demo) return showToast('Lead linking is disabled in demo mode')
    const { data: s } = await sbRef.current!.auth.getSession()
    const res = await fetch(`/api/inbox/conversations/${open.id}/lead`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${s.session?.access_token ?? ''}` },
      body: JSON.stringify(payload),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) return showToast(j.error ?? 'Could not update the lead')
    showToast(j.created ? 'Lead created and linked' : 'Lead linked')
    loadAll()
  }

  const accountOf = (c: Conversation) => accounts.find(a => a.id === c.account_id)
  const inAccount = useCallback((c: Conversation) => accountFilter === 'all' || c.account_id === accountFilter, [accountFilter])
  const scoped = useMemo(() => convos.filter(inAccount), [convos, inAccount])
  const counts = useMemo(() => countViews(scoped), [scoped])
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped.filter(c => inView(c, view) && (!q || [nm(c), c.contact_handle, c.last_message_preview, c.next_action].filter(Boolean).join(' ').toLowerCase().includes(q)))
  }, [scoped, view, query])

  if (authStatus !== 'approved') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', padding: 16, fontFamily: '"Inter", sans-serif' }}>
        <div style={{ background: C.surface, borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <Wordmark />
          <p style={{ color: C.muted, fontSize: 14, margin: '18px 0 20px' }}>
            {authStatus === 'loading' ? 'Loading…' : authStatus === 'denied' ? 'This account is not currently approved for agent access.' : 'Sign in on the agent portal to see your inbox.'}
          </p>
          {authStatus !== 'loading' && <a href="/agent" className="ib-link-btn">Go to agent portal</a>}
        </div>
      </div>
    )
  }

  const canReassign = !!grant?.reassign
  const mineOrUnassigned = (c: Conversation) => !c.assigned_to || c.assigned_to.toLowerCase() === me?.email
  const assignOptions = canReassign ? agents : agents.filter(a => a === me?.email)
  const accountsWithNoMessages = accounts.filter(a => a.status === 'connected' && !a.capabilities.receive_messages)

  return (
    <div className="ib">
      <style>{css}</style>
      <div className="ib-top">
        <div className="ib-top-left">
          <Wordmark />
          <nav className="ib-nav">
            <a href="/agent">Pipeline</a>
            <a href="/agent/inbox" aria-current="page">Inbox</a>
            <a href="/agent/inbox/connections">Connections</a>
            <a href="/agent/invoices">Invoices</a>
          </nav>
        </div>
        <div className="ib-user">{grant?.viewTeam ? <span className="ib-pill">Team view</span> : null}<span className="ib-user-name">{me?.name}</span></div>
      </div>
      {demo && (
        <div className="ib-demo" role="status">
          DEMO MODE: synthetic sample data. Nothing here is real, saved, or connected. <a href="/agent/inbox">Exit demo</a>
        </div>
      )}

      <div className="ib-mtabs">
        {(['filters', 'list', 'thread', 'details'] as Mobile[]).map(t => (
          <button key={t} className={mobile === t ? 'on' : ''} onClick={() => setMobile(t)} disabled={(t === 'thread' || t === 'details') && !open}>
            {t === 'filters' ? 'Filters' : t === 'list' ? 'Chats' : t === 'thread' ? 'Chat' : 'Details'}
          </button>
        ))}
      </div>

      <div className="ib-body" data-m={mobile}>
        {/* pane 1: account + view filters */}
        <aside className="ib-filters">
          <h3>Accounts</h3>
          {[{ id: 'all', label: 'All accounts', sub: '' }, ...accounts.map(a => ({ id: a.id, label: a.label, sub: a.status }))].map(a => (
            <button key={a.id} className={`ib-f${accountFilter === a.id ? ' on' : ''}`} onClick={() => { setAccountFilter(a.id); setMobile('list') }}>
              <span>{a.label}</span>
              {a.sub && a.sub !== 'connected' && <em className="ib-state">{a.sub.replace('_', ' ')}</em>}
            </button>
          ))}
          {accounts.length === 0 && <p className="ib-hint">No accounts set up yet. Open Connections to start.</p>}
          <h3>Views</h3>
          {VIEWS.map(v => (
            <button key={v} className={`ib-f${view === v ? ' on' : ''}`} onClick={() => { setView(v); setMobile('list') }}>
              <span>{VIEW_LABELS[v]}</span>
              <b className="ib-n">{counts[v]}</b>
            </button>
          ))}
        </aside>

        {/* pane 2: list */}
        <section className="ib-list">
          <div className="ib-list-head">
            <input className="ib-search" placeholder="Search name, handle, message…" value={query} onChange={e => setQuery(e.target.value)} />
            <div className="ib-list-title">{VIEW_LABELS[view]} · {accountFilter === 'all' ? 'all accounts' : accounts.find(a => a.id === accountFilter)?.label}</div>
          </div>
          {accountsWithNoMessages.length > 0 && (
            <div className="ib-note-box">Message sync has not been observed yet for: {accountsWithNoMessages.map(a => a.label).join(', ')}. Conversations appear after the first message event arrives.</div>
          )}
          <div className="ib-rows">
            {visible.length === 0 && <div className="ib-empty">{convos.length === 0 ? 'No conversations yet. Connect an account on the Connections screen, or look around in demo mode.' : 'Nothing in this view.'}</div>}
            {visible.map(c => {
              const a = accountOf(c)
              return (
                <button key={c.id} className={`ib-row${openId === c.id ? ' sel' : ''}`} onClick={() => openConvo(c)}>
                  <div className="ib-row-top">
                    <span className="ib-row-name">{nm(c)}</span>
                    <span className="ib-row-time">{timeAgo(c.last_message_at)}</span>
                  </div>
                  <div className="ib-row-prev">{c.last_message_preview || '—'}</div>
                  <div className="ib-row-tags">
                    <span className="ib-tag src">{a?.label ?? PROVIDER_LABEL[c.channel] ?? c.channel}</span>
                    <span className={`ib-tag ${c.assigned_to ? 'who' : 'none'}`}>{c.assigned_to ? short(c.assigned_to) : 'Unassigned'}</span>
                    {c.reply_status === 'unavailable' && <span className="ib-tag na">reply status unavailable</span>}
                    {c.reply_status === 'waiting_us' && <span className="ib-tag reply">waiting on us</span>}
                    {c.unread_count > 0 && <span className="ib-badge" title="New in MAG since you last opened it. Not an Instagram/TikTok read receipt.">{c.unread_count} new</span>}
                  </div>
                  {c.next_action && <div className="ib-row-next">Next: {c.next_action}</div>}
                </button>
              )
            })}
          </div>
        </section>

        {/* pane 3: conversation */}
        <section className="ib-thread">
          {!open ? (
            <div className="ib-thread-empty">Pick a conversation</div>
          ) : (
            <>
              <div className="ib-thread-head">
                <button className="ib-back" onClick={() => setMobile('list')} aria-label="Back">←</button>
                <div className="ib-thread-who">
                  <div className="ib-thread-name">{nm(open)}</div>
                  <div className="ib-thread-sub">{openAccount?.label ?? open.channel}{open.contact_handle ? ` · ${open.contact_handle}` : ''} · {replyStatusLabel(open)}</div>
                </div>
                <button className="ib-btn mob" onClick={() => setMobile('details')}>Details</button>
              </div>
              <div className="ib-msgs">
                {messages.length === 0 && <div className="ib-empty">{open.last_message_preview ? 'No messages stored for this conversation.' : 'This is a contact record. No message history was provided by this integration.'}</div>}
                {messages.map((m, i) => (
                  <div key={m.id}>
                    {(i === 0 || dayLabel(messages[i - 1].sent_at) !== dayLabel(m.sent_at)) && <div className="ib-day">{dayLabel(m.sent_at)}</div>}
                    <div className={`ib-msg ${m.direction}`}>
                      <div className="ib-bubble">{m.body}</div>
                      <div className="ib-meta">{m.direction === 'outbound' ? 'Sent' : 'Received'} {clock(m.sent_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ib-notes">
                <div className="ib-notes-h">Internal notes <span>(team only, never sent to the client)</span></div>
                {notes.map(n => (
                  <div key={n.id} className="ib-notecard">
                    <div>{n.body}</div>
                    <small>{short(n.author_email)} · {dayLabel(n.created_at)} {clock(n.created_at)}</small>
                  </div>
                ))}
                <div className="ib-note-add">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add an internal note…" onKeyDown={e => e.key === 'Enter' && addNote()} />
                  <button className="ib-btn" onClick={addNote} disabled={!noteText.trim()}>Add note</button>
                </div>
              </div>
              <div className="ib-foot">
                {grant?.send ? 'Replying from MAG is not enabled in this release.' : 'Reply from Instagram / TikTok directly. MAG does not send client messages.'}
                {open.conversation_url && <> · <a href={open.conversation_url} target="_blank" rel="noopener noreferrer">Open native conversation</a></>}
              </div>
            </>
          )}
        </section>

        {/* pane 4: details */}
        <aside className="ib-details">
          {!open ? (
            <div className="ib-thread-empty">Details</div>
          ) : (
            <>
              <button className="ib-back" onClick={() => setMobile('thread')}>← Chat</button>
              <h3>Client</h3>
              <div className="ib-kv"><span>Name</span><b>{nm(open)}</b></div>
              {open.contact_handle && <div className="ib-kv"><span>Handle</span><b>{open.contact_handle}</b></div>}
              <div className="ib-kv"><span>Source</span><b>{openAccount?.label ?? open.channel}</b></div>
              <div className="ib-kv"><span>Reply status</span><b>{replyStatusLabel(open)}</b></div>
              {open.reply_status === 'unavailable' && <p className="ib-hint">This integration has not supplied both incoming and outgoing events, so MAG will not guess who owes a reply.</p>}

              <h3>Assignment</h3>
              <select
                value={open.assigned_to ?? ''}
                disabled={!canReassign && !mineOrUnassigned(open)}
                onChange={e => patch(open, { assigned_to: e.target.value || null }, e.target.value ? `Assigned to ${short(e.target.value)}` : 'Unassigned')}
              >
                <option value="">Unassigned</option>
                {Array.from(new Set([...(open.assigned_to ? [open.assigned_to.toLowerCase()] : []), ...assignOptions])).map(a => (
                  <option key={a} value={a}>{short(a)}{a === me?.email ? ' (me)' : ''}</option>
                ))}
              </select>
              {!canReassign && <p className="ib-hint">You can take an unassigned conversation or release your own. Moving it to someone else needs a team-lead reassign grant.</p>}

              <h3>Next action</h3>
              <input key={open.id + 'na'} defaultValue={open.next_action ?? ''} placeholder="e.g. Send 3 Edgewater options" onBlur={e => e.target.value !== (open.next_action ?? '') && patch(open, { next_action: e.target.value.trim() || null }, 'Next action saved')} />
              <h3>Follow-up</h3>
              <input key={open.id + 'fu'} type="datetime-local" defaultValue={toLocalInput(open.follow_up_at)} onBlur={e => patch(open, { follow_up_at: e.target.value ? new Date(e.target.value).toISOString() : null }, 'Follow-up saved')} />

              <h3>CRM lead</h3>
              {open.lead_id ? (
                <div className="ib-leadbox">
                  <b>{openLead?.name ?? `Lead #${open.lead_id}`}</b>
                  <div>{[openLead?.stage, openLead?.budget && `Budget ${openLead.budget}`, openLead?.move_in_timing, openLead?.building_name].filter(Boolean).join(' · ') || 'Linked'}</div>
                </div>
              ) : (
                <>
                  <p className="ib-hint">A DM is not a lead until you link or create one.</p>
                  <div className="ib-inline">
                    <input value={leadPick} onChange={e => setLeadPick(e.target.value)} placeholder="Existing lead # (from Pipeline)" inputMode="numeric" />
                    <button className="ib-btn" disabled={!leadPick.trim()} onClick={() => callLeadApi({ mode: 'link', leadId: Number(leadPick) })}>Link</button>
                  </div>
                  <input value={leadDraft.name} onChange={e => setLeadDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name for a new lead" />
                  <input value={leadDraft.phone} onChange={e => setLeadDraft(d => ({ ...d, phone: e.target.value }))} placeholder="Phone (optional)" inputMode="tel" />
                  <button className="ib-btn pri" onClick={() => callLeadApi({ mode: 'create', ...leadDraft })}>Create lead and link</button>
                </>
              )}

              <button className="ib-btn" style={{ marginTop: 16 }} onClick={() => patch(open, { status: open.status === 'closed' ? 'open' : 'closed' }, open.status === 'closed' ? 'Reopened' : 'Marked resolved')}>
                {open.status === 'closed' ? 'Reopen' : 'Mark resolved'}
              </button>
            </>
          )}
        </aside>
      </div>
      {toast && <div className="ib-toast">{toast}</div>}
    </div>
  )
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span style={{ fontFamily: '"Archivo", sans-serif', fontWeight: 900, fontSize: 17, color: C.ink }}>MIAMI APARTMENT</span>
      <span style={{ fontFamily: '"Archivo", sans-serif', fontWeight: 900, fontSize: 17, color: C.pink }}>GUY</span>
    </div>
  )
}

const css = `
.ib { height: 100dvh; display: flex; flex-direction: column; background: ${C.bg}; color: ${C.text}; font-family: "Inter", sans-serif; }
.ib * { box-sizing: border-box; }
.ib-link-btn { display: inline-block; background: ${C.pink}; color: #fff; padding: 11px 18px; border-radius: 10px; font-weight: 600; font-size: 14px; text-decoration: none; }
.ib-top { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: ${C.surface}; border-bottom: 1px solid ${C.border}; gap: 12px; }
.ib-top-left { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; min-width: 0; }
.ib-nav { display: flex; gap: 16px; }
.ib-nav a { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 700; color: ${C.faint}; text-decoration: none; }
.ib-nav a[aria-current="page"] { color: ${C.pink}; }
.ib-user { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${C.muted}; }
.ib-pill { background: ${C.greenSoft}; color: ${C.green}; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; }
.ib-demo { background: ${C.amberSoft}; color: ${C.amber}; padding: 8px 16px; font-size: 12px; font-weight: 700; text-align: center; border-bottom: 1px solid #F5D9AC; }
.ib-demo a { color: inherit; margin-left: 8px; }
.ib-mtabs { display: none; }
.ib-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 220px 340px minmax(0, 1fr) 300px; }
.ib-filters, .ib-details { background: ${C.surface}; overflow-y: auto; padding: 14px; }
.ib-filters { border-right: 1px solid ${C.border}; }
.ib-details { border-left: 1px solid ${C.border}; }
.ib h3 { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: ${C.faint}; margin: 16px 0 6px; font-weight: 800; }
.ib h3:first-child { margin-top: 0; }
.ib-f { display: flex; justify-content: space-between; align-items: center; gap: 6px; width: 100%; text-align: left; border: 0; background: transparent; padding: 8px 10px; border-radius: 8px; font-size: 13px; font-weight: 600; color: ${C.text}; cursor: pointer; }
.ib-f:hover { background: ${C.bg}; }
.ib-f.on { background: ${C.ink}; color: #fff; }
.ib-n { background: ${C.pink}; color: #fff; border-radius: 999px; font-size: 10px; padding: 1px 7px; }
.ib-state { font-style: normal; font-size: 9px; text-transform: uppercase; color: ${C.amber}; background: ${C.amberSoft}; padding: 2px 6px; border-radius: 6px; font-weight: 800; }
.ib-hint { font-size: 12px; color: ${C.muted}; margin: 6px 0; line-height: 1.4; }
.ib-list { display: flex; flex-direction: column; min-height: 0; background: ${C.surface}; border-right: 1px solid ${C.border}; }
.ib-list-head { padding: 12px; border-bottom: 1px solid ${C.border}; }
.ib-list-title { font-size: 11px; color: ${C.muted}; margin-top: 8px; font-weight: 600; }
.ib-search, .ib-details input, .ib-details select, .ib-note-add input { width: 100%; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 10px; padding: 9px 12px; font-size: 14px; outline: none; margin-bottom: 6px; }
.ib-search:focus, .ib-details input:focus { border-color: ${C.pink}; }
.ib-note-box { margin: 10px 12px 0; font-size: 12px; color: ${C.amber}; background: ${C.amberSoft}; padding: 8px 10px; border-radius: 8px; }
.ib-rows { flex: 1; overflow-y: auto; }
.ib-empty { padding: 28px 18px; color: ${C.muted}; font-size: 13px; text-align: center; }
.ib-row { display: block; width: 100%; text-align: left; background: ${C.surface}; border: 0; border-bottom: 1px solid ${C.border}; padding: 12px 14px; cursor: pointer; }
.ib-row:hover { background: #FAFAF8; }
.ib-row.sel { background: ${C.pinkSoft}; }
.ib-row-top { display: flex; gap: 8px; }
.ib-row-name { flex: 1; font-size: 14px; font-weight: 700; color: ${C.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ib-row-time { font-size: 11px; color: ${C.faint}; }
.ib-row-prev { margin: 3px 0 6px; font-size: 13px; color: ${C.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ib-row-tags { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.ib-tag { font-size: 10px; font-weight: 800; border-radius: 6px; padding: 2px 6px; }
.ib-tag.src { color: ${C.blue}; background: #EAF2FE; }
.ib-tag.who { color: ${C.green}; background: ${C.greenSoft}; }
.ib-tag.none { color: ${C.muted}; background: ${C.bg}; }
.ib-tag.na { color: ${C.muted}; background: ${C.bg}; font-weight: 600; }
.ib-tag.reply { color: ${C.amber}; background: ${C.amberSoft}; }
.ib-badge { margin-left: auto; background: ${C.pink}; color: #fff; border-radius: 999px; font-size: 10px; font-weight: 800; padding: 2px 7px; }
.ib-row-next { margin-top: 6px; font-size: 12px; color: ${C.text}; font-weight: 600; }
.ib-thread { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.ib-thread-empty { margin: auto; color: ${C.faint}; font-size: 14px; padding: 20px; }
.ib-thread-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: ${C.surface}; border-bottom: 1px solid ${C.border}; }
.ib-back { display: none; border: 0; background: transparent; font-size: 15px; font-weight: 700; padding: 2px 6px; cursor: pointer; color: ${C.ink}; }
.ib-thread-who { flex: 1; min-width: 0; }
.ib-thread-name { font-size: 16px; font-weight: 800; color: ${C.ink}; }
.ib-thread-sub { font-size: 12px; color: ${C.muted}; margin-top: 2px; }
.ib-btn { border: 1px solid ${C.border}; background: ${C.surface}; border-radius: 9px; padding: 8px 12px; font-size: 12px; font-weight: 700; cursor: pointer; color: ${C.text}; }
.ib-btn.pri { background: ${C.ink}; border-color: ${C.ink}; color: #fff; width: 100%; }
.ib-btn:disabled { opacity: .45; cursor: default; }
.ib-btn.mob { display: none; }
.ib-inline { display: flex; gap: 6px; } .ib-inline input { margin-bottom: 6px; }
.ib-msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 6px; min-height: 120px; }
.ib-day { text-align: center; font-size: 11px; color: ${C.faint}; margin: 10px 0 4px; font-weight: 600; }
.ib-msg { display: flex; flex-direction: column; max-width: 78%; }
.ib-msg.inbound { align-items: flex-start; } .ib-msg.outbound { align-items: flex-end; margin-left: auto; }
.ib-bubble { padding: 9px 13px; border-radius: 18px; font-size: 14px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
.ib-msg.inbound .ib-bubble { background: #ECECEA; color: ${C.ink}; }
.ib-msg.outbound .ib-bubble { background: ${C.blue}; color: #fff; }
.ib-meta { font-size: 10px; color: ${C.faint}; margin: 2px 6px 0; }
.ib-notes { border-top: 2px dashed ${C.amber}; background: ${C.amberSoft}; padding: 10px 14px; max-height: 38%; overflow-y: auto; }
.ib-notes-h { font-size: 11px; font-weight: 800; color: ${C.amber}; text-transform: uppercase; margin-bottom: 6px; } .ib-notes-h span { text-transform: none; font-weight: 600; }
.ib-notecard { background: #fff; border: 1px solid #F5D9AC; border-radius: 8px; padding: 8px 10px; font-size: 13px; margin-bottom: 6px; } .ib-notecard small { color: ${C.muted}; }
.ib-note-add { display: flex; gap: 6px; } .ib-note-add input { margin: 0; }
.ib-foot { padding: 10px 16px; background: ${C.surface}; border-top: 1px solid ${C.border}; font-size: 12px; color: ${C.muted}; text-align: center; }
.ib-kv { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; padding: 4px 0; } .ib-kv span { color: ${C.muted}; } .ib-kv b { text-align: right; }
.ib-leadbox { background: ${C.greenSoft}; color: ${C.green}; border-radius: 10px; padding: 10px; font-size: 13px; }
.ib-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: ${C.ink}; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; z-index: 50; max-width: 90vw; }
@media (max-width: 1100px) { .ib-body { grid-template-columns: 200px 300px minmax(0, 1fr); } .ib-details { display: none; } .ib-btn.mob { display: block; } .ib-body[data-m="details"] .ib-details { display: block; position: fixed; inset: 0; z-index: 30; } .ib-body[data-m="details"] .ib-details .ib-back { display: block; } }
@media (max-width: 760px) {
  .ib-mtabs { display: flex; background: ${C.surface}; border-bottom: 1px solid ${C.border}; }
  .ib-mtabs button { flex: 1; border: 0; background: transparent; padding: 11px 4px; font-size: 12px; font-weight: 800; color: ${C.faint}; border-bottom: 2px solid transparent; }
  .ib-mtabs button.on { color: ${C.pink}; border-bottom-color: ${C.pink}; }
  .ib-mtabs button:disabled { opacity: .4; }
  .ib-body { display: block; position: relative; }
  .ib-body > * { display: none !important; height: 100%; width: 100%; border: 0; }
  .ib-body[data-m="filters"] .ib-filters, .ib-body[data-m="list"] .ib-list, .ib-body[data-m="details"] .ib-details { display: block !important; position: static; }
  .ib-body[data-m="list"] .ib-list { display: flex !important; }
  .ib-body[data-m="thread"] .ib-thread { display: flex !important; }
  .ib-back { display: block; } .ib-btn.mob { display: none; }
  .ib-nav { gap: 10px; } .ib-user-name { display: none; } .ib-top { padding: 8px 12px; }
}
`
