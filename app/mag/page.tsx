'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
import Link from 'next/link'

interface DbLead {
  id: number
  name: string | null
  phone: string | null
  stage: string | null
  budget: string | null
  beds: string | null
  area: string | null
  next_action: string | null
  next_action_date: string | null
  spoke_with: string | null
  created_at: string | null
  is_casa: boolean | null
}

// Priority bucket for Today sorting
function bucket(lead: DbLead): number {
  const today = new Date().toISOString().split('T')[0]
  const nad = lead.next_action_date
  const stage = (lead.stage ?? '').toLowerCase()

  if (nad && nad < today) return 0  // overdue
  if (nad && nad === today) return 1 // due today
  if (stage === 'tour scheduled') return 2
  if (['follow up', 'options sent', 'discovery call made'].includes(stage)) return 3
  if (['active', 'hot lead', 'qualified'].includes(stage)) return 4
  return 99  // new lead / unknown — not shown on Today
}

function recency(lead: DbLead): number {
  const ts = lead.spoke_with ?? lead.created_at
  return ts ? new Date(ts).getTime() : 0
}

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

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((d.getTime() - today.setHours(0,0,0,0)) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STAGE_DOTS: Record<string, string> = {
  'Tour Scheduled': '#a78bfa',
  'Follow Up': '#C9A87C',
  'Options Sent': '#60a5fa',
  'Discovery Call Made': '#34d399',
  'Active': '#C9A87C',
  'Hot Lead': '#f97316',
  'Qualified': '#60a5fa',
}

function LeadRow({ lead }: { lead: DbLead }) {
  const dotColor = STAGE_DOTS[lead.stage ?? ''] ?? '#525252'
  const lastContact = lead.spoke_with ?? lead.created_at
  const ago = timeAgo(lastContact)
  const isOverdue = lead.next_action_date &&
    lead.next_action_date < new Date().toISOString().split('T')[0]

  return (
    <Link href={`/mag/clients/${lead.id}`} className="block active:opacity-80">
      <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: dotColor }} />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-[#f5f5f5] truncate block">
                  {lead.name || lead.phone || 'Unknown'}
                </span>
                {lead.stage && lead.stage !== 'New Lead' && (
                  <span className="text-[10px] text-[#525252]">{lead.stage}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              {isOverdue && (
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-wide">overdue</span>
              )}
              {ago && <span className="text-[11px] text-[#404040]">{ago}</span>}
            </div>
          </div>

          {/* Criteria row */}
          {(lead.beds || lead.budget || lead.area) && (
            <div className="flex flex-wrap gap-x-3 mt-1.5 ml-4">
              {lead.beds && <span className="text-xs text-[#525252]">{lead.beds} bed</span>}
              {lead.budget && <span className="text-xs text-[#525252]">{lead.budget}</span>}
              {lead.area && <span className="text-xs text-[#525252]">{lead.area}</span>}
            </div>
          )}

          {/* Next action note */}
          {lead.next_action && (
            <div className="mt-2 ml-4 flex items-start gap-1.5">
              <span className="text-[#C9A87C] text-[10px] mt-0.5">→</span>
              <span className="text-[11px] text-[#737373] leading-snug">{lead.next_action}
                {lead.next_action_date && (
                  <span className={`ml-1.5 ${isOverdue ? 'text-red-400' : 'text-[#525252]'}`}>
                    · {dateLabel(lead.next_action_date)}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* iMessage + Call — only when phone is present */}
        {lead.phone && (
          <div className="flex gap-2 px-4 pb-3">
            <a
              href={`sms:${lead.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1c8ef9]/10 text-[#1c8ef9] text-xs font-medium border border-[#1c8ef9]/20 active:opacity-70"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              iMessage
            </a>
            <a
              href={`tel:${lead.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#34c759]/10 text-[#34c759] text-xs font-medium border border-[#34c759]/20 active:opacity-70"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.4 2 2 0 0 1 3.59 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call
            </a>
          </div>
        )}
      </div>
    </Link>
  )
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-[#C9A87C] uppercase tracking-widest">{label}</span>
      <span className="text-[10px] text-[#262626]">·</span>
      <span className="text-[10px] text-[#404040]">{count}</span>
    </div>
  )
}

function TodayContent() {
  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('id,name,phone,stage,budget,beds,area,next_action,next_action_date,spoke_with,created_at,is_casa')
      .not('stage', 'in', '("Closed Won","Archive","Archived")')
      .order('spoke_with', { ascending: false, nullsFirst: false })
      .limit(300)
      .then(({ data }) => {
        const all = (data ?? []) as DbLead[]
        // Sort by priority bucket, then recency within bucket
        const sorted = all
          .filter(l => bucket(l) < 99)
          .sort((a, b) => {
            const bd = bucket(a) - bucket(b)
            if (bd !== 0) return bd
            return recency(b) - recency(a)
          })
        setLeads(sorted)
        setLoading(false)
      })
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const overdue   = leads.filter(l => l.next_action_date && l.next_action_date < today)
  const dueToday  = leads.filter(l => l.next_action_date && l.next_action_date === today)
  const tours     = leads.filter(l => (l.stage ?? '').toLowerCase() === 'tour scheduled' && !l.next_action_date)
  const pipeline  = leads.filter(l =>
    ['follow up', 'options sent', 'discovery call made', 'active', 'hot lead', 'qualified']
      .includes((l.stage ?? '').toLowerCase()) && !l.next_action_date
  )

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#C9A87C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Date header */}
      <div>
        <p className="text-[11px] text-[#404040] uppercase tracking-widest">{dateStr}</p>
        <h1 className="text-2xl font-bold text-[#f5f5f5] mt-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Today
        </h1>
      </div>

      {/* Briefing */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4 space-y-3">
        <span className="text-xs font-semibold text-[#525252] uppercase tracking-wider">Pipeline</span>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-[#a78bfa]">{tours.length + dueToday.length}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">tours</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${overdue.length > 0 ? 'text-red-400' : 'text-[#f5f5f5]'}`}>
              {overdue.length}
            </div>
            <div className="text-[10px] text-[#525252] mt-0.5">overdue</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#C9A87C]">{pipeline.length}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">pipeline</div>
          </div>
        </div>
      </div>

      {/* Overdue follow-ups */}
      {overdue.length > 0 && (
        <section className="space-y-2">
          <SectionHeader label="Overdue" count={overdue.length} />
          {overdue.map(l => <LeadRow key={l.id} lead={l} />)}
        </section>
      )}

      {/* Due today */}
      {dueToday.length > 0 && (
        <section className="space-y-2">
          <SectionHeader label="Due Today" count={dueToday.length} />
          {dueToday.map(l => <LeadRow key={l.id} lead={l} />)}
        </section>
      )}

      {/* Tours */}
      {(tours.length > 0 || dueToday.some(l => (l.stage ?? '').toLowerCase() === 'tour scheduled')) && (
        <section className="space-y-2">
          <SectionHeader label="Tours" count={tours.length + dueToday.filter(l => (l.stage ?? '').toLowerCase() === 'tour scheduled').length} />
          {tours.map(l => <LeadRow key={l.id} lead={l} />)}
        </section>
      )}

      {/* Active pipeline */}
      {pipeline.length > 0 && (
        <section className="space-y-2">
          <SectionHeader label="Pipeline" count={pipeline.length} />
          {pipeline.map(l => <LeadRow key={l.id} lead={l} />)}
        </section>
      )}

      {/* Empty state */}
      {leads.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-[#525252] text-sm">No active pipeline contacts.</p>
          <p className="text-[#404040] text-xs">
            Tour Scheduled, Follow Up, and Options Sent leads appear here.
          </p>
        </div>
      )}
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
