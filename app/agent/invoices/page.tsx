'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── /agent/invoices — Accounts Receivable ─────────────────────────────────────
// Every agent sees only their own invoices (enforced by Supabase RLS on agent_id).
// Nothing on this page emails a building yet. The Mon/Fri follow-up sequence is
// switched on separately once Don approves it.

type Status = 'draft' | 'sent' | 'acknowledged' | 'paid' | 'escalated' | 'void'

type Invoice = {
  id: number
  invoice_number: string
  agent_id: string
  lead_id: number | null
  building_id: string | null
  building_name: string
  building_address: string | null
  tenant_name: string
  unit_number: string
  lease_start: string
  lease_term_months: number
  amount: number
  invoice_date: string
  due_date: string
  ap_email: string | null
  ap_cc_emails: string[] | null
  broker_reg_required: boolean
  status: Status
  sequence_step: number
  sequence_paused: boolean
  sent_at: string | null
  last_email_at: string | null
  acknowledged_at: string | null
  payment_eta: string | null
  paid_at: string | null
  paid_amount: number | null
  notes: string | null
}

type Attachment = { id: number; invoice_id: number; kind: 'invoice_pdf' | 'broker_reg' | 'other'; storage_path: string; file_name: string; created_at: string }
type EmailLog = { id: number; invoice_id: number; step: number; subject: string; to_emails: string[]; status: string; sent_at: string }
type ApContact = { building_id: string; ap_name: string | null; ap_email: string; ap_cc_emails: string[] | null; ap_phone: string | null; notes: string | null }
type ClosedDeal = { id: number; name: string; building_name: string | null; unit: string | null; commission_actual: number | null; closed_at: string | null }

type AuthStatus = 'loading' | 'idle' | 'denied' | 'approved'
type Filter = 'all' | 'draft' | 'open' | 'overdue' | 'paid'

const BUCKET = 'invoices'
const W9_PATH = '_shared/w9.pdf'

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
  amber: '#B45309',
  amberSoft: '#FEF3E2',
  red: '#C0262D',
  redSoft: '#FDECEC',
  indigo: '#4F46E5',
  indigoSoft: '#EEF0FE',
}

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const usdWhole = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdShort =(n: number) => (n >= 1000 ? '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k' : usd(n))

function todayEastern() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}
function daysBetween(fromIso: string, toIso: string) {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10))
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10))
  return Math.round((b - a) / 86400000)
}
function shortDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function toEasternDate(ts: string | null) {
  if (!ts) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(ts))
}

// Age counts from when the building actually got it; drafts count from invoice date.
function ageOf(inv: Invoice, today: string) {
  const start = toEasternDate(inv.sent_at) ?? inv.invoice_date
  return Math.max(0, daysBetween(start, today))
}
function isOverdue(inv: Invoice, today: string) {
  return (inv.status === 'sent' || inv.status === 'acknowledged' || inv.status === 'escalated') && today > inv.due_date
}
function agingTone(inv: Invoice, today: string): 'green' | 'amber' | 'red' | 'gray' {
  if (inv.status === 'paid' || inv.status === 'void' || inv.status === 'draft') return 'gray'
  if (isOverdue(inv, today)) return 'red'
  const age = ageOf(inv, today)
  if (age <= 7) return 'green'
  if (age <= 14) return 'amber'
  return 'red'
}

const STATUS_LABEL: Record<Status, string> = {
  draft: 'Draft',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  paid: 'Paid',
  escalated: 'Collections',
  void: 'Void',
}
const STATUS_TONE: Record<Status, [string, string]> = {
  draft: ['#F1F1EF', C.muted],
  sent: [C.indigoSoft, C.indigo],
  acknowledged: [C.amberSoft, C.amber],
  paid: [C.greenSoft, C.green],
  escalated: [C.redSoft, C.red],
  void: ['#F1F1EF', C.faint],
}
const TONE: Record<'green' | 'amber' | 'red' | 'gray', [string, string]> = {
  green: [C.greenSoft, C.green],
  amber: [C.amberSoft, C.amber],
  red: [C.redSoft, C.red],
  gray: ['#F1F1EF', C.faint],
}

export default function InvoicesPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [apContacts, setApContacts] = useState<Record<string, ApContact>>({})
  const [w9OnFile, setW9OnFile] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [closedDeals, setClosedDeals] = useState<ClosedDeal[]>([])

  const sbRef = useRef<ReturnType<typeof createClient> | null>(null)
  const today = todayEastern()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const load = useCallback(async () => {
    const sb = sbRef.current
    if (!sb) return
    const { data: inv, error } = await sb.from('invoices').select('*').order('invoice_date', { ascending: false }).order('id', { ascending: false })
    if (error) {
      showToast(`Could not load invoices: ${error.message}`)
      return
    }
    const list = (inv ?? []).map(r => ({ ...r, amount: Number(r.amount), paid_amount: r.paid_amount != null ? Number(r.paid_amount) : null })) as Invoice[]
    setInvoices(list)
    const ids = list.map(i => i.id)
    const buildingIds = Array.from(new Set(list.map(i => i.building_id).filter(Boolean))) as string[]
    const [att, em, ap, w9] = await Promise.all([
      ids.length ? sb.from('invoice_attachments').select('*').in('invoice_id', ids) : Promise.resolve({ data: [] }),
      ids.length ? sb.from('invoice_emails').select('id,invoice_id,step,subject,to_emails,status,sent_at').in('invoice_id', ids).order('sent_at') : Promise.resolve({ data: [] }),
      buildingIds.length ? sb.from('building_ap_contacts').select('*').in('building_id', buildingIds) : Promise.resolve({ data: [] }),
      sb.storage.from(BUCKET).list('_shared', { search: 'w9.pdf' }),
    ])
    setAttachments((att.data ?? []) as Attachment[])
    setEmails((em.data ?? []) as EmailLog[])
    setApContacts(Object.fromEntries(((ap.data ?? []) as ApContact[]).map(c => [c.building_id, c])))
    setW9OnFile(!!w9.data?.some(f => f.name === 'w9.pdf'))
  }, [])

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
          load()
        }, 0)
      } else if (event === 'INITIAL_SESSION' && !session?.user) {
        setAuthStatus('idle')
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthStatus('idle')
      }
    })
    return () => subscription?.unsubscribe()
  }, [load])

  // ── derived ────────────────────────────────────────────────────────────────
  const live = invoices.filter(i => i.status !== 'void')
  const billed = live.filter(i => i.status !== 'draft')
  const paid = live.filter(i => i.status === 'paid')
  const open = live.filter(i => i.status === 'sent' || i.status === 'acknowledged' || i.status === 'escalated')
  const overdue = open.filter(i => isOverdue(i, today))
  const totalBilled = billed.reduce((s, i) => s + i.amount, 0)
  const collected = paid.reduce((s, i) => s + (i.paid_amount ?? i.amount), 0)
  const outstanding = open.reduce((s, i) => s + i.amount, 0)
  const drafts = live.filter(i => i.status === 'draft')
  const monthKey = today.slice(0, 7)
  const collectedThisMonth = paid.filter(i => (toEasternDate(i.paid_at) ?? '').startsWith(monthKey))
  const gciThisMonth = collectedThisMonth.reduce((s, i) => s + (i.paid_amount ?? i.amount), 0)
  const collectionRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices
      .filter(i => {
        if (filter === 'draft') return i.status === 'draft'
        if (filter === 'open') return i.status === 'sent' || i.status === 'acknowledged' || i.status === 'escalated'
        if (filter === 'overdue') return isOverdue(i, today)
        if (filter === 'paid') return i.status === 'paid'
        return i.status !== 'void'
      })
      .filter(i => !q || [i.invoice_number, i.tenant_name, i.building_name, i.unit_number].some(v => v?.toLowerCase().includes(q)))
      .sort((a, b) => {
        // unpaid first, oldest first within unpaid; paid at the bottom newest first
        const rank = (i: Invoice) => (i.status === 'paid' ? 2 : i.status === 'draft' ? 0 : 1)
        if (rank(a) !== rank(b)) return rank(a) - rank(b)
        if (a.status === 'paid') return (b.paid_at ?? '').localeCompare(a.paid_at ?? '')
        return a.invoice_date.localeCompare(b.invoice_date)
      })
  }, [invoices, filter, query, today])

  const readiness = (inv: Invoice) => {
    const atts = attachments.filter(a => a.invoice_id === inv.id)
    const checks = [
      { label: 'AP email', ok: !!inv.ap_email },
      { label: 'Invoice PDF', ok: atts.some(a => a.kind === 'invoice_pdf') },
      { label: 'W-9', ok: w9OnFile },
      { label: 'Broker registration', ok: !inv.broker_reg_required || atts.some(a => a.kind === 'broker_reg'), na: !inv.broker_reg_required },
    ]
    return { checks, ready: checks.every(c => c.ok) }
  }

  // ── actions (all RLS-scoped to the signed-in agent) ────────────────────────
  const patchInvoice = async (id: number, patch: Partial<Invoice>, msg: string) => {
    const sb = sbRef.current
    if (!sb) return
    setBusy(`inv-${id}`)
    const { error } = await sb.from('invoices').update(patch).eq('id', id)
    setBusy(null)
    if (error) return showToast(`Not saved: ${error.message}`)
    setInvoices(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
    showToast(msg)
  }

  const saveApContact = async (inv: Invoice, form: { name: string; email: string; cc: string; phone: string; saveToBuilding: boolean }) => {
    const sb = sbRef.current
    if (!sb) return
    const email = form.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Enter a valid AP email')
    const cc = form.cc.split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
    const bad = cc.find(c => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c))
    if (bad) return showToast(`CC email looks wrong: ${bad}`)
    setBusy(`ap-${inv.id}`)
    const { error } = await sb.from('invoices').update({ ap_email: email, ap_cc_emails: cc }).eq('id', inv.id)
    if (!error && form.saveToBuilding && inv.building_id) {
      const { error: apErr } = await sb.from('building_ap_contacts').upsert(
        { building_id: inv.building_id, ap_name: form.name || null, ap_email: email, ap_cc_emails: cc, ap_phone: form.phone || null, verified_by: user?.email, verified_at: new Date().toISOString() },
        { onConflict: 'building_id' },
      )
      if (apErr) showToast(`Saved on invoice, not on building: ${apErr.message}`)
    }
    setBusy(null)
    if (error) return showToast(`Not saved: ${error.message}`)
    await load()
    showToast(form.saveToBuilding && inv.building_id ? `AP contact saved for ${inv.building_name}` : 'AP contact saved')
  }

  const upload = async (inv: Invoice, file: File, kind: 'broker_reg' | 'other') => {
    const sb = sbRef.current
    if (!sb) return
    if (file.size > 15 * 1024 * 1024) return showToast('File is over 15 MB')
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const base = kind === 'broker_reg' ? 'broker-registration' : file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40) || 'attachment'
    const path = `${inv.agent_id}/${inv.invoice_number}/${base}-${Date.now()}.${ext}`
    setBusy(`up-${inv.id}`)
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined })
    if (error) {
      setBusy(null)
      return showToast(`Upload failed: ${error.message}`)
    }
    const { error: rowErr } = await sb.from('invoice_attachments').insert({ invoice_id: inv.id, kind, storage_path: path, file_name: `${base}.${ext}` })
    setBusy(null)
    if (rowErr) return showToast(`Uploaded, but not linked: ${rowErr.message}`)
    await load()
    showToast(kind === 'broker_reg' ? 'Broker registration attached' : 'File attached')
  }

  const uploadW9 = async (file: File) => {
    const sb = sbRef.current
    if (!sb) return
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) return showToast('W-9 must be a PDF')
    setBusy('w9')
    const { error } = await sb.storage.from(BUCKET).upload(W9_PATH, file, { contentType: 'application/pdf', upsert: true })
    setBusy(null)
    if (error) return showToast(`W-9 upload failed: ${error.message}`)
    setW9OnFile(true)
    showToast('W-9 on file. It attaches to every invoice.')
  }

  const openFile = async (path: string) => {
    const sb = sbRef.current
    if (!sb) return
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 300)
    if (error || !data) return showToast('Could not open file')
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  const removeAttachment = async (att: Attachment) => {
    const sb = sbRef.current
    if (!sb) return
    const { error } = await sb.from('invoice_attachments').delete().eq('id', att.id)
    if (error) return showToast(`Not removed: ${error.message}`)
    await sb.storage.from(BUCKET).remove([att.storage_path])
    setAttachments(prev => prev.filter(a => a.id !== att.id))
    showToast('Removed')
  }

  const openNew = async () => {
    const sb = sbRef.current
    if (!sb) return
    setNewOpen(true)
    const { data } = await sb
      .from('leads')
      .select('id,name,building_name,unit,commission_actual,closed_at')
      .eq('stage', 'Closed Won')
      .order('closed_at', { ascending: false })
    const invoicedLeadIds = new Set(invoices.filter(i => i.status !== 'void').map(i => i.lead_id))
    setClosedDeals(((data ?? []) as ClosedDeal[]).filter(d => !invoicedLeadIds.has(d.id)))
  }

  const createFromDeal = async (leadId: number) => {
    const sb = sbRef.current
    if (!sb) return
    const { data: { session } } = await sb.auth.getSession()
    if (!session) return showToast('Sign in again')
    setBusy(`new-${leadId}`)
    const res = await fetch('/api/invoices/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ leadId }),
    })
    const payload = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) return showToast(payload.error || 'Invoice could not be created')
    setNewOpen(false)
    await load()
    setOpenId(payload.id)
    showToast(`${payload.invoiceNumber} created as a draft`)
  }

  // ── auth screens ───────────────────────────────────────────────────────────
  if (authStatus !== 'approved') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: '"Inter", sans-serif' }}>
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <Wordmark />
          <p style={{ color: C.muted, fontSize: 14, margin: '18px 0 20px' }}>
            {authStatus === 'loading' ? 'Loading…' : authStatus === 'denied' ? 'This account does not have agent access.' : 'Sign in on the agent portal to see your invoices.'}
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

  // ── page ───────────────────────────────────────────────────────────────────
  return (
    <div className="ar">
      <style>{css}</style>

      <div className="ar-top">
        <div className="ar-top-left">
          <Wordmark />
          <nav className="ar-tabs-nav">
            <a href="/agent">Pipeline</a>
            <a href="/agent/invoices" aria-current="page">Invoices</a>
          </nav>
        </div>
        <div className="ar-user">
          <div className="ar-avatar">{user?.name.substring(0, 2).toUpperCase()}</div>
          <span>{user?.name} · Agent</span>
        </div>
      </div>

      <main className="ar-main">
        <div className="ar-head">
          <div>
            <h1>Invoices <span>· {live.length}</span></h1>
            <p>Every invoice you send, tracked until it's paid.</p>
          </div>
          <button className="btn btn-pink" onClick={openNew}>+ New invoice</button>
        </div>

        <div className="ar-banner">
          <strong>Follow-ups are off.</strong> Nothing on this page emails a building yet. Get each invoice ready here. The Monday/Friday 9am follow-ups turn on once you approve them.
        </div>

        <section className="ar-tiles">
          <Tile label="Billed" value={usdWhole(totalBilled)} sub={`${billed.length} invoice${billed.length === 1 ? '' : 's'} sent`} />
          <Tile label="Collected" value={usdWhole(collected)} sub={`${paid.length} paid`} color={C.green} bar={totalBilled ? collected / totalBilled : 0} />
          <Tile label="Outstanding" value={usdWhole(outstanding)} sub={`${open.length} open`} color={outstanding ? C.amber : C.ink} />
          <Tile label="Overdue" value={String(overdue.length)} sub={overdue.length ? usdWhole(overdue.reduce((s, i) => s + i.amount, 0)) + ' past due' : 'None past due'} color={overdue.length ? C.red : C.ink} />
        </section>

        <section className="ar-w9">
          <div>
            <span className={`dot ${w9OnFile ? 'ok' : 'bad'}`} />
            <strong>W-9 (305 International Realty LLC)</strong>
            <span className="muted">{w9OnFile ? ' On file. Attaches to every invoice.' : ' Not on file. Upload it once and it goes out with every invoice.'}</span>
          </div>
          <div className="row-gap">
            {w9OnFile && <button className="btn btn-ghost" onClick={() => openFile(W9_PATH)}>View</button>}
            <label className="btn btn-ghost">
              {busy === 'w9' ? 'Uploading…' : w9OnFile ? 'Replace' : 'Upload W-9'}
              <input type="file" accept="application/pdf,.pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadW9(f); e.target.value = '' }} />
            </label>
          </div>
        </section>

        <div className="ar-filters">
          <input className="ar-search" placeholder="Search tenant, building, invoice #…" value={query} onChange={e => setQuery(e.target.value)} />
          <div className="seg">
            {(['all', 'draft', 'open', 'overdue', 'paid'] as Filter[]).map(f => {
              const count = f === 'draft' ? drafts.length : f === 'open' ? open.length : f === 'overdue' ? overdue.length : f === 'paid' ? paid.length : live.length
              return (
                <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                  {f[0].toUpperCase() + f.slice(1)} <span>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        <section className="ar-list">
          {visible.length === 0 && (
            <div className="ar-empty">
              {invoices.length === 0
                ? <>No invoices yet. Close a deal in your pipeline and its invoice shows up here as a draft, or tap <strong>+ New invoice</strong> to make one from a deal you already closed.</>
                : 'Nothing matches this filter.'}
            </div>
          )}
          {visible.map(inv => {
            const tone = agingTone(inv, today)
            const age = ageOf(inv, today)
            const overdueDays = daysBetween(inv.due_date, today)
            const { checks, ready } = readiness(inv)
            const isOpen = openId === inv.id
            const [sBg, sFg] = STATUS_TONE[inv.status]
            const [aBg, aFg] = TONE[tone]
            const ageLabel =
              inv.status === 'paid' ? `Paid ${shortDate(toEasternDate(inv.paid_at))}`
              : isOverdue(inv, today) ? `${overdueDays}d overdue`
              : inv.status === 'draft' ? 'Not sent'
              : `${age} day${age === 1 ? '' : 's'}`
            return (
              <article key={inv.id} className={`inv tone-${tone} ${isOpen ? 'open' : ''}`}>
                <button className="inv-row" onClick={() => setOpenId(isOpen ? null : inv.id)} aria-expanded={isOpen}>
                  <div className="c-num">
                    <span className="mono">{inv.invoice_number}</span>
                    <span className="badge" style={{ background: sBg, color: sFg }}>{STATUS_LABEL[inv.status]}{inv.sequence_paused && inv.status !== 'paid' ? ' · paused' : ''}</span>
                  </div>
                  <div className="c-who">
                    <strong>{inv.tenant_name}</strong>
                    <span>{inv.building_name} · Unit {inv.unit_number}</span>
                  </div>
                  <div className="c-amt">{usd(inv.amount)}</div>
                  <div className="c-dates">
                    <span>Due {shortDate(inv.due_date)}</span>
                    <span className="muted">{inv.sent_at ? `Sent ${shortDate(toEasternDate(inv.sent_at))}` : `Made ${shortDate(inv.invoice_date)}`}</span>
                  </div>
                  <div className="c-age">
                    <span className="chip" style={{ background: aBg, color: aFg }}>{ageLabel}</span>
                    {inv.status === 'draft' && <span className={`chip ${ready ? 'chip-ready' : 'chip-todo'}`}>{ready ? 'Ready' : `${checks.filter(c => !c.ok).length} to do`}</span>}
                  </div>
                </button>

                {isOpen && (
                  <InvoiceDetail
                    inv={inv}
                    today={today}
                    checks={checks}
                    ready={ready}
                    attachments={attachments.filter(a => a.invoice_id === inv.id)}
                    emails={emails.filter(e => e.invoice_id === inv.id)}
                    apContact={inv.building_id ? apContacts[inv.building_id] : undefined}
                    busy={busy}
                    onPatch={patchInvoice}
                    onSaveAp={saveApContact}
                    onUpload={upload}
                    onOpenFile={openFile}
                    onRemove={removeAttachment}
                  />
                )}
              </article>
            )
          })}
        </section>

        <section className="ar-strip">
          <Strip label="GCI collected" value={usdShort(gciThisMonth)} note={`${collectedThisMonth.length} paid this month`} />
          <Strip label="Outstanding" value={usdShort(outstanding)} note={`${open.length} invoice${open.length === 1 ? '' : 's'} open`} />
          <Strip label="Collection rate" value={`${collectionRate}%`} note={`${usdShort(collected)} of ${usdShort(totalBilled)} billed`} />
        </section>
      </main>

      {newOpen && (
        <div className="modal-bg" onClick={() => setNewOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="New invoice">
            <div className="modal-head">
              <h2>New invoice</h2>
              <button className="x" onClick={() => setNewOpen(false)} aria-label="Close">×</button>
            </div>
            <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>Pick a closed deal. Tenant, unit, lease start, lease term and commission come from the deal. It's saved as a draft and nothing is emailed.</p>
            {closedDeals.length === 0 && <div className="ar-empty" style={{ margin: 0 }}>Every closed deal already has an invoice.</div>}
            <div className="deal-list">
              {closedDeals.map(d => (
                <button key={d.id} className="deal" disabled={busy === `new-${d.id}` || d.commission_actual == null} onClick={() => createFromDeal(d.id)}>
                  <div>
                    <strong>{d.name}</strong>
                    <span>{d.building_name ?? 'No building'} · Unit {d.unit || '—'}</span>
                  </div>
                  <span className="deal-amt">{d.commission_actual != null ? usd(Number(d.commission_actual)) : 'Add commission on the deal first'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

// ── detail panel ─────────────────────────────────────────────────────────────
function InvoiceDetail(props: {
  inv: Invoice
  today: string
  checks: { label: string; ok: boolean; na?: boolean }[]
  ready: boolean
  attachments: Attachment[]
  emails: EmailLog[]
  apContact?: ApContact
  busy: string | null
  onPatch: (id: number, patch: Partial<Invoice>, msg: string) => void
  onSaveAp: (inv: Invoice, form: { name: string; email: string; cc: string; phone: string; saveToBuilding: boolean }) => void
  onUpload: (inv: Invoice, file: File, kind: 'broker_reg' | 'other') => void
  onOpenFile: (path: string) => void
  onRemove: (att: Attachment) => void
}) {
  const { inv, today, checks, ready, attachments, emails, apContact, busy } = props
  const [ap, setAp] = useState({
    name: apContact?.ap_name ?? '',
    email: inv.ap_email ?? apContact?.ap_email ?? '',
    cc: (inv.ap_cc_emails?.length ? inv.ap_cc_emails : apContact?.ap_cc_emails ?? []).join(', '),
    phone: apContact?.ap_phone ?? '',
    saveToBuilding: true,
  })
  const [paidAmount, setPaidAmount] = useState(String(inv.amount))
  const [paidDate, setPaidDate] = useState(today)
  const [eta, setEta] = useState(inv.payment_eta ?? '')
  const [notes, setNotes] = useState(inv.notes ?? '')

  const pdf = attachments.find(a => a.kind === 'invoice_pdf')
  const others = attachments.filter(a => a.kind !== 'invoice_pdf')
  const apSuggested = !inv.ap_email && apContact?.ap_email

  return (
    <div className="detail">
      <div className="detail-grid">
        {/* Facts AP needs */}
        <div className="panel">
          <h3>Invoice</h3>
          <dl className="facts">
            <dt>Tenant</dt><dd>{inv.tenant_name}</dd>
            <dt>Unit</dt><dd>{inv.unit_number}</dd>
            <dt>Lease start</dt><dd>{shortDate(inv.lease_start)}</dd>
            <dt>Lease term</dt><dd>{inv.lease_term_months} months</dd>
            <dt>Bill to</dt><dd>{inv.building_name}{inv.building_address ? <><br /><span className="muted">{inv.building_address}</span></> : null}</dd>
            <dt>Amount</dt><dd><strong>{usd(inv.amount)}</strong></dd>
            <dt>Invoice date</dt><dd>{shortDate(inv.invoice_date)}</dd>
            <dt>Due</dt><dd>{shortDate(inv.due_date)}</dd>
          </dl>
          {pdf && <button className="btn btn-ghost" onClick={() => props.onOpenFile(pdf.storage_path)}>View invoice PDF</button>}
        </div>

        {/* Send checklist */}
        <div className="panel">
          <h3>Ready to send {ready ? <span className="chip chip-ready">Ready</span> : <span className="chip chip-todo">Not yet</span>}</h3>
          <ul className="checks">
            {checks.map(c => (
              <li key={c.label} className={c.ok ? 'ok' : 'bad'}>
                <span className="tick">{c.ok ? '✓' : '•'}</span>
                {c.label}{c.na ? <span className="muted"> · not required</span> : null}
              </li>
            ))}
          </ul>
          <label className="toggle">
            <input type="checkbox" checked={inv.broker_reg_required} onChange={e => props.onPatch(inv.id, { broker_reg_required: e.target.checked }, e.target.checked ? 'Broker registration required' : 'Broker registration not required')} />
            Broker registration required for this deal
          </label>

          <div className="uploads">
            {others.map(a => (
              <div key={a.id} className="file">
                <button className="linkish" onClick={() => props.onOpenFile(a.storage_path)}>{a.kind === 'broker_reg' ? 'Broker registration' : a.file_name}</button>
                <button className="linkish danger" onClick={() => props.onRemove(a)}>Remove</button>
              </div>
            ))}
            <div className="row-gap">
              <label className="btn btn-ghost">
                {busy === `up-${inv.id}` ? 'Uploading…' : '+ Broker registration'}
                <input type="file" accept="image/*,application/pdf,.pdf,.heic" hidden onChange={e => { const f = e.target.files?.[0]; if (f) props.onUpload(inv, f, 'broker_reg'); e.target.value = '' }} />
              </label>
              <label className="btn btn-ghost">
                + Other file
                <input type="file" accept="image/*,application/pdf,.pdf,.heic" hidden onChange={e => { const f = e.target.files?.[0]; if (f) props.onUpload(inv, f, 'other'); e.target.value = '' }} />
              </label>
            </div>
            <p className="hint">On iPhone: AirDrop the photo, then tap the button and pick it from Photos or Files.</p>
          </div>
        </div>

        {/* AP contact */}
        <div className="panel">
          <h3>Accounts payable</h3>
          {apSuggested && <p className="hint">Saved contact for {inv.building_name} is filled in. Tap Save to use it.</p>}
          <form className="form" onSubmit={e => { e.preventDefault(); props.onSaveAp(inv, ap) }}>
            <label>AP email<input id={`ap-email-${inv.id}`} type="email" inputMode="email" autoComplete="off" required value={ap.email} onChange={e => setAp({ ...ap, email: e.target.value })} placeholder="ap@building.com" /></label>
            <label>CC <span className="muted">(leasing manager, optional, comma separated)</span><input id={`ap-cc-${inv.id}`} value={ap.cc} onChange={e => setAp({ ...ap, cc: e.target.value })} placeholder="manager@building.com" /></label>
            <div className="two">
              <label>Contact name<input id={`ap-name-${inv.id}`} value={ap.name} onChange={e => setAp({ ...ap, name: e.target.value })} /></label>
              <label>Phone<input id={`ap-phone-${inv.id}`} type="tel" value={ap.phone} onChange={e => setAp({ ...ap, phone: e.target.value })} /></label>
            </div>
            {inv.building_id && (
              <label className="toggle">
                <input type="checkbox" checked={ap.saveToBuilding} onChange={e => setAp({ ...ap, saveToBuilding: e.target.checked })} />
                Save as {inv.building_name}'s AP contact for future invoices
              </label>
            )}
            <button className="btn btn-dark" type="submit" disabled={busy === `ap-${inv.id}`}>{busy === `ap-${inv.id}` ? 'Saving…' : 'Save AP contact'}</button>
          </form>
        </div>

        {/* Status */}
        <div className="panel">
          <h3>Status</h3>
          {inv.status === 'draft' && (
            <>
              <p className="hint">Already emailed this one yourself? Mark it sent so the clock starts.</p>
              <button className="btn btn-dark" onClick={() => props.onPatch(inv.id, { status: 'sent', sent_at: new Date().toISOString(), sequence_step: 1 }, 'Marked as sent')}>Mark as sent today</button>
            </>
          )}
          {(inv.status === 'sent' || inv.status === 'acknowledged' || inv.status === 'escalated') && (
            <>
              <div className="form">
                <label>Payment ETA they gave you<input id={`eta-${inv.id}`} type="date" value={eta} onChange={e => setEta(e.target.value)} /></label>
                <button className="btn btn-ghost" onClick={() => props.onPatch(inv.id, { status: 'acknowledged', acknowledged_at: inv.acknowledged_at ?? new Date().toISOString(), payment_eta: eta || null, sequence_paused: true }, 'Logged their response. Follow-ups paused.')}>They responded</button>
              </div>
              <div className="form" style={{ marginTop: 12 }}>
                <div className="two">
                  <label>Amount received<input id={`paid-amt-${inv.id}`} inputMode="decimal" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} /></label>
                  <label>Date received<input id={`paid-date-${inv.id}`} type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} /></label>
                </div>
                <button className="btn btn-green" onClick={() => {
                  const amt = Number(paidAmount.replace(/[$,]/g, ''))
                  if (!Number.isFinite(amt) || amt <= 0) return
                  props.onPatch(inv.id, { status: 'paid', paid_amount: amt, paid_at: new Date(`${paidDate}T12:00:00-05:00`).toISOString(), sequence_paused: true }, 'Marked paid. Follow-ups stopped.')
                }}>Mark paid</button>
              </div>
              <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => props.onPatch(inv.id, { sequence_paused: !inv.sequence_paused }, inv.sequence_paused ? 'Follow-ups resumed' : 'Follow-ups paused')}>
                {inv.sequence_paused ? 'Resume follow-ups' : 'Pause follow-ups'}
              </button>
            </>
          )}
          {inv.status === 'paid' && (
            <p>Paid {usd(inv.paid_amount ?? inv.amount)} on {shortDate(toEasternDate(inv.paid_at))}.{inv.paid_amount != null && inv.paid_amount < inv.amount ? <span className="bad-text"> Short {usd(inv.amount - inv.paid_amount)}.</span> : null}</p>
          )}

          <div className="form" style={{ marginTop: 14 }}>
            <label>
              Notes
              <textarea id={`notes-${inv.id}`} rows={2} value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => notes !== (inv.notes ?? '') && props.onPatch(inv.id, { notes }, 'Note saved')} placeholder="Who you spoke with, what they said" />
            </label>
          </div>

          <h3 style={{ marginTop: 16 }}>Email history</h3>
          {emails.length === 0
            ? <p className="hint">No emails logged yet.</p>
            : <ul className="log">{emails.map(e => <li key={e.id}><span className="mono">#{e.step}</span> {shortDate(toEasternDate(e.sent_at))} · {e.subject}{e.status !== 'sent' ? ` (${e.status})` : ''}</li>)}</ul>}

          {inv.status !== 'paid' && inv.status !== 'void' && (
            <button className="linkish danger" style={{ marginTop: 14 }} onClick={() => props.onPatch(inv.id, { status: 'void', sequence_paused: true }, 'Invoice voided')}>Void this invoice</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── small pieces ─────────────────────────────────────────────────────────────
function Wordmark() {
  return (
    <span style={{ fontFamily: '"Archivo", sans-serif', fontWeight: 900, fontSize: 17, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
      <span style={{ color: C.ink }}>MIAMI APARTMENT</span>
      <span style={{ color: C.pink }}>GUY</span>
    </span>
  )
}

function Tile({ label, value, sub, color = C.ink, bar }: { label: string; value: string; sub: string; color?: string; bar?: number }) {
  return (
    <div className="tile">
      <p className="lbl">{label}</p>
      <p className="val" style={{ color }}>{value}</p>
      <p className="sub">{sub}</p>
      {bar != null && <div className="bar"><div style={{ width: `${Math.min(100, Math.round(bar * 100))}%` }} /></div>}
    </div>
  )
}

function Strip({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="tile">
      <p className="lbl">{label}</p>
      <p className="val">{value}</p>
      <p className="sub"><span style={{ color: C.pink }}>✓</span> {note}</p>
    </div>
  )
}

const css = `
.ar { background:${C.bg}; color:${C.text}; font-family:"Inter",sans-serif; min-height:100vh; }
.ar *, .ar *::before, .ar *::after { box-sizing:border-box; }
body { margin:0; }
.ar .muted { color:${C.muted}; }
.ar .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size:12px; color:${C.muted}; }
.ar-top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px max(16px, env(safe-area-inset-right,0px)) 16px max(16px, env(safe-area-inset-left,0px)); border-bottom:1px solid ${C.border}; background:#fff; position:sticky; top:0; z-index:20; }
@media (min-width:768px){ .ar-top { padding-left:32px; padding-right:32px; } }
.ar-top-left { display:flex; align-items:center; gap:18px; min-width:0; }
.ar-tabs-nav { display:flex; gap:4px; }
.ar-tabs-nav a { font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:${C.faint}; text-decoration:none; padding:6px 10px; border-radius:8px; }
.ar-tabs-nav a[aria-current="page"] { color:${C.pink}; background:${C.pinkSoft}; }
.ar-tabs-nav a:hover { color:${C.ink}; }
.ar-user { display:flex; align-items:center; gap:8px; padding:6px 12px 6px 6px; border-radius:100px; background:${C.bg}; border:1px solid ${C.border}; font-size:13.5px; font-weight:600; }
.ar-avatar { width:30px; height:30px; border-radius:50%; background:${C.greenSoft}; color:${C.green}; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; }
@media (max-width:640px){
  .ar-user span { display:none; } .ar-user { padding:4px; }
  .ar-top-left { flex-direction:column; align-items:flex-start; gap:6px; }
  .ar-tabs-nav a { padding:4px 8px; }
  .ar .tile { padding:.85rem 1rem; } .ar .tile .val { font-size:22px; }
}

.ar-main { max-width:1180px; margin:0 auto; padding:20px max(16px, env(safe-area-inset-right,0px)) 40px max(16px, env(safe-area-inset-left,0px)); display:flex; flex-direction:column; gap:14px; }
@media (min-width:768px){ .ar-main { padding-left:24px; padding-right:24px; } }
.ar-head { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.ar-head h1 { font-family:"Archivo",sans-serif; font-size:22px; font-weight:800; letter-spacing:-.01em; margin:0; color:${C.ink}; }
.ar-head h1 span { color:${C.faint}; font-size:16px; font-weight:500; margin-left:4px; }
.ar-head p { margin:4px 0 0; font-size:13px; color:${C.muted}; }
.ar-banner { background:${C.indigoSoft}; color:#3730A3; border-radius:12px; padding:10px 14px; font-size:13px; line-height:1.5; }

.btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; border:none; border-radius:10px; padding:9px 14px; font:600 13px "Inter",sans-serif; cursor:pointer; transition:filter .12s, background .12s; text-decoration:none; white-space:nowrap; }
.btn:disabled { opacity:.5; cursor:default; }
.btn:focus-visible, .ar button:focus-visible, .ar input:focus-visible, .ar textarea:focus-visible { outline:2px solid ${C.pink}; outline-offset:2px; }
.btn-pink { background:${C.pink}; color:#fff; } .btn-pink:hover { filter:brightness(.95); }
.btn-dark { background:${C.ink}; color:#fff; } .btn-dark:hover { filter:brightness(1.2); }
.btn-green { background:${C.green}; color:#fff; } .btn-green:hover { filter:brightness(1.1); }
.btn-ghost { background:#fff; color:${C.text}; border:1px solid ${C.border}; } .btn-ghost:hover { border-color:${C.pink}; }
.linkish { background:none; border:none; padding:0; font:500 13px "Inter",sans-serif; color:${C.text}; text-decoration:underline; text-underline-offset:2px; cursor:pointer; }
.linkish.danger, .bad-text { color:${C.red}; }
.row-gap { display:flex; gap:8px; flex-wrap:wrap; }

.ar-tiles { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
@media (max-width:860px){ .ar-tiles { grid-template-columns:repeat(2,1fr); } }
.tile { background:#fff; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); padding:1rem 1.25rem; min-width:0; }
.tile .lbl { font-size:11px; font-weight:600; color:${C.faint}; letter-spacing:.05em; text-transform:uppercase; margin:0 0 8px; }
.tile .val { font-size:26px; font-weight:700; color:${C.ink}; margin:0; font-variant-numeric:tabular-nums; overflow:hidden; text-overflow:ellipsis; }
.tile .sub { font-size:12px; color:${C.muted}; margin:6px 0 0; }
.tile .bar { height:4px; background:${C.border}; border-radius:4px; margin-top:10px; overflow:hidden; }
.tile .bar div { height:100%; background:${C.green}; border-radius:4px; }

.ar-w9 { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.05); padding:12px 14px; font-size:13px; }
.dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:8px; vertical-align:middle; }
.dot.ok { background:${C.green}; } .dot.bad { background:${C.red}; }

.ar-filters { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.ar-search { flex:1 1 240px; min-width:0; background:#fff; border:1px solid ${C.border}; border-radius:10px; padding:9px 14px; font:13.5px "Inter",sans-serif; color:${C.text}; outline:none; }
.ar-search:focus { border-color:${C.pink}; }
.seg { display:flex; background:#fff; border:1px solid ${C.border}; border-radius:10px; overflow-x:auto; max-width:100%; }
.seg button { background:none; border:none; padding:8px 12px; font:600 12.5px "Inter",sans-serif; color:${C.muted}; cursor:pointer; white-space:nowrap; }
.seg button span { color:${C.faint}; font-weight:500; margin-left:2px; }
.seg button.on { background:${C.ink}; color:#fff; } .seg button.on span { color:#bbb; }

.ar-list { display:flex; flex-direction:column; gap:8px; }
.ar-empty { background:#fff; border-radius:16px; padding:28px 20px; text-align:center; color:${C.muted}; font-size:14px; line-height:1.6; box-shadow:0 2px 8px rgba(0,0,0,.05); }
.inv { background:#fff; border-radius:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); border-left:4px solid ${C.border}; overflow:hidden; }
.inv.tone-green { border-left-color:${C.green}; } .inv.tone-amber { border-left-color:#E0A23A; } .inv.tone-red { border-left-color:${C.red}; }
.inv.open { box-shadow:0 4px 18px rgba(0,0,0,.08); }
.inv-row { width:100%; display:grid; grid-template-columns:minmax(150px,1.1fr) minmax(0,1.6fr) 110px minmax(120px,1fr) 150px; gap:14px; align-items:center; padding:14px 16px; background:none; border:none; text-align:left; font:inherit; color:inherit; cursor:pointer; }
.inv-row:hover { background:#FCFCFB; }
.inv-row > div { min-width:0; display:flex; flex-direction:column; gap:4px; }
.c-who strong { font-size:14px; color:${C.ink}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.c-who span, .c-dates span { font-size:12.5px; color:${C.muted}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.c-dates span:first-child { color:${C.text}; }
.c-amt { font-weight:700; font-size:15px; color:${C.ink}; font-variant-numeric:tabular-nums; }
.c-age { flex-direction:row !important; flex-wrap:wrap; justify-content:flex-end; }
.badge, .chip { display:inline-flex; align-items:center; width:fit-content; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:700; white-space:nowrap; }
.chip-ready { background:${C.greenSoft}; color:${C.green}; } .chip-todo { background:${C.pinkSoft}; color:${C.pink}; }
@media (max-width:860px){
  .inv-row { grid-template-columns:1fr auto; grid-template-areas:"num amt" "who who" "dates age"; gap:8px 12px; }
  .c-num { grid-area:num; flex-direction:row !important; align-items:center; gap:8px !important; flex-wrap:wrap; }
  .c-who { grid-area:who; } .c-amt { grid-area:amt; text-align:right; } .c-dates { grid-area:dates; } .c-age { grid-area:age; align-self:end; }
}

.detail { border-top:1px solid ${C.border}; padding:16px; background:#FCFCFB; }
.detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
@media (max-width:860px){ .detail-grid { grid-template-columns:1fr; } }
.panel { background:#fff; border:1px solid ${C.border}; border-radius:12px; padding:14px; min-width:0; }
.panel h3 { font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:${C.faint}; margin:0 0 10px; display:flex; align-items:center; gap:8px; }
.facts { display:grid; grid-template-columns:110px 1fr; gap:6px 10px; margin:0 0 12px; font-size:13px; }
.facts dt { color:${C.muted}; } .facts dd { margin:0; color:${C.ink}; min-width:0; overflow-wrap:anywhere; }
.checks { list-style:none; margin:0 0 12px; padding:0; display:flex; flex-direction:column; gap:6px; font-size:13px; }
.checks li { display:flex; align-items:center; gap:8px; }
.checks .tick { width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
.checks li.ok .tick { background:${C.greenSoft}; color:${C.green}; } .checks li.bad .tick { background:${C.pinkSoft}; color:${C.pink}; }
.toggle { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:${C.text}; margin:6px 0 10px; cursor:pointer; }
.toggle input { margin-top:2px; accent-color:${C.pink}; }
.uploads { display:flex; flex-direction:column; gap:8px; }
.file { display:flex; justify-content:space-between; gap:10px; font-size:13px; padding:8px 10px; background:${C.bg}; border-radius:8px; }
.hint { font-size:12px; color:${C.muted}; margin:0 0 8px; line-height:1.5; }
.form { display:flex; flex-direction:column; gap:10px; }
.form label { display:flex; flex-direction:column; gap:4px; font-size:12px; font-weight:600; color:${C.muted}; }
.form input, .form textarea { font:14px "Inter",sans-serif; color:${C.ink}; background:#fff; border:1px solid ${C.border}; border-radius:8px; padding:9px 10px; outline:none; width:100%; }
.form input:focus, .form textarea:focus { border-color:${C.pink}; }
.form .toggle { flex-direction:row; font-weight:500; color:${C.text}; }
.ar input[type="checkbox"] { width:16px; height:16px; flex:none; padding:0; }
.two { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (max-width:420px){ .two { grid-template-columns:1fr; } }
.log { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px; font-size:12.5px; }

.ar-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:6px; }
@media (max-width:640px){ .ar-strip { grid-template-columns:1fr; } }

.modal-bg { position:fixed; inset:0; background:rgba(17,17,17,.35); display:flex; align-items:flex-end; justify-content:center; z-index:50; padding:16px; }
@media (min-width:640px){ .modal-bg { align-items:center; } }
.modal { background:#fff; border-radius:16px; width:100%; max-width:520px; max-height:80vh; overflow:auto; padding:18px; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.modal-head h2 { font-family:"Archivo",sans-serif; font-size:18px; margin:0; color:${C.ink}; }
.x { background:none; border:none; font-size:24px; line-height:1; cursor:pointer; color:${C.muted}; }
.deal-list { display:flex; flex-direction:column; gap:8px; }
.deal { display:flex; justify-content:space-between; align-items:center; gap:12px; text-align:left; background:#fff; border:1px solid ${C.border}; border-radius:10px; padding:12px; cursor:pointer; font:inherit; color:inherit; }
.deal:hover:not(:disabled) { border-color:${C.pink}; }
.deal:disabled { opacity:.6; cursor:default; }
.deal div { display:flex; flex-direction:column; gap:2px; min-width:0; }
.deal strong { font-size:14px; color:${C.ink}; } .deal div span { font-size:12.5px; color:${C.muted}; }
.deal-amt { font-weight:700; font-size:13px; color:${C.ink}; white-space:nowrap; }

.toast { position:fixed; left:50%; transform:translateX(-50%); bottom:calc(20px + env(safe-area-inset-bottom,0px)); background:${C.ink}; color:#fff; padding:10px 16px; border-radius:10px; font-size:13px; z-index:60; max-width:calc(100% - 32px); }
@media (prefers-reduced-motion: no-preference){ .inv, .btn { transition: box-shadow .15s, filter .12s, background .12s; } }
`
