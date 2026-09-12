"use client"

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type DossierLead = {
  id: string
  first: string
  last: string
  phone: string
  email: string
  budget: string
  beds: string
  move: string
  area: string
  lastContacted: Date
  deal: { building: string; unit: string; tour: string; leaseStart: string; leaseTerm: string; marketRent: string; invoiceEst: string }
  guestCard: { status: 'idle' | 'sending' | 'sent' | 'error'; sentAt: string | null; error: string | null }
}

type Building = { id: string; name: string; neighborhood: string | null; contact_emails: string[] | null }

const ARCHIVE_REASONS = [
  'Ghosted / stopped responding',
  'Went with another agent/competitor',
  'Budget mismatch',
  'Bad credit / income',
  'Not serious / tire-kicker',
  'Found a place already',
  'Duplicate/test lead',
]

function initials(lead: DossierLead) { return `${lead.first[0] ?? ''}${lead.last[0] ?? ''}`.toUpperCase() }
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^1/, '').slice(0, 10)
  if (digits.length < 4) return value
  if (digits.length < 7) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}
function ordinal(day: number) { const mod = day % 100; return `${day}${mod >= 11 && mod <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] ?? 'th'}` }
function formatMove(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value || 'Not specified' : `${date.toLocaleString('en-US', { month: 'short' })} ${ordinal(date.getDate())}, ${date.getFullYear()}` }
function ago(date: Date) { const days = Math.floor((Date.now() - date.getTime()) / 86400000); return days <= 0 ? 'today' : `${days}d ago` }

export default function AgentLeadDossier({
  lead,
  onClose,
  onUpdate,
  onMarkContacted,
  spokeWithLoading,
  spokeWithError,
  archiveOpen,
  onOpenArchive,
  archiveReason,
  onArchiveReasonChange,
  archiveNotes,
  onArchiveNotesChange,
  onArchiveCancel,
  onArchiveConfirm,
  onGenerateInvoice,
}: {
  lead: DossierLead
  onClose: () => void
  onUpdate: (updates: Partial<DossierLead>) => void
  onMarkContacted: () => void
  spokeWithLoading?: boolean
  spokeWithError?: string
  archiveOpen: boolean
  onOpenArchive: () => void
  archiveReason: string
  onArchiveReasonChange: (value: string) => void
  archiveNotes: string
  onArchiveNotesChange: (value: string) => void
  onArchiveCancel: () => void
  onArchiveConfirm: () => void
  onGenerateInvoice: () => void
}) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [statuses, setStatuses] = useState<Record<string, 'sent' | 'missing' | 'error'>>({})
  const [sentAtByBuilding, setSentAtByBuilding] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  useEffect(() => {
    let cancelled = false
    createClient().from('buildings').select('id,name,neighborhood,contact_emails').order('name').then(({ data }) => {
      if (!cancelled) setBuildings((data ?? []) as Building[])
    })
    fetch(`/api/guest-card/send?leadId=${lead.id}`).then(response => response.json()).then(payload => {
      if (cancelled) return
      const sentStatuses: Record<string, 'sent' | 'missing' | 'error'> = {}
      const timestamps: Record<string, string> = {}
      for (const send of payload.sends ?? []) {
        if (send.status === 'sent') {
          sentStatuses[send.building_id] = 'sent'
          if (send.sent_at) timestamps[send.building_id] = send.sent_at
        }
      }
      setStatuses(current => ({ ...current, ...sentStatuses }))
      setSentAtByBuilding(timestamps)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [lead.id])

  const formatSentDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const groups = useMemo(() => buildings.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || (b.neighborhood ?? '').toLowerCase().includes(query.toLowerCase())).reduce<Record<string, Building[]>>((all, b) => { const key = b.neighborhood || 'Other'; (all[key] ||= []).push(b); return all }, {}), [buildings, query])
  const sendCards = async () => {
    if (!selected.length) return
    setSending(true)
    const next = { ...statuses }
    try {
      const response = await fetch('/api/guest-card/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: lead.id, buildingIds: selected }) })
      const result = await response.json()
      for (const item of result.results ?? []) {
        next[item.buildingId] = item.sent ? 'sent' : item.skipped ? 'missing' : 'error'
        if (item.sent && item.sentAt) setSentAtByBuilding(current => ({ ...current, [item.buildingId]: item.sentAt }))
      }
    } catch { selected.forEach(id => { next[id] = 'error' }) }
    setStatuses(next)
    setSelected(current => current.filter(id => next[id] !== 'sent'))
    setSending(false)
  }

  const field = (label: string, icon: string, value: string, placeholder: string, editable?: 'phone' | 'email') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ color: '#717171', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden>{icon}</span> {label}
      </span>
      {editable ? (
        <input
          aria-label={label}
          value={value}
          placeholder={placeholder}
          onChange={e => onUpdate({ [editable]: e.target.value } as Partial<DossierLead>)}
          onBlur={e => onUpdate({ [editable]: e.target.value } as Partial<DossierLead>)}
          style={{ border: 0, borderBottom: '1px dashed #DDDDDD', background: 'transparent', padding: '0 0 3px', color: '#222222', fontSize: 14.5, fontWeight: 500, outline: 'none' }}
        />
      ) : (
        <span style={{ color: value ? '#222222' : '#B0B0B0', fontStyle: value ? 'normal' : 'italic', fontWeight: value ? 500 : 400, fontSize: 14.5 }}>{value || placeholder}</span>
      )}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(247,247,245,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '48px 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
        <button
          onClick={onClose}
          aria-label="Close lead"
          style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: '#F7F7F5', border: 0, color: '#717171', fontSize: 16, cursor: 'pointer', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ×
        </button>

        {/* HEADER + DETAILS */}
        <section style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingRight: 28 }}>
              <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: '50%', background: '#FFF0F4', color: '#E0447B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                {initials(lead)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111111', letterSpacing: '-0.01em' }}>{lead.first} {lead.last}</h2>
                <div style={{ color: '#717171', fontSize: 13, marginTop: 4 }}>Contacted {ago(lead.lastContacted)}</div>
                {spokeWithError && <div style={{ color: '#D9534F', fontSize: 12, marginTop: 4 }}>{spokeWithError}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={onMarkContacted}
                disabled={spokeWithLoading}
                style={{ border: 0, borderRadius: 999, padding: '8px 14px', background: '#E7F7F1', color: '#0F6E56', cursor: spokeWithLoading ? 'wait' : 'pointer', fontSize: 12.5, fontWeight: 600, opacity: spokeWithLoading ? 0.6 : 1 }}
              >
                → Spoke with
              </button>
              <button
                onClick={onOpenArchive}
                style={{ border: 0, borderRadius: 999, padding: '8px 14px', background: '#FDECEC', color: '#D9534F', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}
              >
                Archive
              </button>
            </div>
          </div>

          {archiveOpen && (
            <div style={{ background: '#FBFBFA', borderRadius: 14, padding: 16, marginTop: 20 }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#222222' }}>Why are you archiving this lead?</p>
              <select
                value={archiveReason}
                onChange={e => onArchiveReasonChange(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', marginBottom: 10, background: '#fff', border: '1px solid #EBEBEB', borderRadius: 10, fontSize: 12.5, color: '#222222', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Select a reason...</option>
                {ARCHIVE_REASONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
              </select>
              <textarea
                value={archiveNotes}
                onChange={e => onArchiveNotesChange(e.target.value)}
                placeholder="Any context for later..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', marginBottom: 10, background: '#fff', border: '1px solid #EBEBEB', borderRadius: 10, fontSize: 12.5, color: '#222222', outline: 'none', resize: 'none', height: 50 }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={onArchiveCancel} style={{ padding: '7px 14px', fontSize: 12.5, color: '#717171', background: 'transparent', border: '1px solid #EBEBEB', borderRadius: 999, cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={onArchiveConfirm}
                  disabled={!archiveReason}
                  style={{ padding: '7px 14px', fontSize: 12.5, fontWeight: 700, color: '#fff', background: archiveReason ? '#D9534F' : '#DDDDDD', border: 0, borderRadius: 999, cursor: archiveReason ? 'pointer' : 'not-allowed' }}
                >
                  Archive lead
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px', marginTop: 28 }}>
            {field('Phone', '📞', formatPhone(lead.phone), 'Not specified', 'phone')}
            {field('Email', '📧', lead.email, 'Add email...', 'email')}
            {field('Budget', '💰', lead.budget === 'You tell me' ? 'Flexible' : lead.budget, 'Not specified')}
            {field('Move-in', '🗓️', formatMove(lead.move), 'Not specified')}
            {field('Area', '📍', lead.area, 'Not specified')}
            {field('Beds', '🛏️', lead.beds, 'Not specified')}
          </div>
        </section>

        {/* GUEST CARD */}
        <section style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#222222', display: 'flex', alignItems: 'center', gap: 8 }}>💌 Guest Card</h3>
          <p style={{ margin: '6px 0 16px', color: '#717171', fontSize: 12 }}>Search any building and send an individual guest card.</p>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search buildings by name or neighborhood..."
            style={{ width: '100%', boxSizing: 'border-box', background: '#F7F7F5', border: '1px solid #EBEBEB', borderRadius: 12, padding: '12px 16px', outline: 'none', fontSize: 14, color: '#222222' }}
          />
          <div style={{ background: '#FBFBFA', borderRadius: 14, padding: '4px 16px', marginTop: 12 }}>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {Object.entries(groups).map(([neighborhood, items]) => (
                <div key={neighborhood}>
                  <div style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 4px 4px' }}>{neighborhood}</div>
                  {items.map(b => {
                    const isSent = statuses[b.id] === 'sent'
                    const isSelected = selected.includes(b.id)
                    return (
                      <label
                        key={b.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '11px 4px',
                          borderBottom: '1px solid #F5F5F5',
                          fontSize: 14,
                          color: isSent ? '#A6A6A6' : '#222222',
                          cursor: isSent ? 'not-allowed' : 'pointer',
                          opacity: isSent ? 0.72 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isSent}
                          onChange={() => setSelected(s => s.includes(b.id) ? s.filter(id => id !== b.id) : [...s, b.id])}
                          style={{ width: 17, height: 17, accentColor: '#E0447B', cursor: isSent ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ flex: 1 }}>{b.name}</span>
                        {isSent && sentAtByBuilding[b.id] && (
                          <span style={{ color: '#8D8D8D', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            ✓ Sent {formatSentDate(sentAtByBuilding[b.id])}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={sendCards}
            disabled={sending || !selected.length}
            style={{ width: '100%', marginTop: 16, padding: 15, border: 0, borderRadius: 14, background: '#E0447B', color: '#fff', fontWeight: 700, fontSize: 14.5, cursor: sending ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(224,68,123,0.25)', opacity: sending || !selected.length ? 0.55 : 1 }}
          >
            {sending ? 'Sending…' : `Send guest cards (${selected.length} selected)`}
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
            {selected.map(id => {
              const b = buildings.find(x => x.id === id)
              const status = statuses[id]
              if (!status) return null
              return (
                <span
                  key={id}
                  style={{
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    background: status === 'sent' ? '#E7F7F1' : status === 'missing' ? '#FDF3E3' : '#FDECEC',
                    color: status === 'sent' ? '#0F6E56' : status === 'missing' ? '#B8790A' : '#D9534F',
                  }}
                >
                  {status === 'sent' ? `✓ ${b?.name}` : status === 'missing' ? `! ${b?.name} — no email on file` : `✕ ${b?.name} — failed`}
                </span>
              )
            })}
          </div>
        </section>

        {/* DEAL INFO */}
        <section style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#222222', display: 'flex', alignItems: 'center', gap: 8 }}>🤝 Deal Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            {[
              ['Building', lead.deal.building],
              ['Unit', lead.deal.unit],
              ['First Tour', lead.deal.tour],
              ['Lease Start', lead.deal.leaseStart],
              ['Term', lead.deal.leaseTerm],
              ['Market Rent', lead.deal.marketRent],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  borderRadius: 12,
                  padding: '12px 13px',
                  background: value ? '#FFF0F4' : '#F7F7F5',
                  color: value ? '#C93868' : '#B0B0B0',
                  fontWeight: value ? 700 : 400,
                  fontStyle: value ? 'normal' : 'italic',
                  fontSize: 12,
                }}
              >
                {label}
                <div style={{ marginTop: 4 }}>{value || 'Not specified'}</div>
              </div>
            ))}
          </div>
          <button
            onClick={onGenerateInvoice}
            style={{ width: '100%', marginTop: 18, border: 0, borderRadius: 12, padding: 13, background: '#211c1e', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}
          >
            Close Lead &amp; Generate Invoice
          </button>
        </section>
      </div>
    </div>
  )
}
