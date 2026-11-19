'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
import { LeadCard } from '@/components/mag/lead-card'

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
}

function TodayContent() {
  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('id,name,phone,stage,imessage_stage,imessage_last_seen,imessage_analysis,budget,beds,area,is_casa')
      .eq('is_casa', true)
      .order('imessage_last_seen', { ascending: false, nullsFirst: false })
      .limit(30)
      .then(({ data }) => {
        setLeads(data ?? [])
        setLoading(false)
      })
  }, [])

  // Sort: AI-urgent first, then by recency
  const sorted = [...leads].sort((a, b) => {
    const aUrgency = (a.imessage_analysis as any)?.urgency === 'high' ? 0 : 1
    const bUrgency = (b.imessage_analysis as any)?.urgency === 'high' ? 0 : 1
    if (aUrgency !== bUrgency) return aUrgency - bUrgency
    const aTime = a.imessage_last_seen ? new Date(a.imessage_last_seen).getTime() : 0
    const bTime = b.imessage_last_seen ? new Date(b.imessage_last_seen).getTime() : 0
    return bTime - aTime
  })

  const urgent = sorted.filter(l => (l.imessage_analysis as any)?.urgency === 'high')
  const rest = sorted.filter(l => (l.imessage_analysis as any)?.urgency !== 'high')

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Today</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {leads.length} active client{leads.length !== 1 ? 's' : ''} · sorted by recency
        </p>
      </div>

      {urgent.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">⚡ Urgent</span>
            <span className="text-xs text-gray-300">AI-flagged · unvalidated</span>
          </div>
          {urgent.map(lead => (
            <LeadCard key={lead.id}
              id={lead.id} name={lead.name} phone={lead.phone}
              stage={lead.stage} imessageStage={lead.imessage_stage}
              budget={lead.budget} beds={lead.beds} area={lead.area}
              lastSeen={lead.imessage_last_seen} isCasa={lead.is_casa ?? false}
              aiSummary={(lead.imessage_analysis as any)?.summary}
              aiUrgency={(lead.imessage_analysis as any)?.urgency}
              aiConfidence={(lead.imessage_analysis as any)?.confidence}
              nextAction={(lead.imessage_analysis as any)?.next_action}
            />
          ))}
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-2">
          {urgent.length > 0 && (
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active</span>
          )}
          {rest.map(lead => (
            <LeadCard key={lead.id}
              id={lead.id} name={lead.name} phone={lead.phone}
              stage={lead.stage} imessageStage={lead.imessage_stage}
              budget={lead.budget} beds={lead.beds} area={lead.area}
              lastSeen={lead.imessage_last_seen} isCasa={lead.is_casa ?? false}
              aiSummary={(lead.imessage_analysis as any)?.summary}
              aiUrgency={(lead.imessage_analysis as any)?.urgency}
              aiConfidence={(lead.imessage_analysis as any)?.confidence}
              nextAction={(lead.imessage_analysis as any)?.next_action}
            />
          ))}
        </section>
      )}

      {leads.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No active clients. Run the scanner to populate.
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
