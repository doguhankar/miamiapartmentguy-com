'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
import { VoiceCapture } from '@/components/mag/voice-capture'

interface DbLead {
  id: number
  name: string | null
  phone: string | null
  email: string | null
  stage: string | null
  budget: string | null
  beds: string | null
  area: string | null
  notes: string | null
  quick_note: string | null
  next_action: string | null
  next_action_date: string | null
  move_in_timing: string | null
  agent_id: string | null
  is_casa: boolean | null
  source: string | null
  imessage_stage: string | null
  imessage_last_seen: string | null
  imessage_analysis: Record<string, unknown> | null
  created_at: string | null
}

const STAGES = [
  'New Lead', 'Active', 'Hot Lead', 'Qualified',
  'Follow Up', 'Application', 'Leased', 'Closed Won', 'Archived',
]

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

function ProfileContent({ id }: { id: string }) {
  const router = useRouter()
  const [lead, setLead] = useState<DbLead | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<DbLead>>({})

  const sb = createClient()

  useEffect(() => {
    sb.from('leads')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) { setLead(data); setForm(data) }
        setLoading(false)
      })
  }, [id])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleSave = async () => {
    if (!lead) return
    setSaving(true)
    const { error } = await sb.from('leads').update({
      stage: form.stage,
      notes: form.notes,
      quick_note: form.quick_note,
      next_action: form.next_action,
      next_action_date: form.next_action_date,
      agent_id: form.agent_id,
    }).eq('id', lead.id)
    setSaving(false)
    if (!error) {
      setLead({ ...lead, ...form })
      setEditing(false)
      showToast('Saved')
    } else {
      showToast('Save failed — check connection')
    }
  }

  const handleVoiceNote = async (text: string) => {
    if (!lead) return
    const newNote = lead.quick_note
      ? `${lead.quick_note}\n[${new Date().toLocaleDateString()}] ${text}`
      : `[${new Date().toLocaleDateString()}] ${text}`
    const { error } = await sb.from('leads')
      .update({ quick_note: newNote })
      .eq('id', lead.id)
    if (!error) {
      setLead({ ...lead, quick_note: newNote })
      setForm(f => ({ ...f, quick_note: newNote }))
      showToast('Voice note saved')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#C9A87C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!lead) {
    return <div className="p-8 text-center text-[#525252] text-sm">Lead not found.</div>
  }

  const ai = lead.imessage_analysis as any
  const hasAI = !!ai?.summary

  return (
    <div className="px-4 py-4 space-y-4 pb-8 bg-[#0a0a0a] min-h-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#C9A87C] text-black text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* Back + name */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-[#525252]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate text-[#f5f5f5]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {lead.name || lead.phone || 'Unknown'}
          </h1>
          <p className="text-xs text-[#525252]">
            {lead.is_casa ? 'Confirmed client' : 'Lead'} · last iMessage {timeAgo(lead.imessage_last_seen)}
          </p>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C9A87C] text-black active:opacity-80 disabled:opacity-50"
        >
          {saving ? '…' : editing ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Quick contact */}
      {lead.phone && (
        <div className="flex gap-2">
          <a href={`sms:${lead.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1c8ef9] text-white text-sm font-medium active:opacity-80">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            iMessage
          </a>
          <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#34c759] text-white text-sm font-medium active:opacity-80">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.4 2 2 0 0 1 3.59 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call
          </a>
        </div>
      )}

      {/* Stage + criteria */}
      <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-4 space-y-3">
        <h2 className="text-xs font-semibold text-[#525252] uppercase tracking-wide">Profile</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#525252] uppercase tracking-wide">Stage</label>
            {editing ? (
              <select
                value={form.stage ?? ''}
                onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="mt-1 w-full text-sm border border-[#262626] rounded-lg px-2 py-1.5 bg-[#1a1a1a] text-[#f5f5f5]"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <p className="mt-1 text-sm font-medium text-[#f5f5f5]">{lead.stage || '—'}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] text-[#525252] uppercase tracking-wide">Budget</label>
            <p className="mt-1 text-sm font-medium text-[#f5f5f5]">{lead.budget || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] text-[#525252] uppercase tracking-wide">Beds</label>
            <p className="mt-1 text-sm font-medium text-[#f5f5f5]">{lead.beds || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] text-[#525252] uppercase tracking-wide">Area</label>
            <p className="mt-1 text-sm font-medium text-[#f5f5f5]">{lead.area || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] text-[#525252] uppercase tracking-wide">Move-in</label>
            <p className="mt-1 text-sm font-medium text-[#f5f5f5]">{lead.move_in_timing || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] text-[#525252] uppercase tracking-wide">Source</label>
            <p className="mt-1 text-sm font-medium text-[#f5f5f5] capitalize">{lead.source || '—'}</p>
          </div>
        </div>
        {lead.phone && <p className="text-xs text-[#525252]">{lead.phone}</p>}
        {lead.email && <p className="text-xs text-[#525252]">{lead.email}</p>}
      </div>

      {/* AI Analysis — clearly marked as unvalidated */}
      {hasAI && (
        <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#525252] uppercase tracking-wide">AI Analysis</h2>
            <span className="text-[9px] font-bold text-[#C9A87C] bg-[#C9A87C]/10 px-2 py-0.5 rounded-full uppercase tracking-wide">unvalidated</span>
          </div>
          {ai.urgency && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${ai.urgency === 'high' ? 'text-red-400' : ai.urgency === 'medium' ? 'text-amber-400' : 'text-[#525252]'}`}>
                {ai.urgency === 'high' ? '⚡ High urgency' : ai.urgency === 'medium' ? '◉ Medium urgency' : '○ Low urgency'}
              </span>
              {ai.confidence != null && (
                <span className="text-xs text-[#404040]">{Math.round(ai.confidence * 100)}%</span>
              )}
            </div>
          )}
          {ai.summary && <p className="text-sm text-[#a3a3a3] leading-relaxed">{ai.summary}</p>}
          {ai.next_action && (
            <div className="bg-[#161616] rounded-lg p-3 border border-[#262626]">
              <p className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide">Suggested action</p>
              <p className="text-sm font-medium text-[#C9A87C] mt-1">→ {ai.next_action}</p>
            </div>
          )}
          {ai.signals && Array.isArray(ai.signals) && ai.signals.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide mb-1.5">Evidence</p>
              <ul className="space-y-1">
                {(ai.signals as string[]).map((s, i) => (
                  <li key={i} className="text-xs text-[#525252] flex gap-1.5">
                    <span className="text-[#404040] shrink-0">·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Next action (CRM) */}
      <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-4 space-y-3">
        <h2 className="text-xs font-semibold text-[#525252] uppercase tracking-wide">Next Action</h2>
        {editing ? (
          <div className="space-y-2">
            <input
              value={form.next_action ?? ''}
              onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))}
              placeholder="What to do next…"
              className="w-full text-sm border border-[#262626] rounded-lg px-3 py-2 bg-[#1a1a1a] text-[#f5f5f5] placeholder-[#404040]"
            />
            <input
              type="date"
              value={form.next_action_date?.split('T')[0] ?? ''}
              onChange={e => setForm(f => ({ ...f, next_action_date: e.target.value }))}
              className="w-full text-sm border border-[#262626] rounded-lg px-3 py-2 bg-[#1a1a1a] text-[#f5f5f5]"
            />
          </div>
        ) : (
          <div>
            {lead.next_action
              ? <p className="text-sm text-[#f5f5f5]">{lead.next_action}</p>
              : <p className="text-sm text-[#404040]">No next action set.</p>}
            {lead.next_action_date && (
              <p className="text-xs text-[#525252] mt-1">
                Due {new Date(lead.next_action_date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-4 space-y-3">
        <h2 className="text-xs font-semibold text-[#525252] uppercase tracking-wide">Notes</h2>
        {editing ? (
          <textarea
            value={form.notes ?? ''}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={4}
            placeholder="Notes…"
            className="w-full text-sm border border-[#262626] rounded-lg px-3 py-2 resize-none bg-[#1a1a1a] text-[#f5f5f5] placeholder-[#404040]"
          />
        ) : (
          <p className="text-sm text-[#a3a3a3] whitespace-pre-wrap leading-relaxed">
            {lead.notes || <span className="text-[#404040]">No notes.</span>}
          </p>
        )}
      </div>

      {/* Quick note + voice */}
      <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#525252] uppercase tracking-wide">Quick Notes</h2>
          <VoiceCapture onCapture={handleVoiceNote} />
        </div>
        {editing ? (
          <textarea
            value={form.quick_note ?? ''}
            onChange={e => setForm(f => ({ ...f, quick_note: e.target.value }))}
            rows={3}
            placeholder="Quick note…"
            className="w-full text-sm border border-[#262626] rounded-lg px-3 py-2 resize-none bg-[#1a1a1a] text-[#f5f5f5] placeholder-[#404040]"
          />
        ) : (
          <p className="text-sm text-[#a3a3a3] whitespace-pre-wrap leading-relaxed">
            {lead.quick_note || <span className="text-[#404040]">No quick notes.</span>}
          </p>
        )}
      </div>

      {/* Agent assignment */}
      <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-4 space-y-3">
        <h2 className="text-xs font-semibold text-[#525252] uppercase tracking-wide">Assignment</h2>
        {editing ? (
          <input
            value={form.agent_id ?? ''}
            onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
            placeholder="agent@email.com"
            type="email"
            className="w-full text-sm border border-[#262626] rounded-lg px-3 py-2 bg-[#1a1a1a] text-[#f5f5f5] placeholder-[#404040]"
          />
        ) : (
          <p className="text-sm text-[#f5f5f5]">{lead.agent_id || <span className="text-[#404040]">Unassigned</span>}</p>
        )}
      </div>

      {/* Meta */}
      <p className="text-xs text-[#404040] text-center">
        Added {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
      </p>
    </div>
  )
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>()
  return (
    <MagShell>
      <ProfileContent id={id} />
    </MagShell>
  )
}
