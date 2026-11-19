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
  imessage_stage: string | null
  imessage_last_seen: string | null
  imessage_analysis: Record<string, unknown> | null
  budget: string | null
  beds: string | null
  area: string | null
  is_casa: boolean | null
  created_at: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

function isScannerConnected(leads: DbLead[]) {
  return leads.some(l => l.imessage_last_seen !== null)
}

function getTier(lead: DbLead): 'act_today' | 'follow_up' | 'monitor' | 'crm' {
  const stage = lead.imessage_stage
  if (stage === 'act_today') return 'act_today'
  if (stage === 'follow_up') return 'follow_up'
  if (stage === 'monitor') return 'monitor'
  return 'crm'
}

function ContactRow({ lead }: { lead: DbLead }) {
  const ai = lead.imessage_analysis as any
  const tier = getTier(lead)
  const scannerTime = lead.imessage_last_seen
  const displayTime = scannerTime
    ? timeAgo(scannerTime)
    : ''
  const hasUnanswered = ai?.unanswered_inbound === true
  const tierDot = tier === 'act_today' ? '#C9A87C' : tier === 'follow_up' ? '#525252' : '#2a2a2a'

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
      <Link href={`/mag/clients/${lead.id}`} className="block px-4 pt-4 pb-3 active:bg-[#161616] transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: tierDot }} />
            <span className="text-sm font-semibold text-[#f5f5f5] truncate">
              {lead.name || lead.phone || 'Unknown'}
            </span>
            {lead.is_casa && (
              <span className="shrink-0 text-[9px] font-semibold tracking-wider text-[#C9A87C] bg-[#C9A87C]/10 rounded px-1.5 py-0.5 uppercase">
                client
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasUnanswered && (
              <span className="text-[9px] font-bold text-[#C9A87C] uppercase tracking-wide">reply</span>
            )}
            {displayTime && (
              <span className="text-[11px] text-[#404040]">{displayTime}</span>
            )}
          </div>
        </div>

        {/* Criteria row */}
        {(lead.budget || lead.beds || lead.area) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 ml-4">
            {lead.beds && <span className="text-xs text-[#525252]">{lead.beds} bed</span>}
            {lead.budget && <span className="text-xs text-[#525252]">{lead.budget}</span>}
            {lead.area && <span className="text-xs text-[#525252]">{lead.area}</span>}
          </div>
        )}

        {/* AI summary — clearly marked unvalidated */}
        {ai?.summary && (
          <div className="mt-2.5 ml-4 pl-3 border-l border-[#262626]">
            <p className="text-[11px] text-[#737373] leading-snug">{ai.summary}</p>
            {ai?.next_action && (
              <p className="text-[11px] font-medium text-[#C9A87C] mt-1">→ {ai.next_action}</p>
            )}
          </div>
        )}
      </Link>

      {lead.phone && (
        <div className="flex gap-2 px-4 pb-3">
          <a
            href={`sms:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1c8ef9]/10 text-[#1c8ef9] text-xs font-medium border border-[#1c8ef9]/20 active:opacity-70"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            iMessage
          </a>
          <a
            href={`tel:${lead.phone}`}
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
  )
}

function TodayContent() {
  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    // All leads — no is_casa filter. Order by scanner recency first, then CRM created date.
    sb.from('leads')
      .select('id,name,phone,stage,imessage_stage,imessage_last_seen,imessage_analysis,budget,beds,area,is_casa,created_at')
      .order('imessage_last_seen', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setLeads(data ?? [])
        setLoading(false)
      })
  }, [])

  const scannerConnected = isScannerConnected(leads)

  // With scanner data: group by tier. Without: group by stage priority.
  const actToday = leads.filter(l => getTier(l) === 'act_today')
  const followUp = leads.filter(l => getTier(l) === 'follow_up')
  // CRM-only leads (no scanner data): sort by stage priority
  const crmOnly = leads.filter(l => getTier(l) === 'crm' || getTier(l) === 'monitor')
  const crmActive = crmOnly.filter(l => ['Active', 'Hot Lead', 'Qualified'].includes(l.stage ?? ''))
  const crmRest = crmOnly.filter(l => !['Active', 'Hot Lead', 'Qualified'].includes(l.stage ?? ''))

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

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

      {/* Briefing card */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#525252] uppercase tracking-wider">Briefing</span>
          {scannerConnected
            ? <span className="text-[10px] text-[#34c759] font-medium">● Scanner connected</span>
            : <span className="text-[10px] text-[#404040] font-medium">○ Scanner pending</span>
          }
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-[#C9A87C]">{actToday.length || crmActive.length}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">{scannerConnected ? 'act today' : 'active'}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#f5f5f5]">{followUp.length || leads.filter(l => l.stage === 'Follow Up').length}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">follow up</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#f5f5f5]">{leads.length}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">total</div>
          </div>
        </div>
        {!scannerConnected && (
          <p className="text-[11px] text-[#404040] leading-snug border-t border-[#1f1f1f] pt-3">
            Run <code className="text-[#C9A87C] bg-[#C9A87C]/10 px-1 rounded">python sync_contacts.py</code> on your Mac to connect real conversation data.
          </p>
        )}
      </div>

      {/* Act Today — scanner tier */}
      {actToday.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#C9A87C] uppercase tracking-widest">Act Today</span>
            <span className="text-[10px] text-[#262626]">·</span>
            <span className="text-[10px] text-[#404040]">{actToday.length}</span>
          </div>
          {actToday.map(lead => <ContactRow key={lead.id} lead={lead} />)}
        </section>
      )}

      {/* Follow Up — scanner tier */}
      {followUp.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest">Follow Up</span>
            <span className="text-[10px] text-[#262626]">·</span>
            <span className="text-[10px] text-[#404040]">{followUp.length}</span>
          </div>
          {followUp.slice(0, 15).map(lead => <ContactRow key={lead.id} lead={lead} />)}
          {followUp.length > 15 && (
            <p className="text-xs text-[#404040] text-center py-2">+{followUp.length - 15} more in People</p>
          )}
        </section>
      )}

      {/* CRM-only: no scanner data yet */}
      {!scannerConnected && crmActive.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest">Active Leads</span>
            <span className="text-[10px] text-[#262626]">·</span>
            <span className="text-[10px] text-[#404040]">{crmActive.length}</span>
          </div>
          {crmActive.map(lead => <ContactRow key={lead.id} lead={lead} />)}
        </section>
      )}

      {!scannerConnected && crmRest.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#404040] uppercase tracking-widest">Other Leads</span>
            <span className="text-[10px] text-[#262626]">·</span>
            <span className="text-[10px] text-[#404040]">{crmRest.length}</span>
          </div>
          {crmRest.slice(0, 10).map(lead => <ContactRow key={lead.id} lead={lead} />)}
          {crmRest.length > 10 && (
            <p className="text-xs text-[#404040] text-center py-2">+{crmRest.length - 10} more in People</p>
          )}
        </section>
      )}

      {leads.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-[#525252] text-sm">No leads yet.</p>
          <p className="text-[#404040] text-xs">Import contacts or run the scanner.</p>
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
