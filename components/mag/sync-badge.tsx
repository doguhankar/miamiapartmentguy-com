'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

export function SyncBadge() {
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.from('leads')
      .select('imessage_last_seen')
      .not('imessage_last_seen', 'is', null)
      .order('imessage_last_seen', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.imessage_last_seen) setLastSeen(data.imessage_last_seen)
      })
  }, [])

  if (!lastSeen) return <span className="text-xs text-gray-300">not synced</span>

  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
      {timeAgo(lastSeen)}
    </span>
  )
}
