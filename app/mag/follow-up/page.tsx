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
  next_action: string | null
  next_action_date: string | null
}

function FollowUpContent() {
  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('id,name,phone,stage,imessage_stage,imessage_last_seen,imessage_analysis,budget,beds,area,is_casa,next_action,next_action_date')
      .or('stage.eq.Follow Up,imessage_stage.eq.follow_up')
      .order('next_action_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        setLeads(data ?? [])
        setLoading(false)
      })
  }, [])

  const overdue = leads.filter(l => {
    if (!l.next_action_date) return false
    return new Date(l.next_action_date) < new Date()
  })
  const upcoming = leads.filter(l => {
    if (!l.next_action_date) return true
    return new Date(l.next_action_date) >= new Date()
  })

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
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Follow-ups</h1>
        <p className="text-xs text-gray-400 mt-0.5">{leads.length} pending</p>
      </div>

      {overdue.length > 0 && (
        <section className="space-y-2">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Overdue · {overdue.length}</span>
          {overdue.map(lead => (
            <div key={lead.id} className="space-y-1">
              {lead.next_action && (
                <p className="text-xs font-medium text-gray-500 px-1">📋 {lead.next_action}</p>
              )}
              <LeadCard
                id={lead.id} name={lead.name} phone={lead.phone}
                stage={lead.stage} imessageStage={lead.imessage_stage}
                budget={lead.budget} beds={lead.beds} area={lead.area}
                lastSeen={lead.imessage_last_seen} isCasa={lead.is_casa ?? false}
                aiSummary={(lead.imessage_analysis as any)?.summary}
                nextAction={(lead.imessage_analysis as any)?.next_action}
              />
            </div>
          ))}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Upcoming · {upcoming.length}</span>
          {upcoming.map(lead => (
            <div key={lead.id} className="space-y-1">
              {lead.next_action && (
                <p className="text-xs text-gray-500 px-1">📋 {lead.next_action}</p>
              )}
              <LeadCard
                id={lead.id} name={lead.name} phone={lead.phone}
                stage={lead.stage} imessageStage={lead.imessage_stage}
                budget={lead.budget} beds={lead.beds} area={lead.area}
                lastSeen={lead.imessage_last_seen} isCasa={lead.is_casa ?? false}
                aiSummary={(lead.imessage_analysis as any)?.summary}
                nextAction={(lead.imessage_analysis as any)?.next_action}
              />
            </div>
          ))}
        </section>
      )}

      {leads.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No follow-ups. Set a stage to &ldquo;Follow Up&rdquo; in a client profile.
        </div>
      )}
    </div>
  )
}

export default function FollowUpPage() {
  return (
    <MagShell>
      <FollowUpContent />
    </MagShell>
  )
}
