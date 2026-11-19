'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'

interface Agent {
  email: string
  display_name: string | null
}

interface AgentStats {
  email: string
  count: number
}

function TeamContent() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()

    // Get current user
    sb.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user?.email ?? null)
    })

    // Fetch allowlist (team members)
    sb.from('agent_allowlist')
      .select('email,display_name')
      .then(({ data: allowlist }) => {
        setAgents(allowlist ?? [])

        // Count leads per agent
        sb.from('leads')
          .select('agent_id')
          .not('agent_id', 'is', null)
          .then(({ data: leads }) => {
            const counts: Record<string, number> = {}
            for (const lead of leads ?? []) {
              if (lead.agent_id) counts[lead.agent_id] = (counts[lead.agent_id] ?? 0) + 1
            }
            setStats(counts)
            setLoading(false)
          })
      })
  }, [])

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
        <h1 className="text-2xl font-bold text-[#f5f5f5]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Team</h1>
        <p className="text-[11px] text-[#404040] mt-0.5">{agents.length} member{agents.length !== 1 ? 's' : ''}</p>
      </div>

      <section className="space-y-2">
        {agents.map(agent => {
          const isYou = agent.email === currentUser
          return (
            <div key={agent.email} className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#f5f5f5]">
                    {agent.display_name || agent.email.split('@')[0]}
                  </span>
                  {isYou && <span className="text-[9px] font-semibold text-[#C9A87C] bg-[#C9A87C]/10 rounded px-1.5 py-0.5 uppercase tracking-wide">you</span>}
                </div>
                <p className="text-xs text-[#525252]">{agent.email}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-[#f5f5f5]">{stats[agent.email] ?? 0}</span>
                <p className="text-[11px] text-[#525252]">leads</p>
              </div>
            </div>
          )
        })}

        {agents.length === 0 && (
          <p className="text-center py-12 text-sm text-[#525252]">
            Add team members in the agent_allowlist table.
          </p>
        )}
      </section>
    </div>
  )
}

export default function TeamPage() {
  return (
    <MagShell>
      <TeamContent />
    </MagShell>
  )
}
