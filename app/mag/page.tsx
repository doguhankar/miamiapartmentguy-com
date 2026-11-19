'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
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
  { name: 'Applied / Signed Lease', icon: 'handshake', color: '#83CF9C' },
  { name: 'Tour Scheduled',          icon: 'calendar',  color: '#D4B68B' },
  { name: 'Follow Up',               icon: 'message',   color: '#D4B68B' },
  { name: 'Options Sent',            icon: 'compass',   color: '#D4B68B' },
  { name: 'Discovery Call Made',     icon: 'phone',     color: '#D4B68B' },
  { name: 'New Lead',                icon: 'users',     color: '#525252' },
]

const ARCHIVED_STAGES = ['Closed Won', 'Archive', 'Archived', 'new']

const TODAY_KEY = `mag_reviewed_${new Date().toISOString().split('T')[0]}`

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (mins > 0) return `${mins}m`
  return 'now'
}

function StageIcon({ icon }: { icon: string }) {
  const paths: Record<string, string> = {
    handshake: 'M20 8H17.5L15.5 6H8.5L6.5 8H4C3.45 8 3 8.45 3 9v10c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-10 9l-3-3 1.41-1.41L10 14.17l5.59-5.58L17 10l-7 7z',
    calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z',
    message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    compass: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm4.24 6.49L14 12.5 9.49 14 11.5 9.49 16.24 8.49z',
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 4.4 4.2 2 2 0 0 1 6.4 2h3a2 2 0 0 1 2 1.7c.1.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L10.9 9.9a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9z',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m23 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[icon] || paths.users} />
    </svg>
  )
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
  const ago = timeAgo(lead.spoke_with ?? lead.created_at)
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = lead.next_action_date && lead.next_action_date < today

  return (
    <div className="border-t border-[#222] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => onToggleReviewed(lead.id)}
          className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
            reviewed
              ? 'bg-[#D4B68B] border-[#D4B68B]'
              : 'border-[#444]'
          }`}
          aria-label={`Mark ${lead.name ?? ''} reviewed`}
        >
          {reviewed && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <Link href={`/mag/clients/${lead.id}`} className="flex-1 min-w-0 flex items-center justify-between gap-2 active:opacity-70">
          <div className="min-w-0">
            <span className={`text-sm font-semibold truncate block ${reviewed ? 'line-through text-[#525252]' : 'text-[#EEEEEE]'}`}>
              {lead.name || lead.phone || 'Unknown'}
            </span>
            {isOverdue && lead.next_action && (
              <span className="text-[10px] text-red-400 block truncate">→ {lead.next_action}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lead.budget && <span className="text-xs text-[#D4B68B]">{lead.budget}</span>}
            {ago && <span className="text-[10px] text-[#404040]">{ago}</span>}
          </div>
        </Link>
      </div>

      {lead.phone && !reviewed && (
        <div className="flex gap-1.5 mt-2 ml-7">
          <a
            href={`sms:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#1c8ef9]/10 text-[#1c8ef9] text-[11px] font-medium border border-[#1c8ef9]/20 active:opacity-70"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Text
          </a>
          <a
            href={`tel:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#34c759]/10 text-[#34c759] text-[11px] font-medium border border-[#34c759]/20 active:opacity-70"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5l3 .7a2 2 0 0 1 1.7 2z" />
            </svg>
            Call
          </a>
          <Link
            href={`/mag/clients/${lead.id}`}
            className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-[#222] text-[#999] text-[11px] font-medium border border-[#2a2a2a] active:opacity-70"
          >
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
    <div className="bg-[#151515] rounded-2xl border border-[#222] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3.5 py-3"
      >
        <span style={{ color: stage.color }}>
          <StageIcon icon={stage.icon} />
        </span>
        <div className="flex-1 min-w-0 text-left">
          <span className="text-sm font-semibold text-[#EEE]">{stage.name}</span>
          <span className="text-[10px] text-[#555] ml-2">{remaining.length} remaining</span>
        </div>
        <span className="text-lg font-semibold text-[#EEE]">{leads.length}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" className={`transition-transform ${expanded ? 'rotate-180' : ''}`} strokeLinecap="round" strokeLinejoin="round">
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
              <div className="border-t border-[#222] px-4 py-3 text-xs text-[#525252]">
                All reviewed in this stage.
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Applied / Signed Lease': true,
    'Tour Scheduled': true,
    'Follow Up': true,
    'Options Sent': true,
    'Discovery Call Made': true,
    'New Lead': false,
  })

  useEffect(() => {
    // Restore reviewed state from localStorage (resets daily)
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

  const today = new Date().toISOString().split('T')[0]
  const overdueCount = leads.filter(l => l.next_action_date && l.next_action_date < today).length
  const toursToday = leads.filter(l =>
    l.stage === 'Tour Scheduled' && l.next_action_date === today
  ).length

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#D4B68B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <div>
        <p className="text-[10px] text-[#555] uppercase tracking-widest">{dateStr}</p>
        <h1 className="text-2xl font-bold text-[#EEE] mt-1 tracking-tight">Your focus today.</h1>
        <p className="text-sm text-[#666] mt-0.5">One conversation at a time.</p>
      </div>

      {/* Pipeline stats */}
      <div className="bg-[#151515] rounded-2xl border border-[#222] p-4">
        <p className="text-[10px] text-[#555] uppercase tracking-widest">Active pipeline</p>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <div className="text-xl font-bold text-[#a78bfa]">{byStage('Tour Scheduled').length + toursToday}</div>
            <div className="text-[10px] text-[#555] mt-0.5">tours</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-[#EEE]'}`}>{overdueCount}</div>
            <div className="text-[10px] text-[#555] mt-0.5">overdue</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#D4B68B]">{priorityLeads.length}</div>
            <div className="text-[10px] text-[#555] mt-0.5">priority</div>
          </div>
        </div>
      </div>

      {/* Daily review */}
      <div className="bg-[#151515] rounded-2xl border border-[#222] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#EEE]">Daily priority review</span>
          <span className="text-sm text-[#D4B68B]">{reviewedCount}/{priorityLeads.length}</span>
        </div>
        <div className="h-1.5 bg-[#222] rounded-full mt-3 mb-2 overflow-hidden">
          <div className="h-full bg-[#D4B68B] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[11px] text-[#555]">{priorityLeads.length - reviewedCount} priority leads remaining</p>
      </div>

      {/* Worklist header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Your active worklist</span>
        <label className="flex items-center gap-1.5 text-[11px] text-[#777] cursor-pointer">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={e => setHideDone(e.target.checked)}
            className="accent-[#D4B68B] w-3.5 h-3.5"
          />
          Hide reviewed
        </label>
      </div>

      {/* Stage sections */}
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

      {leads.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#525252] text-sm">No active leads.</p>
        </div>
      )}

      {/* Archived section */}
      <div className="border-t border-[#1a1a1a] pt-4">
        <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">Not in worklist</p>
        <Link href="/mag/people?filter=archived" className="flex items-center justify-between py-2.5 px-3 bg-[#151515] rounded-xl border border-[#222]">
          <div>
            <span className="text-sm text-[#888]">Closed &amp; Archived</span>
            <span className="text-[10px] text-[#444] block">Retained records</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
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
