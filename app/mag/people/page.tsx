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
  imessage_stage: string | null
  imessage_last_seen: string | null
  imessage_analysis: Record<string, unknown> | null
  budget: string | null
  beds: string | null
  area: string | null
  is_casa: boolean | null
  move_in_timing: string | null
  created_at: string | null
}

type Category =
  | 'active'
  | 'applying'
  | 'touring'
  | 'awaiting'
  | 'future'
  | 'dormant'
  | 'closed'
  | 'unknown'

const CATEGORY_LABELS: Record<Category, string> = {
  active: 'Active',
  applying: 'Applying',
  touring: 'Touring',
  awaiting: 'Awaiting Response',
  future: 'Future Move-ins',
  dormant: 'Dormant',
  closed: 'Closed',
  unknown: 'New / Unknown',
}

const CATEGORY_COLORS: Record<Category, string> = {
  active: '#C9A87C',
  applying: '#60a5fa',
  touring: '#a78bfa',
  awaiting: '#fb923c',
  future: '#34d399',
  dormant: '#404040',
  closed: '#262626',
  unknown: '#525252',
}

function categorize(lead: DbLead): Category {
  const stage = (lead.stage ?? '').toLowerCase()
  const iStage = (lead.imessage_stage ?? '').toLowerCase()
  const ai = lead.imessage_analysis as any
  const hasUnanswered = ai?.unanswered_inbound === true
  const daysSinceLast = lead.imessage_last_seen
    ? Math.floor((Date.now() - new Date(lead.imessage_last_seen).getTime()) / 86400000)
    : null
  const createdAgo = lead.created_at
    ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000)
    : 0

  if (['leased', 'closed won', 'lost', 'closed', 'not qualified', 'dead'].some(s => stage.includes(s))) {
    return 'closed'
  }
  if (['touring', 'tour scheduled', 'showing'].some(s => stage.includes(s))) {
    return 'touring'
  }
  if (['qualified', 'application', 'applied', 'applying'].some(s => stage.includes(s))) {
    return 'applying'
  }
  if (stage.includes('future') || (lead.move_in_timing && lead.move_in_timing.toLowerCase().includes('future'))) {
    return 'future'
  }
  if (['active', 'hot lead', 'hot'].some(s => stage.includes(s))) {
    return 'active'
  }
  if (hasUnanswered || stage.includes('follow up') || stage.includes('waiting') || iStage === 'act_today') {
    return 'awaiting'
  }
  if (daysSinceLast !== null && daysSinceLast > 30) return 'dormant'
  if (createdAgo > 60 && !lead.imessage_last_seen && !stage) return 'dormant'
  if (stage === '' || stage === 'new lead' || stage === 'lead') return 'unknown'

  return 'unknown'
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}h`
  return 'now'
}

function PersonRow({ lead, color }: { lead: DbLead; color: string }) {
  const displayTime = timeAgo(lead.imessage_last_seen)
  const ai = lead.imessage_analysis as any

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
      <Link href={`/mag/clients/${lead.id}`} className="block px-4 pt-3.5 pb-3 active:bg-[#161616] transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[3px]" style={{ backgroundColor: color }} />
            <span className="text-sm font-semibold text-[#f5f5f5] truncate">
              {lead.name || lead.phone || 'Unknown'}
            </span>
            {lead.is_casa && (
              <span className="shrink-0 text-[9px] font-semibold text-[#C9A87C] bg-[#C9A87C]/10 rounded px-1.5 py-0.5 uppercase tracking-wide">
                client
              </span>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {displayTime && <span className="text-[11px] text-[#404040]">{displayTime}</span>}
            {lead.stage && (
              <span className="text-[9px] text-[#525252] border border-[#262626] rounded px-1.5 py-0.5">{lead.stage}</span>
            )}
          </div>
        </div>
        {(lead.budget || lead.beds || lead.area) && (
          <div className="flex flex-wrap gap-x-3 mt-1.5 ml-4">
            {lead.beds && <span className="text-[11px] text-[#525252]">{lead.beds} bed</span>}
            {lead.budget && <span className="text-[11px] text-[#525252]">{lead.budget}</span>}
            {lead.area && <span className="text-[11px] text-[#525252]">{lead.area}</span>}
          </div>
        )}
        {ai?.next_action && (
          <p className="text-[11px] text-[#C9A87C] mt-1.5 ml-4">→ {ai.next_action}</p>
        )}
      </Link>
      {lead.phone && (
        <div className="flex gap-2 px-4 pb-3">
          <a href={`sms:${lead.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#1c8ef9]/10 text-[#1c8ef9] text-[11px] font-medium border border-[#1c8ef9]/20 active:opacity-70">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            iMessage
          </a>
          <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#34c759]/10 text-[#34c759] text-[11px] font-medium border border-[#34c759]/20 active:opacity-70">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.4 2 2 0 0 1 3.59 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call
          </a>
        </div>
      )}
    </div>
  )
}

const CATEGORY_ORDER: Category[] = ['active', 'applying', 'touring', 'awaiting', 'future', 'dormant', 'closed', 'unknown']

function PeopleContent() {
  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState<Record<Category, boolean>>({
    active: true, applying: true, touring: true, awaiting: true,
    future: false, dormant: false, closed: false, unknown: false,
  })

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('id,name,phone,stage,imessage_stage,imessage_last_seen,imessage_analysis,budget,beds,area,is_casa,move_in_timing,created_at')
      .order('imessage_last_seen', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLeads(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return leads
    const term = q.toLowerCase()
    return leads.filter(l =>
      l.name?.toLowerCase().includes(term) ||
      l.phone?.includes(term) ||
      l.area?.toLowerCase().includes(term) ||
      l.stage?.toLowerCase().includes(term)
    )
  }, [leads, q])

  const grouped = useMemo(() => {
    const g: Record<Category, DbLead[]> = {
      active: [], applying: [], touring: [], awaiting: [],
      future: [], dormant: [], closed: [], unknown: [],
    }
    for (const lead of filtered) g[categorize(lead)].push(lead)
    return g
  }, [filtered])

  const toggleCategory = (cat: Category) =>
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }))

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#C9A87C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#f5f5f5]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>People</h1>
        <p className="text-[11px] text-[#404040] mt-0.5">{leads.length} contacts</p>
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
          placeholder="Search name, phone, area…"
          className="w-full pl-8 pr-4 py-2.5 bg-[#111111] border border-[#262626] rounded-xl text-sm text-[#f5f5f5] placeholder-[#404040] outline-none focus:border-[#404040]"
        />
      </div>

      {/* Category sections */}
      {CATEGORY_ORDER.map(cat => {
        const people = grouped[cat]
        if (people.length === 0) return null
        const color = CATEGORY_COLORS[cat]
        const isOpen = expanded[cat]

        return (
          <section key={cat} className="space-y-2">
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-[10px] text-[#404040]">{people.length}</span>
              </div>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth="2.5"
                className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isOpen && (
              <div className="space-y-2">
                {people.map(lead => (
                  <PersonRow key={lead.id} lead={lead} color={color} />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#525252] text-sm">{q ? `No results for "${q}"` : 'No contacts yet.'}</p>
        </div>
      )}
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
