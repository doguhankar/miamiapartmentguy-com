'use client'

import { useEffect, useState, useMemo } from 'react'
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

function ClientsContent() {
  const [leads, setLeads] = useState<DbLead[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('id,name,phone,stage,imessage_stage,imessage_last_seen,imessage_analysis,budget,beds,area,is_casa')
      .order('name', { ascending: true })
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

  const casaLeads = filtered.filter(l => l.is_casa)
  const nonCasa = filtered.filter(l => !l.is_casa)

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Clients</h1>
        <p className="text-xs text-gray-400 mt-0.5">{leads.length} total · {leads.filter(l => l.is_casa).length} confirmed clients</p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name, phone, area…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {casaLeads.length > 0 && (
            <section className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Confirmed Clients · {casaLeads.length}
              </span>
              {casaLeads.map(lead => (
                <LeadCard key={lead.id}
                  id={lead.id} name={lead.name} phone={lead.phone}
                  stage={lead.stage} imessageStage={lead.imessage_stage}
                  budget={lead.budget} beds={lead.beds} area={lead.area}
                  lastSeen={lead.imessage_last_seen} isCasa
                  aiSummary={(lead.imessage_analysis as any)?.summary}
                  aiUrgency={(lead.imessage_analysis as any)?.urgency}
                  aiConfidence={(lead.imessage_analysis as any)?.confidence}
                  nextAction={(lead.imessage_analysis as any)?.next_action}
                />
              ))}
            </section>
          )}

          {nonCasa.length > 0 && (
            <section className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Web Leads · {nonCasa.length}
              </span>
              {nonCasa.map(lead => (
                <LeadCard key={lead.id}
                  id={lead.id} name={lead.name} phone={lead.phone}
                  stage={lead.stage} imessageStage={lead.imessage_stage}
                  budget={lead.budget} beds={lead.beds} area={lead.area}
                  lastSeen={lead.imessage_last_seen} isCasa={false}
                  aiSummary={(lead.imessage_analysis as any)?.summary}
                  nextAction={(lead.imessage_analysis as any)?.next_action}
                />
              ))}
            </section>
          )}

          {filtered.length === 0 && (
            <p className="text-center py-12 text-sm text-gray-400">
              {q ? `No results for "${q}"` : 'No clients yet.'}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function ClientsPage() {
  return (
    <MagShell>
      <ClientsContent />
    </MagShell>
  )
}
