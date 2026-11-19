'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'

interface StageCount {
  stage: string
  count: number
  pipeline_value: number
}

interface BusinessData {
  closedCount: number
  closedGCI: number
  activeStages: StageCount[]
  totalActivePipeline: number
  recentlySpokeWith: number
  overdueCount: number
}

const CLOSED_STAGES = ['Closed Won', 'Applied / Signed Lease']
const ARCHIVED_STAGES = ['Archive', 'Archived', 'new']
const STAGE_ORDER = [
  'Applied / Signed Lease',
  'Tour Scheduled',
  'Follow Up',
  'Options Sent',
  'Discovery Call Made',
  'New Lead',
]

function money(n: number | null | undefined): string {
  if (!n) return '—'
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toLocaleString()}`
}

function BusinessContent() {
  const [data, setData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()

    Promise.all([
      // Closed GCI
      sb.from('leads')
        .select('commission_actual, commission_estimate')
        .in('stage', CLOSED_STAGES),
      // Active pipeline by stage
      sb.from('leads')
        .select('stage, commission_estimate')
        .not('stage', 'in', `(${[...CLOSED_STAGES, ...ARCHIVED_STAGES].map(s => `"${s}"`).join(',')})`)
        .order('stage'),
      // Recently spoke with (last 7 days)
      sb.from('leads')
        .select('id', { count: 'exact' })
        .gte('spoke_with', new Date(Date.now() - 7 * 86400000).toISOString()),
      // Overdue
      sb.from('leads')
        .select('id', { count: 'exact' })
        .lt('next_action_date', new Date().toISOString().split('T')[0])
        .not('stage', 'in', `(${[...CLOSED_STAGES, ...ARCHIVED_STAGES].map(s => `"${s}"`).join(',')})`),
    ]).then(([closed, active, recent, overdue]) => {
      const closedGCI = (closed.data ?? []).reduce((sum, l) => sum + (l.commission_actual || l.commission_estimate || 0), 0)

      const stageCounts: Record<string, StageCount> = {}
      for (const lead of active.data ?? []) {
        const stage = lead.stage || 'Unknown'
        if (!stageCounts[stage]) stageCounts[stage] = { stage, count: 0, pipeline_value: 0 }
        stageCounts[stage].count++
        stageCounts[stage].pipeline_value += lead.commission_estimate || 0
      }

      const activeStages = STAGE_ORDER
        .map(s => stageCounts[s])
        .filter(Boolean)

      const totalActivePipeline = Object.values(stageCounts).reduce((sum, s) => sum + s.pipeline_value, 0)

      setData({
        closedCount: (closed.data ?? []).length,
        closedGCI,
        activeStages,
        totalActivePipeline,
        recentlySpokeWith: recent.count ?? 0,
        overdueCount: overdue.count ?? 0,
      })
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#D4B68B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#EEE] tracking-tight">Business</h1>
        <p className="text-xs text-[#555] mt-0.5">Pipeline and revenue overview.</p>
      </div>

      {/* Closed revenue */}
      <div className="bg-[#151515] rounded-2xl border border-[#222] p-4">
        <p className="text-[10px] text-[#555] uppercase tracking-widest mb-3">Closed revenue</p>
        <div className="flex items-end gap-3">
          <div className="text-3xl font-bold text-[#D4B68B] tracking-tight">
            {data.closedGCI > 0 ? money(data.closedGCI) : '—'}
          </div>
        </div>
        <p className="text-xs text-[#555] mt-1.5">
          {data.closedCount} deal{data.closedCount !== 1 ? 's' : ''} closed
          {data.closedGCI === 0 && ' · commission not entered in CRM'}
        </p>
      </div>

      {/* Activity */}
      <div className="bg-[#151515] rounded-2xl border border-[#222] p-4">
        <p className="text-[10px] text-[#555] uppercase tracking-widest mb-3">Activity</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#EEE]">{data.recentlySpokeWith}</div>
            <div className="text-[10px] text-[#555] mt-0.5">spoke with (7d)</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${data.overdueCount > 0 ? 'text-red-400' : 'text-[#EEE]'}`}>
              {data.overdueCount}
            </div>
            <div className="text-[10px] text-[#555] mt-0.5">overdue actions</div>
          </div>
        </div>
      </div>

      {/* Active pipeline by stage */}
      <div className="bg-[#151515] rounded-2xl border border-[#222] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-[#555] uppercase tracking-widest">Active pipeline</p>
          {data.totalActivePipeline > 0 && (
            <span className="text-sm font-semibold text-[#D4B68B]">{money(data.totalActivePipeline)}</span>
          )}
        </div>
        {data.activeStages.length > 0 ? (
          <div className="space-y-2">
            {data.activeStages.map(s => (
              <div key={s.stage} className="flex items-center justify-between py-1.5 border-b border-[#1f1f1f] last:border-0">
                <span className="text-sm text-[#CCC]">{s.stage}</span>
                <div className="flex items-center gap-3">
                  {s.pipeline_value > 0 && (
                    <span className="text-xs text-[#D4B68B]">{money(s.pipeline_value)}</span>
                  )}
                  <span className="text-xs font-semibold text-[#EEE] bg-[#222] rounded-full px-2 py-0.5">
                    {s.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#555]">No active pipeline data.</p>
        )}
      </div>

      <p className="text-[10px] text-[#333] text-center pb-2">
        Commission values reflect data entered in the CRM.
        Open a client profile to add commission details.
      </p>
    </div>
  )
}

export default function BusinessPage() {
  return (
    <MagShell>
      <BusinessContent />
    </MagShell>
  )
}
