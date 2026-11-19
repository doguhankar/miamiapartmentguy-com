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
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Team</h1>
        <p className="text-xs text-gray-400 mt-0.5">{agents.length} member{agents.length !== 1 ? 's' : ''}</p>
      </div>

      <section className="space-y-2">
        {agents.map(agent => {
          const isYou = agent.email === currentUser
          return (
            <div key={agent.email} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {agent.display_name || agent.email.split('@')[0]}
                  </span>
                  {isYou && <span className="text-[10px] font-medium bg-black text-white rounded px-1.5 py-0.5">you</span>}
                </div>
                <p className="text-xs text-gray-400">{agent.email}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">{stats[agent.email] ?? 0}</span>
                <p className="text-xs text-gray-400">leads</p>
              </div>
            </div>
          )
        })}

        {agents.length === 0 && (
          <p className="text-center py-12 text-sm text-gray-400">
            Add team members in the agent_allowlist table.
          </p>
        )}
      </section>

      {/* Unassigned leads */}
      <section className="bg-yellow-50 rounded-xl border border-yellow-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-800">Unassigned leads</p>
            <p className="text-xs text-yellow-600 mt-0.5">Leads without an agent_id</p>
          </div>
          <span className="text-lg font-bold text-yellow-700">
            {/* Calculated from stats vs total */}
            —
          </span>
        </div>
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
