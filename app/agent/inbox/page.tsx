'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── /agent/inbox — one inbox for every channel ────────────────────────────────
// iMessage/SMS (BlueBubbles) and Instagram DMs land here through the
// inbox-imessage-webhook / inbox-instagram-webhook edge functions.
// Each agent only sees their own conversations (Supabase RLS on agent_id).
// Read-only for now: reply from iMessage / Instagram and it shows up here instantly.

type ChannelKey = 'imessage' | 'sms' | 'instagram' | 'messenger' | 'facebook_marketplace' | 'tiktok' | 'email' | 'other'

type Convo = {
  id: string
  agent_id: string
  lead_id: number | null
  channel: ChannelKey
  contact_name: string | null
  contact_phone: string | null
  contact_handle: string | null
  status: 'open' | 'snoozed' | 'closed'
  unread_count: number
  last_message_at: string | null
  last_message_preview: string | null
  last_inbound_at: string | null
  created_at: string
}

type Msg = {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  body: string | null
  sender_name: string | null
  is_automated: boolean
  sent_at: string
}

type LeadLite = {
  id: number
  name: string | null
  stage: string | null
  phone: string | null
  building_name: string | null
  budget: string | null
  move_in_timing: string | null
}

type AuthStatus = 'loading' | 'idle' | 'denied' | 'approved'
type Filter = 'all' | 'unread' | 'needs_reply' | 'closed'
type ChannelFilter = 'all' | 'text' | 'instagram'

const C = {
  bg: '#F7F7F5',
  surface: '#FFFFFF',
  border: '#EBEBEB',
  ink: '#111111',
  text: '#222222',
  muted: '#717171',
  faint: '#B0B0B0',
  pink: '#E0447B',
  pinkSoft: '#FDEEF3',
  green: '#0F6E56',
  greenSoft: '#E7F7F1',
  blue: '#2F80ED',
  amber: '#B45309',
  amberSoft: '#FEF3E2',
}

const CHANNEL_META: Record<ChannelKey, { label: string; color: string }> = {
  imessage: { label: 'iMessage', color: C.blue },
  sms: { label: 'SMS', color: '#34A853' },
  instagram: { label: 'Instagram', color: '#C13584' },
  messenger: { label: 'Messenger', color: '#0A7CFF' },
  facebook_marketplace: { label: 'Marketplace', color: '#1877F2' },
  tiktok: { label: 'TikTok', color: '#111111' },
  email: { label: 'Email', color: C.muted },
  other: { label: 'Other', color: C.muted },
}

function displayName(c: Convo, lead?: LeadLite) {
  return lead?.name || c.contact_name || c.contact_handle || c.contact_phone || 'Unknown'
}

function timeAgo(iso: string | null) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).format(new Date(iso))
}

function clock(iso: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date(iso))
}

function dayLabel(iso: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }).format(new Date(iso))
}

function needsReply(c: Convo) {
  if (c.status === 'closed' || !c.last_inbound_at || !c.last_message_at) return false
  return new Date(c.last_inbound_at).getTime() >= new Date(c.last_message_at).getTime()
}

export default function InboxPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [convos, setConvos] = useState<Convo[]>([])
  const [leads, setLeads] = useState<Record<number, LeadLite>>({})
  const [messages, setMessages] = useState<Msg[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const sbRef = useRef<ReturnType<typeof createClient> | null>(null)
  const openIdRef = useRef<string | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  openIdRef.current = openId

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const loadConvos = useCallback(async () => {
    const sb = sbRef.current
    if (!sb) return
    const { data, error } = await sb
      .from('inbox_conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(300)
    if (error) {
      showToast(`Could not load inbox: ${error.message}`)
      return
    }
    const list = (data ?? []) as Convo[]
    setConvos(list)
    const ids = Array.from(new Set(list.map(c => c.lead_id).filter((x): x is number => x != null)))
    if (ids.length) {
      const { data: ld } = await sb.from('leads').select('id,name,stage,phone,building_name,budget,move_in_timing').in('id', ids)
      setLeads(Object.fromEntries(((ld ?? []) as LeadLite[]).map(l => [l.id, l])))
    }
  }, [])

  const loadMessages = useCallback(async (id: string) => {
    const sb = sbRef.current
    if (!sb) return
    const { data, error } = await sb
      .from('inbox_messages')
      .select('id,conversation_id,direction,body,sender_name,is_automated,sent_at')
      .eq('conversation_id', id)
      .order('sent_at', { ascending: true })
      .limit(500)
    if (error) {
      showToast(`Could not load messages: ${error.message}`)
      return
    }
    if (openIdRef.current === id) setMessages((data ?? []) as Msg[])
  }, [])

  const markRead = useCallback(async (id: string) => {
    const sb = sbRef.current
    if (!sb) return
    await sb.from('inbox_conversations').update({ unread_count: 0 }).eq('id', id)
    setConvos(prev => prev.map(c => (c.id === id ? { ...c, unread_count: 0 } : c)))
  }, [])

  // auth + initial load
  useEffect(() => {
    if (!sbRef.current) sbRef.current = createClient()
    const sb = sbRef.current
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const email = (session.user.email ?? '').toLowerCase()
        const name = session.user.user_metadata?.full_name || email.split('@')[0] || 'Agent'
        setTimeout(async () => {
          setUser({ email, name })
          const { data } = await sb.from('agent_allowlist').select('approved').ilike('email', email).eq('approved', true).maybeSingle()
          if (!data) {
            setAuthStatus('denied')
            return
          }
          setAuthStatus('approved')
          loadConvos()
        }, 0)
      } else if (event === 'INITIAL_SESSION' && !session?.user) {
        setAuthStatus('idle')
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthStatus('idle')
      }
    })
    return () => subscription?.unsubscribe()
  }, [loadConvos])

  // live updates
  useEffect(() => {
    if (authStatus !== 'approved') return
    const sb = sbRef.current
    if (!sb) return
    const ch = sb
      .channel('agent-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_conversations' }, () => {
        loadConvos()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_messages' }, (payload: { new: { conversation_id?: string } }) => {
        if (payload.new?.conversation_id && payload.new.conversation_id === openIdRef.current) {
          loadMessages(payload.new.conversation_id)
        }
      })
      .subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }, [authStatus, loadConvos, loadMessages])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, openId])

  const openConvo = (c: Convo) => {
    setOpenId(c.id)
    setMessages([])
    loadMessages(c.id)
    if (c.unread_count > 0) markRead(c.id)
  }

  const setStatus = async (c: Convo, status: Convo['status']) => {
    const sb = sbRef.current
    if (!sb) return
    const { error } = await sb.from('inbox_conversations').update({ status }).eq('id', c.id)
    if (error) {
      showToast(`Could not update: ${error.message}`)
      return
    }
    setConvos(prev => prev.map(x => (x.id === c.id ? { ...x, status } : x)))
    showToast(status === 'closed' ? 'Conversation closed' : 'Conversation reopened')
  }

  const unreadTotal = useMemo(() => convos.reduce((n, c) => n + (c.status === 'closed' ? 0 : c.unread_count), 0), [convos])
  const needsReplyCount = useMemo(() => convos.filter(needsReply).length, [convos])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return convos.filter(c => {
      if (filter === 'closed') {
        if (c.status !== 'closed') return false
      } else if (c.status === 'closed') {
        return false
      }
      if (filter === 'unread' && c.unread_count === 0) return false
      if (filter === 'needs_reply' && !needsReply(c)) return false
      if (channelFilter === 'text' && c.channel !== 'imessage' && c.channel !== 'sms') return false
      if (channelFilter === 'instagram' && c.channel !== 'instagram') return false
      if (q) {
        const lead = c.lead_id ? leads[c.lead_id] : undefined
        const hay = [displayName(c, lead), c.contact_phone, c.contact_handle, c.last_message_preview].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [convos, leads, filter, channelFilter, query])

  const open = convos.find(c => c.id === openId) ?? null
  const openLead = open?.lead_id ? leads[open.lead_id] : undefined

  if (authStatus !== 'approved') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: '"Inter", sans-serif' }}>
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <Wordmark />
          <p style={{ color: C.muted, fontSize: 14, margin: '18px 0 20px' }}>
            {authStatus === 'loading' ? 'Loading…' : authStatus === 'denied' ? 'This account does not have agent access.' : 'Sign in on the agent portal to see your inbox.'}
          </p>
          {authStatus !== 'loading' && (
            <a href="/agent" style={{ display: 'inline-block', background: C.pink, color: '#fff', padding: '11px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Go to agent portal
            </a>
          )}
        </div>
      </div>
    )
  }

  const chip = (key: Filter, label: string, count?: number) => (
    <button key={key} className={`ib-chip${filter === key ? ' on' : ''}`} onClick={() => setFilter(key)}>
      {label}
      {count ? <span className="ib-chip-n">{count}</span> : null}
    </button>
  )

  return (
    <div className="ib">
      <style>{css}</style>

      <div className="ib-top">
        <div className="ib-top-left">
          <Wordmark />
          <nav className="ib-nav">
            <a href="/agent">Pipeline</a>
            <a href="/agent/inbox" aria-current="page">Inbox{unreadTotal ? ` (${unreadTotal})` : ''}</a>
            <a href="/agent/invoices">Invoices</a>
          </nav>
        </div>
        <div className="ib-user">
          <div className="ib-avatar">{user?.name.substring(0, 2).toUpperCase()}</div>
          <span className="ib-user-name">{user?.name}</span>
        </div>
      </div>

      <div className={`ib-body${openId ? ' has-open' : ''}`}>
        {/* ── list ── */}
        <aside className="ib-list">
          <div className="ib-list-head">
            <input className="ib-search" placeholder="Search name, number, message…" value={query} onChange={e => setQuery(e.target.value)} />
            <div className="ib-chips">
              {chip('all', 'Open')}
              {chip('unread', 'Unread', unreadTotal)}
              {chip('needs_reply', 'Needs reply', needsReplyCount)}
              {chip('closed', 'Closed')}
            </div>
            <div className="ib-chips">
              {(['all', 'text', 'instagram'] as ChannelFilter[]).map(k => (
                <button key={k} className={`ib-chip sm${channelFilter === k ? ' on' : ''}`} onClick={() => setChannelFilter(k)}>
                  {k === 'all' ? 'All channels' : k === 'text' ? 'Texts' : 'Instagram'}
                </button>
              ))}
            </div>
          </div>

          <div className="ib-rows">
            {visible.length === 0 && (
              <div className="ib-empty">
                {convos.length === 0 ? 'No messages yet. New texts and DMs show up here the second they land.' : 'Nothing here with these filters.'}
              </div>
            )}
            {visible.map(c => {
              const lead = c.lead_id ? leads[c.lead_id] : undefined
              const meta = CHANNEL_META[c.channel] ?? CHANNEL_META.other
              return (
                <button key={c.id} className={`ib-row${openId === c.id ? ' sel' : ''}${c.unread_count ? ' unread' : ''}`} onClick={() => openConvo(c)}>
                  <div className="ib-row-top">
                    <span className="ib-dot" style={{ background: meta.color }} title={meta.label} />
                    <span className="ib-row-name">{displayName(c, lead)}</span>
                    <span className="ib-row-time">{timeAgo(c.last_message_at)}</span>
                  </div>
                  <div className="ib-row-prev">{c.last_message_preview || '—'}</div>
                  <div className="ib-row-tags">
                    <span className="ib-tag" style={{ color: meta.color }}>{meta.label}</span>
                    {lead?.stage && <span className="ib-tag stage">{lead.stage}</span>}
                    {needsReply(c) && <span className="ib-tag reply">Needs reply</span>}
                    {c.unread_count > 0 && <span className="ib-badge">{c.unread_count}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── thread ── */}
        <section className="ib-thread">
          {!open ? (
            <div className="ib-thread-empty">Pick a conversation</div>
          ) : (
            <>
              <div className="ib-thread-head">
                <button className="ib-back" onClick={() => setOpenId(null)} aria-label="Back to inbox">←</button>
                <div className="ib-thread-who">
                  <div className="ib-thread-name">{displayName(open, openLead)}</div>
                  <div className="ib-thread-sub">
                    <span style={{ color: (CHANNEL_META[open.channel] ?? CHANNEL_META.other).color, fontWeight: 700 }}>{(CHANNEL_META[open.channel] ?? CHANNEL_META.other).label}</span>
                    {open.contact_phone && <> · <a href={`tel:${open.contact_phone}`}>{open.contact_phone}</a></>}
                    {open.contact_handle && <> · {open.contact_handle}</>}
                    {openLead?.stage && <> · {openLead.stage}</>}
                  </div>
                  {openLead && (openLead.building_name || openLead.budget || openLead.move_in_timing) && (
                    <div className="ib-thread-lead">
                      {[openLead.budget && `Budget ${openLead.budget}`, openLead.move_in_timing, openLead.building_name].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <button className="ib-btn" onClick={() => setStatus(open, open.status === 'closed' ? 'open' : 'closed')}>
                  {open.status === 'closed' ? 'Reopen' : 'Close'}
                </button>
              </div>

              <div className="ib-msgs">
                {messages.map((m, i) => {
                  const showDay = i === 0 || dayLabel(messages[i - 1].sent_at) !== dayLabel(m.sent_at)
                  return (
                    <div key={m.id}>
                      {showDay && <div className="ib-day">{dayLabel(m.sent_at)}</div>}
                      <div className={`ib-msg ${m.direction}`}>
                        <div className="ib-bubble">{m.body}</div>
                        <div className="ib-meta">
                          {clock(m.sent_at)}
                          {m.is_automated ? ' · auto' : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={threadEndRef} />
              </div>

              <div className="ib-foot">
                Reply from {open.channel === 'instagram' ? 'Instagram' : 'iMessage'} — it appears here instantly.
              </div>
            </>
          )}
        </section>
      </div>

      {toast && <div className="ib-toast">{toast}</div>}
    </div>
  )
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span style={{ fontFamily: '"Archivo", sans-serif', fontWeight: 900, fontSize: 17, letterSpacing: '-0.01em', color: C.ink }}>MIAMI APARTMENT</span>
      <span style={{ fontFamily: '"Archivo", sans-serif', fontWeight: 900, fontSize: 17, letterSpacing: '-0.01em', color: C.pink }}>GUY</span>
    </div>
  )
}

const css = `
.ib { height: 100dvh; display: flex; flex-direction: column; background: ${C.bg}; color: ${C.text}; font-family: "Inter", sans-serif; }
.ib * { box-sizing: border-box; }
.ib-top { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: ${C.surface}; border-bottom: 1px solid ${C.border}; gap: 12px; }
.ib-top-left { display: flex; align-items: center; gap: 22px; min-width: 0; flex-wrap: wrap; }
.ib-nav { display: flex; gap: 16px; }
.ib-nav a { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 700; color: ${C.faint}; text-decoration: none; }
.ib-nav a[aria-current="page"] { color: ${C.pink}; }
.ib-user { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${C.muted}; }
.ib-avatar { width: 28px; height: 28px; border-radius: 50%; background: ${C.pinkSoft}; color: ${C.pink}; display: grid; place-items: center; font-size: 11px; font-weight: 800; }

.ib-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 360px 1fr; }
.ib-list { display: flex; flex-direction: column; min-height: 0; background: ${C.surface}; border-right: 1px solid ${C.border}; }
.ib-list-head { padding: 12px; border-bottom: 1px solid ${C.border}; display: flex; flex-direction: column; gap: 8px; }
.ib-search { width: 100%; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 10px; padding: 9px 12px; font-size: 14px; outline: none; }
.ib-search:focus { border-color: ${C.pink}; }
.ib-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.ib-chip { border: 1px solid ${C.border}; background: ${C.surface}; color: ${C.muted}; border-radius: 999px; padding: 6px 11px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.ib-chip.sm { padding: 4px 10px; font-size: 11px; }
.ib-chip.on { background: ${C.ink}; border-color: ${C.ink}; color: #fff; }
.ib-chip-n { background: ${C.pink}; color: #fff; border-radius: 999px; font-size: 10px; padding: 1px 6px; font-weight: 800; }
.ib-rows { flex: 1; overflow-y: auto; }
.ib-empty { padding: 28px 18px; color: ${C.muted}; font-size: 13px; text-align: center; }
.ib-row { display: block; width: 100%; text-align: left; background: ${C.surface}; border: 0; border-bottom: 1px solid ${C.border}; padding: 12px 14px; cursor: pointer; }
.ib-row:hover { background: #FAFAF8; }
.ib-row.sel { background: ${C.pinkSoft}; }
.ib-row-top { display: flex; align-items: center; gap: 8px; }
.ib-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.ib-row-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; color: ${C.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ib-row.unread .ib-row-name { font-weight: 800; }
.ib-row-time { font-size: 11px; color: ${C.faint}; flex: none; }
.ib-row-prev { margin: 3px 0 6px 16px; font-size: 13px; color: ${C.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ib-row.unread .ib-row-prev { color: ${C.text}; font-weight: 600; }
.ib-row-tags { margin-left: 16px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.ib-tag { font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.ib-tag.stage { color: ${C.green}; background: ${C.greenSoft}; border-radius: 6px; padding: 2px 6px; }
.ib-tag.reply { color: ${C.amber}; background: ${C.amberSoft}; border-radius: 6px; padding: 2px 6px; }
.ib-badge { margin-left: auto; background: ${C.pink}; color: #fff; border-radius: 999px; min-width: 18px; height: 18px; display: grid; place-items: center; font-size: 10px; font-weight: 800; padding: 0 5px; }

.ib-thread { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.ib-thread-empty { margin: auto; color: ${C.faint}; font-size: 14px; }
.ib-thread-head { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: ${C.surface}; border-bottom: 1px solid ${C.border}; }
.ib-back { display: none; border: 0; background: transparent; font-size: 22px; line-height: 1; padding: 2px 6px; cursor: pointer; color: ${C.ink}; }
.ib-thread-who { flex: 1; min-width: 0; }
.ib-thread-name { font-size: 16px; font-weight: 800; color: ${C.ink}; }
.ib-thread-sub { font-size: 12px; color: ${C.muted}; margin-top: 2px; }
.ib-thread-sub a { color: inherit; }
.ib-thread-lead { font-size: 12px; color: ${C.green}; margin-top: 4px; }
.ib-btn { border: 1px solid ${C.border}; background: ${C.surface}; border-radius: 9px; padding: 7px 12px; font-size: 12px; font-weight: 700; cursor: pointer; color: ${C.text}; flex: none; }
.ib-msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.ib-day { text-align: center; font-size: 11px; color: ${C.faint}; margin: 10px 0 4px; font-weight: 600; }
.ib-msg { display: flex; flex-direction: column; max-width: 78%; }
.ib-msg.inbound { align-items: flex-start; }
.ib-msg.outbound { align-items: flex-end; margin-left: auto; }
.ib-bubble { padding: 9px 13px; border-radius: 18px; font-size: 14px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
.ib-msg.inbound .ib-bubble { background: #ECECEA; color: ${C.ink}; border-bottom-left-radius: 6px; }
.ib-msg.outbound .ib-bubble { background: ${C.blue}; color: #fff; border-bottom-right-radius: 6px; }
.ib-meta { font-size: 10px; color: ${C.faint}; margin: 2px 6px 0; }
.ib-foot { padding: 12px 16px; background: ${C.surface}; border-top: 1px solid ${C.border}; font-size: 12px; color: ${C.muted}; text-align: center; }
.ib-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: ${C.ink}; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; z-index: 50; }

@media (max-width: 760px) {
  .ib-body { grid-template-columns: 1fr; }
  .ib-body .ib-thread { display: none; }
  .ib-body.has-open .ib-list { display: none; }
  .ib-body.has-open .ib-thread { display: flex; }
  .ib-back { display: block; }
  .ib-user-name { display: none; }
  .ib-top { padding: 10px 14px; }
}
`
