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
        <div
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--mag-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mag-text-high)' }}>Business</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--mag-text-dim)' }}>Pipeline and revenue overview.</p>
      </div>

      {/* Closed revenue */}
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: 'var(--mag-surface-2)', border: '1px solid var(--mag-border-muted)' }}
      >
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--mag-text-dim)' }}>Closed revenue</p>
        <div className="flex items-end gap-3">
          <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--mag-accent)' }}>
            {data.closedGCI > 0 ? money(data.closedGCI) : '—'}
          </div>
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--mag-text-dim)' }}>
          {data.closedCount} deal{data.closedCount !== 1 ? 's' : ''} closed
          {data.closedGCI === 0 && ' · commission not entered in CRM'}
        </p>
      </div>

      {/* Activity */}
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: 'var(--mag-surface-2)', border: '1px solid var(--mag-border-muted)' }}
      >
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--mag-text-dim)' }}>Activity</p>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: 'var(--mag-surface-3)' }}
          >
            <div className="text-2xl font-bold" style={{ color: 'var(--mag-text-high)' }}>{data.recentlySpokeWith}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--mag-text-dim)' }}>spoke with (7d)</div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: 'var(--mag-surface-3)' }}
          >
            <div
              className={`text-2xl font-bold ${data.overdueCount > 0 ? 'text-red-400' : ''}`}
              style={data.overdueCount > 0 ? {} : { color: 'var(--mag-text-high)' }}
            >
              {data.overdueCount}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--mag-text-dim)' }}>overdue actions</div>
          </div>
        </div>
      </div>

      {/* Active pipeline by stage */}
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: 'var(--mag-surface-2)', border: '1px solid var(--mag-border-muted)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--mag-text-dim)' }}>Active pipeline</p>
          {data.totalActivePipeline > 0 && (
            <span className="text-sm font-semibold" style={{ color: 'var(--mag-accent)' }}>{money(data.totalActivePipeline)}</span>
          )}
        </div>
        {data.activeStages.length > 0 ? (
          <div className="space-y-2">
            {data.activeStages.map(s => (
              <div
                key={s.stage}
                className="flex items-center justify-between py-1.5 last:border-0"
                style={{ borderBottom: '1px solid var(--mag-border)' }}
              >
                <span className="text-sm" style={{ color: 'var(--mag-text-mid)' }}>{s.stage}</span>
                <div className="flex items-center gap-3">
                  {s.pipeline_value > 0 && (
                    <span className="text-xs" style={{ color: 'var(--mag-accent)' }}>{money(s.pipeline_value)}</span>
                  )}
                  <span
                    className="text-xs font-semibold rounded-full px-2 py-0.5"
                    style={{ color: 'var(--mag-text-high)', backgroundColor: 'var(--mag-surface-3)' }}
                  >
                    {s.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--mag-text-dim)' }}>No active pipeline data.</p>
        )}
      </div>

      <p className="text-[10px] text-center pb-2" style={{ color: 'var(--mag-text-faint)' }}>
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
