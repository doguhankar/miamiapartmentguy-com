import Link from 'next/link'

interface LeadCardProps {
  id: number
  name: string | null
  phone: string | null
  stage: string | null
  imessageStage: string | null
  budget: string | null
  beds: string | null
  area: string | null
  lastSeen: string | null
  aiSummary?: string | null
  aiUrgency?: string | null
  aiConfidence?: number | null
  nextAction?: string | null
  isCasa?: boolean
}

const STAGE_COLORS: Record<string, string> = {
  'Active': 'bg-green-50 text-green-700',
  'Hot Lead': 'bg-orange-50 text-orange-700',
  'Qualified': 'bg-blue-50 text-blue-700',
  'Follow Up': 'bg-yellow-50 text-yellow-700',
  'New Lead': 'bg-gray-100 text-gray-600',
  'Closed Won': 'bg-purple-50 text-purple-700',
  'Leased': 'bg-purple-50 text-purple-700',
  'default': 'bg-gray-100 text-gray-500',
}

function stageColor(stage: string | null) {
  if (!stage) return STAGE_COLORS.default
  return STAGE_COLORS[stage] ?? STAGE_COLORS.default
}

function timeAgo(iso: string | null): string | null {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (mins > 0) return `${mins}m`
  return 'now'
}

export function LeadCard({
  id, name, phone, stage, budget, beds, area, lastSeen,
  aiSummary, aiUrgency, aiConfidence, nextAction, isCasa,
}: LeadCardProps) {
  const displayName = name || phone || 'Unknown'
  const ago = timeAgo(lastSeen)
  const hasAI = !!aiSummary

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <Link href={`/mag/clients/${id}`} className="block p-4 space-y-3 active:bg-gray-50 transition-colors">
        {/* Row 1: name + stage + time */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">{displayName}</span>
            {isCasa && <span className="shrink-0 text-[10px] font-medium bg-black text-white rounded px-1 py-0.5">client</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {ago && <span className="text-xs text-gray-400">{ago}</span>}
            {stage && (
              <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${stageColor(stage)}`}>
                {stage}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: criteria */}
        {(budget || beds || area) && (
          <div className="flex flex-wrap gap-2">
            {beds && <span className="text-xs text-gray-500">{beds} bed</span>}
            {budget && <span className="text-xs text-gray-500">{budget}</span>}
            {area && <span className="text-xs text-gray-500">{area}</span>}
          </div>
        )}

        {/* Row 3: AI summary (clearly marked) */}
        {hasAI && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold tracking-wide text-gray-400 uppercase">AI · unvalidated</span>
              {aiConfidence != null && (
                <span className="text-[9px] text-gray-300">{Math.round(aiConfidence * 100)}%</span>
              )}
              {aiUrgency === 'high' && (
                <span className="text-[9px] font-bold text-red-500 ml-auto">⚡ urgent</span>
              )}
            </div>
            <p className="text-xs text-gray-600 leading-snug">{aiSummary}</p>
            {nextAction && (
              <p className="text-xs font-medium text-gray-800">→ {nextAction}</p>
            )}
          </div>
        )}
      </Link>

      {/* Quick actions — outside the Link to avoid nested <a> tags */}
      {phone && (
        <div className="flex gap-2 px-4 pb-4">
          <a
            href={`sms:${phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1c8ef9] text-white text-xs font-medium active:opacity-80"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            iMessage
          </a>
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#34c759] text-white text-xs font-medium active:opacity-80"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.4 2 2 0 0 1 3.59 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call
          </a>
        </div>
      )}
    </div>
  )
}
