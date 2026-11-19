'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
import Link from 'next/link'

interface DbLead {
  id: number
  name: string | null
  phone: string | null
  stage: string | null
  budget: string | null
  area: string | null
  next_action: string | null
  next_action_date: string | null
  spoke_with: string | null
  created_at: string | null
}

const ARCHIVED_STAGES = ['Closed Won', 'Archive', 'Archived', 'new']

type StatusFilter = 'All' | 'Active' | 'Archived'

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'recently'
}

function getStatus(lead: DbLead): StatusFilter {
  if (ARCHIVED_STAGES.includes(lead.stage ?? '')) return 'Archived'
  return 'Active'
}

function ClientCard({ lead }: { lead: DbLead }) {
  const ago = timeAgo(lead.spoke_with ?? lead.created_at)
  const isArchived = ARCHIVED_STAGES.includes(lead.stage ?? '')
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = lead.next_action_date && lead.next_action_date < today

  return (
    <div className="bg-[#151515] rounded-2xl border border-[#222] overflow-hidden">
      <Link href={`/mag/clients/${lead.id}`} className="block px-4 pt-3.5 pb-3 active:opacity-80 transition-opacity">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0 mt-[3px]"
              style={{ backgroundColor: isArchived ? '#333' : lead.stage === 'Tour Scheduled' ? '#a78bfa' : '#D4B68B' }}
            />
            <div className="min-w-0">
              <span className={`text-sm font-semibold truncate block ${isArchived ? 'text-[#555]' : 'text-[#EEE]'}`}>
                {lead.name || lead.phone || 'Unknown'}
              </span>
              <span className="text-[10px] text-[#555]">{lead.stage}</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {ago && <span className="text-[10px] text-[#404040]">{ago}</span>}
            {lead.budget && <span className="text-xs text-[#D4B68B]">{lead.budget}</span>}
          </div>
        </div>

        {lead.next_action && (
          <div className="mt-1.5 ml-3.5 flex items-start gap-1">
            <span className={`text-[10px] mt-0.5 ${isOverdue ? 'text-red-400' : 'text-[#D4B68B]'}`}>→</span>
            <span className="text-[10px] text-[#666] leading-snug">
              {lead.next_action}
              {lead.next_action_date && (
                <span className={`ml-1 ${isOverdue ? 'text-red-400' : 'text-[#444]'}`}>
                  · {new Date(lead.next_action_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </span>
          </div>
        )}
      </Link>

      {lead.phone && !isArchived && (
        <div className="flex gap-2 px-4 pb-3">
          <a
            href={`sms:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#1c8ef9]/10 text-[#1c8ef9] text-[11px] font-medium border border-[#1c8ef9]/20 active:opacity-70"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Text
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

function PeopleContent() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter') === 'archived' ? 'Archived' : 'All'

  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilter)

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('id,name,phone,stage,budget,area,next_action,next_action_date,spoke_with,created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLeads(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchesFilter =
        statusFilter === 'All' ||
        (statusFilter === 'Archived' && ARCHIVED_STAGES.includes(l.stage ?? '')) ||
        (statusFilter === 'Active' && !ARCHIVED_STAGES.includes(l.stage ?? ''))

      const matchesSearch = !q.trim() || (
        l.name?.toLowerCase().includes(q.toLowerCase()) ||
        l.phone?.includes(q) ||
        l.area?.toLowerCase().includes(q.toLowerCase()) ||
        l.stage?.toLowerCase().includes(q.toLowerCase())
      )

      return matchesFilter && matchesSearch
    })
  }, [leads, q, statusFilter])

  const counts = useMemo(() => ({
    all: leads.length,
    active: leads.filter(l => !ARCHIVED_STAGES.includes(l.stage ?? '')).length,
    archived: leads.filter(l => ARCHIVED_STAGES.includes(l.stage ?? '')).length,
  }), [leads])

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
        <h1 className="text-2xl font-bold text-[#EEE] tracking-tight">All conversations</h1>
        <p className="text-xs text-[#555] mt-0.5">Nobody disappears when you change their status.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#404040]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name, phone, area…"
          className="w-full pl-8 pr-4 py-2.5 bg-[#151515] border border-[#262626] rounded-xl text-sm text-[#EEE] placeholder-[#404040] outline-none focus:border-[#404040]"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {(['All', 'Active', 'Archived'] as StatusFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f
                ? 'bg-[#2a2419] border border-[#D4B68B] text-[#D4B68B]'
                : 'bg-[#151515] border border-[#222] text-[#777]'
            }`}
          >
            {f} ({f === 'All' ? counts.all : f === 'Active' ? counts.active : counts.archived})
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2">
        {filtered.map(lead => (
          <ClientCard key={lead.id} lead={lead} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#525252] text-sm">
              {q ? `No results for "${q}"` : 'No contacts in this group.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PeoplePage() {
  return (
    <MagShell>
      <PeopleContent />
    </MagShell>
  )
}
