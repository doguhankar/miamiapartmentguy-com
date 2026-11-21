'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
import Link from 'next/link'

interface DbLead {
  id: number
  name: string | null
  phone: string | null
  stage: string | null
  next_action: string | null
  next_action_date: string | null
}

type Group = 'Overdue' | 'Today' | 'This Week' | 'Upcoming'

const TODAY = new Date().toISOString().split('T')[0]

function getGroup(dateStr: string): Group {
  if (dateStr < TODAY) return 'Overdue'
  if (dateStr === TODAY) return 'Today'
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Math.floor((d.getTime() - new Date(TODAY + 'T00:00:00').getTime()) / 86400000)
  if (diff <= 7) return 'This Week'
  return 'Upcoming'
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Math.floor((d.getTime() - new Date(TODAY + 'T00:00:00').getTime()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function FollowUpCard({ lead }: { lead: DbLead }) {
  const isOverdue = lead.next_action_date! < TODAY

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--mag-surface-2)', border: '1px solid var(--mag-border-muted)' }}
    >
      <Link href={`/mag/clients/${lead.id}`} className="block px-4 pt-3.5 pb-3 active:opacity-80">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${isOverdue ? 'text-red-400' : ''}`}
              style={isOverdue ? {} : { color: 'var(--mag-accent)' }}
            >
              {dateLabel(lead.next_action_date!)}
            </span>
            <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: 'var(--mag-text-high)' }}>
              {lead.name || lead.phone || 'Unknown'}
            </p>
            {lead.stage && (
              <p className="text-[10px]" style={{ color: 'var(--mag-text-dim)' }}>{lead.stage}</p>
            )}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mag-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {lead.next_action && (
          <div className="mt-2 flex items-start gap-1.5">
            <span className={`text-[10px] mt-0.5 ${isOverdue ? 'text-red-400' : ''}`}
                  style={isOverdue ? {} : { color: 'var(--mag-accent)' }}>→</span>
            <p className="text-[11px] leading-snug" style={{ color: 'var(--mag-text-low)' }}>{lead.next_action}</p>
          </div>
        )}
      </Link>

      {lead.phone && (
        <div className="flex gap-2 px-4 pb-3">
          <a
            href={`sms:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-medium active:opacity-70"
            style={{
              backgroundColor: 'rgba(28,142,249,0.1)',
              color: '#1c8ef9',
              border: '1px solid rgba(28,142,249,0.2)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            iMessage
          </a>
          <a
            href={`tel:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-medium active:opacity-70"
            style={{
              backgroundColor: 'rgba(52,199,89,0.1)',
              color: '#34c759',
              border: '1px solid rgba(52,199,89,0.2)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call
          </a>
        </div>
      )}
    </div>
  )
}

const GROUP_ORDER: Group[] = ['Overdue', 'Today', 'This Week', 'Upcoming']
const GROUP_COLORS: Record<Group, string> = {
  Overdue: '#f87171',
  Today: '#D4B68B',
  'This Week': '#D4B68B',
  Upcoming: 'var(--mag-text-dim)',
}

function FollowUpsContent() {
  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('id,name,phone,stage,next_action,next_action_date')
      .not('next_action_date', 'is', null)
      .not('stage', 'in', '("Closed Won","Archive","Archived","new")')
      .order('next_action_date', { ascending: true })
      .then(({ data }) => {
        setLeads((data ?? []).filter(l => l.next_action_date))
        setLoading(false)
      })
  }, [])

  const grouped = useMemo(() => {
    const g: Record<Group, DbLead[]> = {
      Overdue: [], Today: [], 'This Week': [], Upcoming: [],
    }
    for (const lead of leads) {
      if (lead.next_action_date) g[getGroup(lead.next_action_date)].push(lead)
    }
    return g
  }, [leads])

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
    <div className="px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mag-text-high)' }}>Follow-ups</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--mag-text-dim)' }}>Scheduled conversations, not endless chasing.</p>
      </div>

      {leads.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: 'var(--mag-surface-2)', border: '1px solid var(--mag-border-muted)' }}
        >
          <svg className="w-8 h-8 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="var(--mag-accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--mag-text-high)' }}>No scheduled follow-ups</p>
          <p className="text-xs mt-1" style={{ color: 'var(--mag-text-dim)' }}>Open any client and set when you want to follow up.</p>
        </div>
      ) : (
        GROUP_ORDER.map(group => {
          const items = grouped[group]
          if (items.length === 0) return null
          return (
            <section key={group} className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: GROUP_COLORS[group] }}
                >
                  {group}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--mag-border-muted)' }}>·</span>
                <span className="text-[10px]" style={{ color: 'var(--mag-text-dim)' }}>{items.length}</span>
              </div>
              {items.map(lead => <FollowUpCard key={lead.id} lead={lead} />)}
            </section>
          )
        })
      )}
    </div>
  )
}

export default function FollowUpsPage() {
  return (
    <MagShell>
      <FollowUpsContent />
    </MagShell>
  )
}
