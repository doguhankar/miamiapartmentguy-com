'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
import Link from 'next/link'

// CRM stages treated as inactive — excluded from Today
const INACTIVE_STAGES = new Set([
  'new lead', 'new', '', 'closed won', 'archive', 'leased',
  'lost', 'dead', 'not qualified', 'applied / signed lease',
])

// Scanner contact from mag_contacts (primary source)
interface ScannerContact {
  phone: string
  display_name: string | null
  is_casa: boolean | null
  tier: string | null
  last_seen: string | null
  days_since_last: number | null
  unanswered_inbound: boolean | null
  business_signals: number | null
  total_messages: number | null
  synced_at: string | null
}

// CRM enrichment from leads (secondary)
interface CrmLead {
  id: number
  phone: string | null
  name: string | null
  stage: string | null
  imessage_stage: string | null
  imessage_last_seen: string | null
  budget: string | null
  beds: string | null
  area: string | null
  is_casa: boolean | null
  imessage_analysis: Record<string, unknown> | null
}

// Merged view of one contact
interface Contact {
  phone: string
  name: string
  tier: 'act_today' | 'follow_up' | 'monitor'
  last_seen: string | null
  unanswered_inbound: boolean
  business_signals: number
  synced_at: string | null
  crm_id: number | null
  crm_stage: string | null
  crm_budget: string | null
  crm_beds: string | null
  crm_area: string | null
  crm_analysis: Record<string, unknown> | null
  has_crm: boolean
  has_scanner: boolean
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

function mergeContacts(
  scannerContacts: ScannerContact[],
  crmLeads: CrmLead[],
): Contact[] {
  const crmByPhone = new Map<string, CrmLead>()
  for (const lead of crmLeads) {
    if (lead.phone) crmByPhone.set(lead.phone, lead)
  }

  const scannerPhones = new Set<string>()
  const result: Contact[] = []

  // 1. Scanner contacts (with optional CRM enrichment) — sorted by real iMessage timestamp
  for (const sc of scannerContacts) {
    scannerPhones.add(sc.phone)
    const crm = crmByPhone.get(sc.phone) ?? null
    const rawTier = sc.tier ?? 'monitor'
    const tier = (['act_today', 'follow_up', 'monitor'].includes(rawTier)
      ? rawTier
      : 'monitor') as Contact['tier']
    result.push({
      phone: sc.phone,
      name: sc.display_name || crm?.name || sc.phone,
      tier,
      last_seen: sc.last_seen,
      unanswered_inbound: sc.unanswered_inbound ?? false,
      business_signals: sc.business_signals ?? 0,
      synced_at: sc.synced_at,
      crm_id: crm?.id ?? null,
      crm_stage: crm?.stage ?? null,
      crm_budget: crm?.budget ?? null,
      crm_beds: crm?.beds ?? null,
      crm_area: crm?.area ?? null,
      crm_analysis: crm?.imessage_analysis ?? null,
      has_crm: crm !== null,
      has_scanner: true,
    })
  }

  // 2. Active CRM leads not yet in scanner — visible but unlabeled by iMessage
  for (const lead of crmLeads) {
    if (!lead.phone || scannerPhones.has(lead.phone)) continue
    const stage = (lead.stage ?? '').toLowerCase()
    if (INACTIVE_STAGES.has(stage)) continue  // hide New Lead / Closed / Archive from Today

    const rawTier = lead.imessage_stage
    const tier = (['act_today', 'follow_up'].includes(rawTier ?? '')
      ? rawTier
      : 'follow_up') as Contact['tier']

    result.push({
      phone: lead.phone,
      name: lead.name || lead.phone,
      tier,
      last_seen: lead.imessage_last_seen ?? null,
      unanswered_inbound: false,
      business_signals: 0,
      synced_at: null,
      crm_id: lead.id,
      crm_stage: lead.stage ?? null,
      crm_budget: lead.budget ?? null,
      crm_beds: lead.beds ?? null,
      crm_area: lead.area ?? null,
      crm_analysis: lead.imessage_analysis ?? null,
      has_crm: true,
      has_scanner: false,
    })
  }

  return result
}

function ContactRow({ contact }: { contact: Contact }) {
  const ai = contact.crm_analysis as any
  const tierColor = contact.tier === 'act_today' ? '#C9A87C' : '#525252'

  const inner = (
    <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: tierColor }} />
            <span className="text-sm font-semibold text-[#f5f5f5] truncate">
              {contact.name}
            </span>
            {/* Scanner-only: no CRM record yet */}
            {contact.has_scanner && !contact.has_crm && (
              <span className="shrink-0 text-[9px] font-semibold tracking-wider text-[#525252] bg-[#1a1a1a] rounded px-1.5 py-0.5 uppercase border border-[#262626]">
                scanner
              </span>
            )}
            {/* CRM-only: not yet in iMessage scanner */}
            {contact.has_crm && !contact.has_scanner && (
              <span className="shrink-0 text-[9px] font-semibold tracking-wider text-[#404040] bg-[#1a1a1a] rounded px-1.5 py-0.5 uppercase border border-[#262626]">
                crm
              </span>
            )}
            {contact.has_crm && contact.crm_stage === 'Closed Won' && (
              <span className="shrink-0 text-[9px] font-semibold tracking-wider text-[#C9A87C] bg-[#C9A87C]/10 rounded px-1.5 py-0.5 uppercase">
                client
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {contact.unanswered_inbound && (
              <span className="text-[9px] font-bold text-[#C9A87C] uppercase tracking-wide">reply</span>
            )}
            {contact.last_seen && (
              <span className="text-[11px] text-[#404040]">{timeAgo(contact.last_seen)}</span>
            )}
          </div>
        </div>

        {/* CRM stage + criteria */}
        {contact.has_crm && (contact.crm_budget || contact.crm_beds || contact.crm_area || contact.crm_stage) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 ml-4">
            {contact.crm_stage && contact.crm_stage !== 'New Lead' && (
              <span className="text-xs text-[#525252]">{contact.crm_stage}</span>
            )}
            {contact.crm_beds && <span className="text-xs text-[#525252]">{contact.crm_beds} bed</span>}
            {contact.crm_budget && <span className="text-xs text-[#525252]">{contact.crm_budget}</span>}
            {contact.crm_area && <span className="text-xs text-[#525252]">{contact.crm_area}</span>}
          </div>
        )}

        {/* Scanner-only: show phone since there's no CRM profile yet */}
        {contact.has_scanner && !contact.has_crm && (
          <div className="mt-1.5 ml-4">
            <span className="text-xs text-[#404040]">{contact.phone}</span>
          </div>
        )}

        {/* AI summary — only when present */}
        {ai?.summary && (
          <div className="mt-2.5 ml-4 pl-3 border-l border-[#262626]">
            <p className="text-[11px] text-[#737373] leading-snug">{ai.summary}</p>
            {ai?.next_action && (
              <p className="text-[11px] font-medium text-[#C9A87C] mt-1">→ {ai.next_action}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 pb-3">
        <a
          href={`sms:${contact.phone}`}
          onClick={e => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1c8ef9]/10 text-[#1c8ef9] text-xs font-medium border border-[#1c8ef9]/20 active:opacity-70"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          iMessage
        </a>
        <a
          href={`tel:${contact.phone}`}
          onClick={e => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#34c759]/10 text-[#34c759] text-xs font-medium border border-[#34c759]/20 active:opacity-70"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.4 2 2 0 0 1 3.59 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call
        </a>
      </div>
    </div>
  )

  if (!contact.crm_id) return <div key={contact.phone}>{inner}</div>

  return (
    <Link key={contact.phone} href={`/mag/clients/${contact.crm_id}`} className="block active:opacity-80">
      {inner}
    </Link>
  )
}

function TodayContent() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()

    // Primary: scanner contacts sorted by real conversation recency
    const scannerQ = sb
      .from('mag_contacts')
      .select('phone,display_name,is_casa,tier,last_seen,days_since_last,unanswered_inbound,business_signals,total_messages,synced_at')
      .order('last_seen', { ascending: false, nullsFirst: false })
      .limit(100)

    // Secondary: CRM leads for enrichment and CRM-only pipeline visibility
    const crmQ = sb
      .from('leads')
      .select('id,phone,name,stage,imessage_stage,imessage_last_seen,budget,beds,area,is_casa,imessage_analysis')
      .not('phone', 'is', null)

    Promise.all([scannerQ, crmQ]).then(([{ data: scanner }, { data: crm }]) => {
      const merged = mergeContacts(scanner ?? [], crm ?? [])
      setContacts(merged)
      const latest = (scanner ?? []).find(s => s.synced_at)
      setSyncedAt(latest?.synced_at ?? null)
      setLoading(false)
    })
  }, [])

  const scannerConnected = contacts.some(c => c.has_scanner)
  const actToday = contacts.filter(c => c.tier === 'act_today')
  const followUp = contacts.filter(c => c.tier === 'follow_up')
  const scannerOnly = contacts.filter(c => c.has_scanner && !c.has_crm)
  const crmOnly = contacts.filter(c => c.has_crm && !c.has_scanner)

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
            <div className="text-xl font-bold text-[#C9A87C]">{actToday.length}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">act today</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#f5f5f5]">{followUp.length}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">follow up</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#f5f5f5]">{contacts.length}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">total</div>
          </div>
        </div>
        {scannerConnected && syncedAt && (
          <p className="text-[10px] text-[#404040] border-t border-[#1f1f1f] pt-2">
            Synced {timeAgo(syncedAt)} · {scannerOnly.length} scanner-only · {crmOnly.length} CRM pipeline
          </p>
        )}
        {!scannerConnected && (
          <p className="text-[11px] text-[#404040] leading-snug border-t border-[#1f1f1f] pt-3">
            Run <code className="text-[#C9A87C] bg-[#C9A87C]/10 px-1 rounded">python sync_contacts.py</code> on your Mac to connect iMessage data.
          </p>
        )}
      </div>

      {/* Act Today */}
      {actToday.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#C9A87C] uppercase tracking-widest">Act Today</span>
            <span className="text-[10px] text-[#262626]">·</span>
            <span className="text-[10px] text-[#404040]">{actToday.length}</span>
          </div>
          {actToday.map(c => <ContactRow key={c.phone} contact={c} />)}
        </section>
      )}

      {/* Follow Up — scanner contacts first, CRM-only after */}
      {followUp.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest">Follow Up</span>
            <span className="text-[10px] text-[#262626]">·</span>
            <span className="text-[10px] text-[#404040]">{followUp.length}</span>
          </div>
          {followUp.slice(0, 20).map(c => <ContactRow key={c.phone} contact={c} />)}
          {followUp.length > 20 && (
            <p className="text-xs text-[#404040] text-center py-2">+{followUp.length - 20} more in People</p>
          )}
        </section>
      )}

      {contacts.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-[#525252] text-sm">No contacts yet.</p>
          <p className="text-[#404040] text-xs leading-relaxed">
            Run <code className="text-[#C9A87C]">python sync_contacts.py</code> on your Mac,<br />
            then reload.
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
