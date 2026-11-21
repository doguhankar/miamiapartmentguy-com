'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MagShell } from '@/components/mag/mag-shell'
import { VoiceCapture } from '@/components/mag/voice-capture'
import { useTheme } from '@/components/mag/theme-provider'

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
  'New Lead',
  'Tour Scheduled',
  'Follow Up',
  'Options Sent',
  'Discovery Call Made',
  'Applied / Signed Lease',
  'Closed Won',
  'Archive',
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
  const { theme } = useTheme()
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

  const handleSpokeWith = async () => {
    if (!lead) return
    const now = new Date().toISOString()
    const { error } = await sb.from('leads').update({ spoke_with: now }).eq('id', lead.id)
    if (!error) {
      setLead({ ...lead, spoke_with: now })
      showToast('Logged — contact updated')
    }
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
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--mag-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!lead) {
    return <div className="p-8 text-center text-sm" style={{ color: 'var(--mag-text-dim)' }}>Lead not found.</div>
  }

  const ai = lead.imessage_analysis as any
  const hasAI = !!ai?.summary

  const inputStyle = {
    backgroundColor: 'var(--mag-surface-3)',
    border: '1px solid var(--mag-border-muted)',
    color: 'var(--mag-text-high)',
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-8 min-h-full" style={{ backgroundColor: 'var(--mag-bg)' }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 text-xs font-semibold px-4 py-2 rounded-full shadow-lg"
          style={{ backgroundColor: 'var(--mag-accent)', color: 'var(--mag-accent-fg)' }}
        >
          {toast}
        </div>
      )}

      {/* Back + name */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1" style={{ color: 'var(--mag-text-dim)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className="text-lg font-bold truncate"
            style={{ color: 'var(--mag-text-high)', fontFamily: 'var(--font-space-grotesk)' }}
          >
            {lead.name || lead.phone || 'Unknown'}
          </h1>
          <p className="text-xs" style={{ color: 'var(--mag-text-dim)' }}>
            {lead.is_casa ? 'Confirmed client' : 'Lead'} · last iMessage {timeAgo(lead.imessage_last_seen)}
          </p>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg active:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: 'var(--mag-accent)', color: 'var(--mag-accent-fg)' }}
        >
          {saving ? '…' : editing ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Quick contact */}
      <div className="grid grid-cols-3 gap-2">
        {lead.phone && (
          <a
            href={`sms:${lead.phone}`}
            className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium active:opacity-80"
            style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)', color: '#1c8ef9' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Text
          </a>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium active:opacity-80"
            style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)', color: '#34c759' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.4 2 2 0 0 1 3.59 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call
          </a>
        )}
        <button
          onClick={handleSpokeWith}
          className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium active:opacity-80"
          style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)', color: 'var(--mag-accent)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Spoke With
        </button>
      </div>

      {/* Stage + criteria */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Profile</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Stage</label>
            {editing ? (
              <select
                value={form.stage ?? ''}
                onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="mt-1 w-full text-sm rounded-lg px-2 py-1.5"
                style={inputStyle}
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <p className="mt-1 text-sm font-medium" style={{ color: 'var(--mag-text-high)' }}>{lead.stage || '—'}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Budget</label>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--mag-text-high)' }}>{lead.budget || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Beds</label>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--mag-text-high)' }}>{lead.beds || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Area</label>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--mag-text-high)' }}>{lead.area || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Move-in</label>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--mag-text-high)' }}>{lead.move_in_timing || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Source</label>
            <p className="mt-1 text-sm font-medium capitalize" style={{ color: 'var(--mag-text-high)' }}>{lead.source || '—'}</p>
          </div>
        </div>
        {lead.phone && <p className="text-xs" style={{ color: 'var(--mag-text-dim)' }}>{lead.phone}</p>}
        {lead.email && <p className="text-xs" style={{ color: 'var(--mag-text-dim)' }}>{lead.email}</p>}
      </div>

      {/* AI Analysis */}
      {hasAI && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>AI Analysis</h2>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ color: 'var(--mag-accent)', backgroundColor: 'var(--mag-accent-bg)' }}
            >
              unvalidated
            </span>
          </div>
          {ai.urgency && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${ai.urgency === 'high' ? 'text-red-400' : ai.urgency === 'medium' ? 'text-amber-400' : ''}`}
                    style={ai.urgency === 'high' || ai.urgency === 'medium' ? {} : { color: 'var(--mag-text-dim)' }}>
                {ai.urgency === 'high' ? '⚡ High urgency' : ai.urgency === 'medium' ? '◉ Medium urgency' : '○ Low urgency'}
              </span>
              {ai.confidence != null && (
                <span className="text-xs" style={{ color: 'var(--mag-text-faint)' }}>{Math.round(ai.confidence * 100)}%</span>
              )}
            </div>
          )}
          {ai.summary && <p className="text-sm leading-relaxed" style={{ color: 'var(--mag-text-low)' }}>{ai.summary}</p>}
          {ai.next_action && (
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'var(--mag-surface-2)', border: '1px solid var(--mag-border-muted)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Suggested action</p>
              <p className="text-sm font-medium mt-1" style={{ color: 'var(--mag-accent)' }}>→ {ai.next_action}</p>
            </div>
          )}
          {ai.signals && Array.isArray(ai.signals) && ai.signals.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--mag-text-dim)' }}>Evidence</p>
              <ul className="space-y-1">
                {(ai.signals as string[]).map((s, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--mag-text-dim)' }}>
                    <span className="shrink-0" style={{ color: 'var(--mag-text-faint)' }}>·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Next follow-up */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Next Follow-up</h2>
        <input
          value={form.next_action ?? ''}
          onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))}
          placeholder="What to do next…"
          className="w-full text-sm rounded-lg px-3 py-2"
          style={inputStyle}
        />
        <input
          type="date"
          value={form.next_action_date?.split('T')[0] ?? ''}
          onChange={e => setForm(f => ({ ...f, next_action_date: e.target.value }))}
          className="w-full text-sm rounded-lg px-3 py-2"
          style={{ ...inputStyle, colorScheme: theme === 'dark' ? 'dark' : 'light' }}
        />
        {/* Quick schedule */}
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Tomorrow', 1],
            ['1 week', 7],
            ['1 month', 30],
          ].map(([label, days]) => {
            const d = new Date()
            d.setDate(d.getDate() + Number(days))
            const iso = d.toISOString().split('T')[0]
            return (
              <button
                key={label}
                onClick={() => setForm(f => ({ ...f, next_action_date: iso }))}
                className="text-xs py-1.5 rounded-lg transition-colors"
                style={inputStyle}
              >
                {label}
              </button>
            )
          })}
        </div>
        {form.next_action !== lead.next_action || form.next_action_date !== lead.next_action_date ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full text-xs font-semibold py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'var(--mag-accent)', color: 'var(--mag-accent-fg)' }}
          >
            {saving ? 'Saving…' : 'Save follow-up'}
          </button>
        ) : null}
      </div>

      {/* Notes */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Notes</h2>
        {editing ? (
          <textarea
            value={form.notes ?? ''}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={4}
            placeholder="Notes…"
            className="w-full text-sm rounded-lg px-3 py-2 resize-none"
            style={inputStyle}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--mag-text-low)' }}>
            {lead.notes || <span style={{ color: 'var(--mag-text-faint)' }}>No notes.</span>}
          </p>
        )}
      </div>

      {/* Quick note + voice */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Quick Notes</h2>
          <VoiceCapture onCapture={handleVoiceNote} />
        </div>
        {editing ? (
          <textarea
            value={form.quick_note ?? ''}
            onChange={e => setForm(f => ({ ...f, quick_note: e.target.value }))}
            rows={3}
            placeholder="Quick note…"
            className="w-full text-sm rounded-lg px-3 py-2 resize-none"
            style={inputStyle}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--mag-text-low)' }}>
            {lead.quick_note || <span style={{ color: 'var(--mag-text-faint)' }}>No quick notes.</span>}
          </p>
        )}
      </div>

      {/* Agent assignment */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--mag-surface-1)', border: '1px solid var(--mag-border)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--mag-text-dim)' }}>Assignment</h2>
        {editing ? (
          <input
            value={form.agent_id ?? ''}
            onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
            placeholder="agent@email.com"
            type="email"
            className="w-full text-sm rounded-lg px-3 py-2"
            style={inputStyle}
          />
        ) : (
          <p className="text-sm" style={{ color: lead.agent_id ? 'var(--mag-text-high)' : 'var(--mag-text-faint)' }}>
            {lead.agent_id || 'Unassigned'}
          </p>
        )}
      </div>

      {/* Meta */}
      <p className="text-xs text-center" style={{ color: 'var(--mag-text-faint)' }}>
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
