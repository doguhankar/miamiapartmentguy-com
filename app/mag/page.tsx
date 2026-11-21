'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
import { QuickAddLead } from '@/components/mag/quick-add-lead'
import Link from 'next/link'

interface DbLead {
  id: number
  name: string | null
  phone: string | null
  stage: string | null
  budget: string | null
  next_action: string | null
  next_action_date: string | null
  spoke_with: string | null
  created_at: string | null
  commission_estimate: number | null
}

const STAGES = [
  { name: 'Applied / Signed Lease', color: '#83CF9C' },
  { name: 'Tour Scheduled',          color: '#D4B68B' },
  { name: 'Follow Up',               color: '#D4B68B' },
  { name: 'Options Sent',            color: '#D4B68B' },
  { name: 'Discovery Call Made',     color: '#D4B68B' },
  { name: 'New Lead',                color: '#525252' },
]

const ACTIVE_STAGES = ['Tour Scheduled', 'Follow Up', 'Options Sent', 'Discovery Call Made', 'Applied / Signed Lease']
const ARCHIVED_STAGES = ['Closed Won', 'Archive', 'Archived', 'new']
const TODAY_KEY = `mag_reviewed_${new Date().toISOString().split('T')[0]}`

function formatMoney(n: number): string {
  if (n === 0) return '$0'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${n.toLocaleString()}`
}

function LeadRow({
  lead,
  reviewed,
  onToggleReviewed,
}: {
  lead: DbLead
  reviewed: boolean
  onToggleReviewed: (id: number) => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = lead.next_action_date && lead.next_action_date < today

  return (
    <div
      className={`px-4 py-3 ${reviewed ? 'opacity-40' : ''}`}
      style={{ borderTop: '1px solid var(--mag-border)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggleReviewed(lead.id)}
          className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
          style={reviewed
            ? { backgroundColor: 'var(--mag-accent)', borderColor: 'var(--mag-accent)' }
            : { borderColor: 'var(--mag-border-muted)' }
          }
          aria-label={`Mark ${lead.name ?? ''} reviewed`}
        >
          {reviewed && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--mag-accent-fg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <Link href={`/mag/clients/${lead.id}`} className="flex-1 min-w-0 active:opacity-70">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[13px] font-semibold truncate"
              style={{
                color: reviewed ? 'var(--mag-text-dim)' : 'var(--mag-text-high)',
                textDecoration: reviewed ? 'line-through' : 'none',
              }}
            >
              {lead.name || lead.phone || 'Unknown'}
            </span>
            {lead.budget && (
              <span className="text-[12px] shrink-0 font-medium" style={{ color: 'var(--mag-accent)' }}>{lead.budget}</span>
            )}
          </div>
          {lead.next_action && (
            <p
              className={`text-[11px] mt-0.5 truncate ${isOverdue ? 'text-red-400/80' : ''}`}
              style={isOverdue ? {} : { color: 'var(--mag-text-faint)' }}
            >
              {lead.next_action_date
                ? new Date(lead.next_action_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''}{lead.next_action_date ? ' · ' : ''}{lead.next_action}
            </p>
          )}
        </Link>
      </div>

      {!reviewed && lead.phone && (
        <div className="flex items-center gap-3 mt-2 ml-8">
          <a href={`sms:${lead.phone}`} className="text-[11px] transition-colors active:opacity-70" style={{ color: 'var(--mag-text-low)' }}>
            Text
          </a>
          <span className="text-[11px]" style={{ color: 'var(--mag-border)' }}>·</span>
          <a href={`tel:${lead.phone}`} className="text-[11px] transition-colors active:opacity-70" style={{ color: 'var(--mag-text-low)' }}>
            Call
          </a>
          <span className="text-[11px]" style={{ color: 'var(--mag-border)' }}>·</span>
          <Link href={`/mag/clients/${lead.id}`} className="text-[11px] transition-colors active:opacity-70" style={{ color: 'var(--mag-text-low)' }}>
            Manage
          </Link>
        </div>
      )}
    </div>
  )
}

function StageSection({
  stage,
  leads,
  expanded,
  onToggle,
  reviewed,
  hideDone,
  onToggleReviewed,
}: {
  stage: typeof STAGES[0]
  leads: DbLead[]
  expanded: boolean
  onToggle: () => void
  reviewed: Set<number>
  hideDone: boolean
  onToggleReviewed: (id: number) => void
}) {
  const remaining = leads.filter(l => !reviewed.has(l.id))
  const visible = hideDone ? remaining : leads

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 active:opacity-70"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
          <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--mag-text-mid)' }}>{stage.name}</span>
          <span className="text-[11px] ml-0.5" style={{ color: 'var(--mag-text-faint)' }}>{remaining.length}</span>
        </div>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="var(--mag-text-faint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <>
          {visible.length > 0
            ? visible.map(l => (
                <LeadRow
                  key={l.id}
                  lead={l}
                  reviewed={reviewed.has(l.id)}
                  onToggleReviewed={onToggleReviewed}
                />
              ))
            : (
              <div
                className="px-4 py-3 text-[11px]"
                style={{ borderTop: '1px solid var(--mag-border)', color: 'var(--mag-text-faint)' }}
              >
                All reviewed for today.
              </div>
            )}
        </>
      )}
    </div>
  )
}

function TodayContent() {
  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())
  const [hideDone, setHideDone] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Applied / Signed Lease': false,
    'Tour Scheduled': true,
    'Follow Up': false,
    'Options Sent': false,
    'Discovery Call Made': false,
    'New Lead': false,
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TODAY_KEY)
      if (stored) setReviewed(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('id,name,phone,stage,budget,next_action,next_action_date,spoke_with,created_at,commission_estimate')
      .not('stage', 'in', `(${ARCHIVED_STAGES.map(s => `"${s}"`).join(',')})`)
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        setLeads(data ?? [])
        setLoading(false)
      })
  }, [])

  const toggleReviewed = useCallback((id: number) => {
    setReviewed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem(TODAY_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  const toggleExpanded = useCallback((stageName: string) => {
    setExpanded(prev => ({ ...prev, [stageName]: !prev[stageName] }))
  }, [])

  const byStage = (stageName: string) => leads.filter(l => l.stage === stageName)

  const priorityLeads = leads.filter(l => l.stage !== 'New Lead')
  const reviewedCount = [...reviewed].filter(id => leads.find(l => l.id === id)).length
  const progress = Math.round(reviewedCount / Math.max(1, priorityLeads.length) * 100)

  const activeValue = leads
    .filter(l => ACTIVE_STAGES.includes(l.stage ?? '') && l.stage !== 'New Lead')
    .reduce((sum, l) => sum + (l.commission_estimate ?? 0), 0)

  const futureValue = leads
    .filter(l => l.stage === 'New Lead')
    .reduce((sum, l) => sum + (l.commission_estimate ?? 0), 0)

  const combinedValue = activeValue + futureValue

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }).toUpperCase()

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--mag-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-[445px] mx-auto w-full pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <p className="text-[13px] font-bold tracking-[0.15em]" style={{ color: 'var(--mag-text-high)' }}>
            <span className="font-black">MAG.</span>
            <span className="font-light ml-1 tracking-[0.2em]">CONCIERGE</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--mag-text-faint)' }}>{dateStr}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors active:opacity-70"
          style={{
            backgroundColor: 'var(--mag-surface-2)',
            border: '1px solid var(--mag-border-muted)',
            color: 'var(--mag-text-low)',
          }}
          aria-label="Add new lead"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="px-5 space-y-5">
        {/* Hero heading */}
        <div>
          <h1 className="text-[26px] font-bold tracking-tight leading-tight" style={{ color: 'var(--mag-text-high)' }}>
            Your focus today.
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--mag-text-faint)' }}>One conversation at a time.</p>
        </div>

        {/* Financial metrics */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--mag-text-faint)' }}>
            Active Opportunity Value
          </p>
          <p className="text-[32px] font-bold mt-1 tracking-tight leading-none" style={{ color: 'var(--mag-accent)' }}>
            {formatMoney(activeValue)}
          </p>
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--mag-border)' }}>
            <div>
              <p className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--mag-text-faint)' }}>Future opportunities</p>
              <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--mag-text-low)' }}>{formatMoney(futureValue)}</p>
            </div>
            <div className="w-px h-6" style={{ backgroundColor: 'var(--mag-border)' }} />
            <div>
              <p className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--mag-text-faint)' }}>Combined potential</p>
              <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--mag-text-low)' }}>{formatMoney(combinedValue)}</p>
            </div>
          </div>
        </div>

        {/* Daily priority review */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--mag-text-mid)' }}>Daily priority review</span>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--mag-accent)' }}>{reviewedCount}/{priorityLeads.length}</span>
          </div>
          <div className="h-[3px] rounded-full mt-3 mb-2.5 overflow-hidden" style={{ backgroundColor: 'var(--mag-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: 'var(--mag-accent)' }}
            />
          </div>
          <p className="text-[11px]" style={{ color: 'var(--mag-text-faint)' }}>
            {priorityLeads.length - reviewedCount} priority clients remaining
          </p>
        </div>

        {/* Worklist header */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--mag-text-faint)' }}>
            Your active worklist
          </span>
          <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none" style={{ color: 'var(--mag-text-dim)' }}>
            <input
              type="checkbox"
              checked={hideDone}
              onChange={e => setHideDone(e.target.checked)}
              className="w-3 h-3"
              style={{ accentColor: 'var(--mag-accent)' }}
            />
            Hide reviewed
          </label>
        </div>

        {/* Stage sections */}
        <div className="space-y-2">
          {STAGES.map(stage => {
            const stageLeads = byStage(stage.name)
            if (stageLeads.length === 0) return null
            return (
              <StageSection
                key={stage.name}
                stage={stage}
                leads={stageLeads}
                expanded={expanded[stage.name] ?? false}
                onToggle={() => toggleExpanded(stage.name)}
                reviewed={reviewed}
                hideDone={hideDone}
                onToggleReviewed={toggleReviewed}
              />
            )
          })}
        </div>

        {leads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[13px]" style={{ color: 'var(--mag-text-faint)' }}>No active leads.</p>
          </div>
        )}

        {/* Archived link */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--mag-border)' }}>
          <Link
            href="/mag/people?filter=archived"
            className="flex items-center justify-between py-2.5 px-3.5 rounded-xl active:opacity-70"
            style={{ backgroundColor: 'var(--mag-surface-2)', border: '1px solid var(--mag-border)' }}
          >
            <div>
              <span className="text-[12px]" style={{ color: 'var(--mag-text-dim)' }}>Closed &amp; Archived</span>
              <span className="text-[10px] block mt-0.5" style={{ color: 'var(--mag-text-faint)' }}>Retained records</span>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mag-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

      <QuickAddLead open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}

export default function TodayPage() {
  return (
    <MagShell>
      <TodayContent />
    </MagShell>
  )
}
