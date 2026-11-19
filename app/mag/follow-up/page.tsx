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
    <div className="bg-[#151515] rounded-2xl border border-[#222] overflow-hidden">
      <Link href={`/mag/clients/${lead.id}`} className="block px-4 pt-3.5 pb-3 active:opacity-80">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${isOverdue ? 'text-red-400' : 'text-[#D4B68B]'}`}>
              {dateLabel(lead.next_action_date!)}
            </span>
            <p className="text-sm font-semibold text-[#EEE] mt-0.5 truncate">
              {lead.name || lead.phone || 'Unknown'}
            </p>
            {lead.stage && (
              <p className="text-[10px] text-[#555]">{lead.stage}</p>
            )}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {lead.next_action && (
          <div className="mt-2 flex items-start gap-1.5">
            <span className={`text-[10px] mt-0.5 ${isOverdue ? 'text-red-400' : 'text-[#D4B68B]'}`}>→</span>
            <p className="text-[11px] text-[#777] leading-snug">{lead.next_action}</p>
          </div>
        )}
      </Link>

      {lead.phone && (
        <div className="flex gap-2 px-4 pb-3">
          <a
            href={`sms:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#1c8ef9]/10 text-[#1c8ef9] text-[11px] font-medium border border-[#1c8ef9]/20 active:opacity-70"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            iMessage
          </a>
          <a
            href={`tel:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#34c759]/10 text-[#34c759] text-[11px] font-medium border border-[#34c759]/20 active:opacity-70"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5l3 .7a2 2 0 0 1 1.7 2z" />
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
  Upcoming: '#555',
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
        <div className="w-5 h-5 border-2 border-[#D4B68B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#EEE] tracking-tight">Follow-ups</h1>
        <p className="text-xs text-[#555] mt-0.5">Scheduled conversations, not endless chasing.</p>
      </div>

      {leads.length === 0 ? (
        <div className="bg-[#151515] rounded-2xl border border-[#222] p-8 text-center">
          <svg className="w-8 h-8 text-[#D4B68B] mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="text-sm font-medium text-[#EEE]">No scheduled follow-ups</p>
          <p className="text-xs text-[#555] mt-1">Open any client and set when you want to follow up.</p>
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
                <span className="text-[10px] text-[#333]">·</span>
                <span className="text-[10px] text-[#555]">{items.length}</span>
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
