'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// /agent/team — owner-only, read-only overview of teammates' CRMs.
// Data comes from the team_crm_leads() RPC, which returns rows only for the owner's login.

const OWNER = 'doguhankar1@gmail.com'
const DONE = new Set(['Closed Won', 'Archive', 'Archived'])
const C = { bg: '#F7F7F5', surface: '#FFF', border: '#EBEBEB', ink: '#111', muted: '#717171', pink: '#E0447B', red: '#C0262D', redSoft: '#FDECEC', amber: '#B45309', amberSoft: '#FEF3E2', green: '#0F6E56', greenSoft: '#E7F7F1' }

type Lead = {
  id: number; created_at: string; name: string | null; phone: string | null; stage: string | null
  agent_id: string; source: string | null; building_name: string | null
  next_action: string | null; next_action_date: string | null
  spoke_with: string | null; first_tour: string | null; notes_updated_at: string | null
  quick_note: string | null; engagement_status: string | null; closed_at: string | null
  commission_estimate: number | null; commission_actual: number | null
}

const agentName = (id: string) => (id.startsWith('seb') ? 'Seb' : id.split('@')[0])
const daysSince = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null)
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

type Flag = { key: string; label: string; tone: 'red' | 'amber' }
function flagsFor(l: Lead): Flag[] {
  if (DONE.has(l.stage || '')) return []
  const f: Flag[] = []
  const age = daysSince(l.created_at) ?? 0
  const touch = daysSince(l.spoke_with)
  if (l.stage === 'New Lead' || l.stage === 'new') {
    if (!l.spoke_with && age >= 1) f.push({ key: 'untouched', label: `Not contacted · ${age}d old`, tone: 'red' })
    return f
  }
  if (l.next_action_date && l.next_action_date < today()) f.push({ key: 'overdue', label: `Next action overdue · ${l.next_action_date}`, tone: 'red' })
  if (!l.next_action_date) f.push({ key: 'nonext', label: 'No next action set', tone: 'amber' })
  if (touch === null || touch >= 7) f.push({ key: 'quiet', label: touch === null ? 'No contact logged' : `No contact in ${touch}d`, tone: 'amber' })
  return f
}

export default function TeamPage() {
  const [state, setState] = useState<'loading' | 'denied' | 'ready' | 'error'>('loading')
  const [leads, setLeads] = useState<Lead[]>([])
  const [agent, setAgent] = useState<string>('all')
  const [onlyFlagged, setOnlyFlagged] = useState(true)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const { data: { session } } = await sb.auth.getSession()
      if (session?.user?.email?.toLowerCase() !== OWNER) return setState('denied')
      const { data, error } = await sb.rpc('team_crm_leads')
      if (error) return setState('error')
      setLeads((data || []) as Lead[])
      setState('ready')
    })()
  }, [])

  const agents = useMemo(() => Array.from(new Set(leads.map(l => agentName(l.agent_id)))), [leads])
  const scoped = useMemo(() => leads.filter(l => agent === 'all' || agentName(l.agent_id) === agent), [leads, agent])
  const open = scoped.filter(l => !DONE.has(l.stage || ''))
  const flagged = open.map(l => ({ l, f: flagsFor(l) })).filter(x => x.f.length)
  const byStage = useMemo(() => {
    const m = new Map<string, number>()
    scoped.forEach(l => m.set(l.stage || '—', (m.get(l.stage || '—') || 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [scoped])
  const lastTouch = scoped.map(l => l.spoke_with).filter(Boolean).sort().pop() || null
  const closed = scoped.filter(l => l.stage === 'Closed Won')
  const commission = closed.reduce((s, l) => s + (l.commission_actual ?? l.commission_estimate ?? 0), 0)
  const list = (onlyFlagged ? flagged : open.map(l => ({ l, f: flagsFor(l) }))).sort((a, b) => b.f.length - a.f.length)

  if (state === 'loading') return <div style={{ padding: 40, color: C.muted }}>Loading…</div>
  if (state === 'denied') return <div style={{ padding: 40 }}>Owner access only. <a href="/agent">Back to pipeline</a></div>
  if (state === 'error') return <div style={{ padding: 40 }}>Could not load team data. <a href="/agent">Back to pipeline</a></div>

  const card = (label: string, val: string | number, tone?: 'red' | 'amber' | 'green') => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', minWidth: 130 }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: tone === 'red' ? C.red : tone === 'amber' ? C.amber : tone === 'green' ? C.green : C.ink }}>{val}</div>
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '20px 16px', fontFamily: 'Inter, sans-serif', color: C.ink }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <a href="/agent" style={{ color: C.pink, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>← PIPELINE</a>
          <h1 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, margin: 0 }}>Team CRM <span style={{ color: C.pink }}>overview</span></h1>
          <span style={{ fontSize: 11, color: C.muted }}>read-only</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {['all', ...agents].map(a => (
            <button key={a} onClick={() => setAgent(a)} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${C.border}`, background: agent === a ? C.ink : C.surface, color: agent === a ? '#fff' : C.ink, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{a === 'all' ? 'Everyone' : a}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {card('Open leads', open.length)}
          {card('Needs attention', flagged.length, flagged.length ? 'red' : 'green')}
          {card('Last contact', lastTouch ? `${daysSince(lastTouch)}d ago` : '—', (daysSince(lastTouch) ?? 99) >= 7 ? 'amber' : undefined)}
          {card('Closed won', closed.length, 'green')}
          {card('Commission', '$' + Math.round(commission).toLocaleString())}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {byStage.map(([s, n]) => <span key={s} style={{ fontSize: 13 }}><b>{n}</b> <span style={{ color: C.muted }}>{s}</span></span>)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <b style={{ fontSize: 14 }}>{onlyFlagged ? 'Needs attention' : 'All open leads'}</b>
          <button onClick={() => setOnlyFlagged(v => !v)} style={{ fontSize: 12, color: C.pink, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>{onlyFlagged ? 'Show all open' : 'Show flagged only'}</button>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {list.map(({ l, f }) => (
            <div key={l.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <b>{l.name || l.phone || `Lead #${l.id}`}</b>
                <span style={{ fontSize: 12, color: C.muted }}>{agentName(l.agent_id)} · {l.stage}{l.building_name ? ` · ${l.building_name}` : ''}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                Last contact: {l.spoke_with ? `${daysSince(l.spoke_with)}d ago` : 'never'} · Next: {l.next_action || '—'}{l.next_action_date ? ` (${l.next_action_date})` : ''}
              </div>
              {l.quick_note && <div style={{ fontSize: 12, marginTop: 4 }}>{l.quick_note}</div>}
              {f.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {f.map(x => <span key={x.key} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: x.tone === 'red' ? C.redSoft : C.amberSoft, color: x.tone === 'red' ? C.red : C.amber }}>{x.label}</span>)}
                </div>
              )}
            </div>
          ))}
          {list.length === 0 && <div style={{ color: C.green, padding: 20 }}>Nothing flagged. All caught up.</div>}
        </div>
      </div>
    </div>
  )
}
