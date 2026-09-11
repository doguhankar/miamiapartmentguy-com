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
  deal: { building: string; unit: string; tour: string; leaseStart: string; leaseTerm: string; marketRent: string }
  guestCard: { status: 'idle' | 'sending' | 'sent' | 'error'; sentAt: string | null; error: string | null }
}

type Building = { id: string; name: string; neighborhood: string | null; contact_emails: string[] | null }

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

export default function AgentLeadDossier({ lead, onClose, onUpdate, onMarkContacted }: { lead: DossierLead; onClose: () => void; onUpdate: (updates: Partial<DossierLead>) => void; onMarkContacted: () => void }) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [statuses, setStatuses] = useState<Record<string, 'sent' | 'missing' | 'error'>>({})
  const [sending, setSending] = useState(false)
  useEffect(() => { createClient().from('buildings').select('id,name,neighborhood,contact_emails').order('name').then(({ data }) => setBuildings((data ?? []) as Building[])) }, [])
  const groups = useMemo(() => buildings.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || (b.neighborhood ?? '').toLowerCase().includes(query.toLowerCase())).reduce<Record<string, Building[]>>((all, b) => { const key = b.neighborhood || 'Other'; (all[key] ||= []).push(b); return all }, {}), [buildings, query])
  const sendCards = async () => {
    if (!selected.length) return
    setSending(true)
    const next = { ...statuses }
    try {
      const response = await fetch('/api/guest-card/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: lead.id, buildingIds: selected }) })
      const result = await response.json()
      for (const item of result.results ?? []) next[item.buildingId] = item.sent ? 'sent' : item.skipped ? 'missing' : 'error'
    } catch { selected.forEach(id => { next[id] = 'error' }) }
    setStatuses(next); setSending(false)
  }
  const field = (label: string, icon: string, value: string, placeholder: string, editable?: 'phone' | 'email') => <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ color: '#8d8587', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{icon} {label}</span>{editable ? <input aria-label={label} value={value} placeholder={placeholder} onChange={e => onUpdate({ [editable]: e.target.value } as Partial<DossierLead>)} onBlur={e => onUpdate({ [editable]: e.target.value } as Partial<DossierLead>)} style={{ border: 0, borderRadius: 10, padding: '9px 10px', background: '#faf7f8', color: '#1b1719', fontSize: 13, fontStyle: value ? 'normal' : 'italic', outline: 'none' }} /> : <span style={{ color: value ? '#211c1e' : '#aaa1a4', fontStyle: value ? 'normal' : 'italic', fontSize: 13 }}>{value || placeholder}</span>}</div>
  return <div style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(17,17,17,.28)', backdropFilter: 'blur(7px)', display: 'flex', justifyContent: 'flex-end' }}>
    <aside style={{ width: 'min(620px, 100vw)', height: '100%', overflowY: 'auto', background: '#f6f3f4', padding: 24, color: '#211c1e' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={onClose} aria-label="Close lead" style={{ border: 0, background: 'transparent', fontSize: 22, color: '#8d8587', cursor: 'pointer' }}>×</button></div>
      <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 8px 30px rgba(32,20,24,.07)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}><div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fbe3ec', color: '#e0447b', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{initials(lead)}</div><div><h2 style={{ margin: 0, fontSize: 21 }}>{lead.first} {lead.last}</h2><div style={{ color: '#8d8587', fontSize: 12, marginTop: 4 }}>Contacted {ago(lead.lastContacted)}</div></div></div><div style={{ display: 'flex', gap: 8 }}><button onClick={onMarkContacted} style={{ border: 0, borderRadius: 999, padding: '9px 12px', background: '#e0447b', color: '#fff', cursor: 'pointer', fontSize: 12 }}>✓ Spoke with</button><button style={{ border: '1px solid #ebe3e6', borderRadius: 999, padding: '9px 12px', background: '#fff', color: '#6e6669', cursor: 'pointer', fontSize: 12 }}>Archive</button></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px', marginTop: 28 }}>{field('Phone', '☎', formatPhone(lead.phone), 'Not specified', 'phone')}{field('Email', '✉', lead.email, 'Add email...', 'email')}{field('Budget', '◈', lead.budget === 'You tell me' ? 'Flexible' : lead.budget, 'Not specified')}{field('Move-in', '◷', formatMove(lead.move), 'Not specified')}{field('Area', '⌖', lead.area, 'Not specified')}{field('Beds', '▦', lead.beds, 'Not specified')}</div>
      </section>
      <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 8px 30px rgba(32,20,24,.07)', marginBottom: 16 }}><h3 style={{ margin: 0, fontSize: 17 }}>💌 Guest Card</h3><p style={{ margin: '6px 0 16px', color: '#8d8587', fontSize: 12 }}>Search any building and send an individual guest card.</p><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search all buildings..." style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #eee6e9', borderRadius: 12, padding: 12, outline: 0, fontSize: 13 }} /><div style={{ maxHeight: 230, overflowY: 'auto', marginTop: 12 }}>{Object.entries(groups).map(([neighborhood, items]) => <div key={neighborhood}><div style={{ color: '#9b9195', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', margin: '12px 0 6px' }}>{neighborhood}</div>{items.map(b => <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', fontSize: 13 }}><input type="checkbox" checked={selected.includes(b.id)} onChange={() => setSelected(s => s.includes(b.id) ? s.filter(id => id !== b.id) : [...s, b.id])} />{b.name}</label>)}</div>)}</div><button onClick={sendCards} disabled={sending || !selected.length} style={{ width: '100%', marginTop: 16, padding: 12, border: 0, borderRadius: 12, background: '#e0447b', color: '#fff', fontWeight: 800, cursor: sending ? 'wait' : 'pointer', opacity: sending || !selected.length ? .55 : 1 }}>{sending ? 'Sending…' : `Send guest cards (${selected.length} selected)`}</button><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>{selected.map(id => { const b = buildings.find(x => x.id === id); const status = statuses[id]; return <span key={id} style={{ borderRadius: 999, padding: '6px 9px', fontSize: 11, background: status === 'sent' ? '#e1f5e9' : status === 'missing' ? '#fff1c7' : '#f2f0f1', color: status === 'sent' ? '#1d7a45' : status === 'missing' ? '#8a6500' : '#6e6669' }}>{status === 'sent' ? '✓' : status === 'missing' ? '!' : '•'} {b?.name}{status === 'missing' ? ' — no email on file' : ''}</span> })}</div></section>
      <section style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 8px 30px rgba(32,20,24,.07)' }}><h3 style={{ margin: 0, fontSize: 17 }}>🤝 Deal Info</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>{[['Building', lead.deal.building], ['Unit', lead.deal.unit], ['First Tour', lead.deal.tour], ['Lease Start', lead.deal.leaseStart], ['Term', lead.deal.leaseTerm], ['Market Rent', lead.deal.marketRent]].map(([label, value]) => <div key={label} style={{ borderRadius: 12, padding: '12px 13px', background: value ? '#fbe8ef' : '#f6f4f4', color: value ? '#6d1736' : '#aaa1a4', fontWeight: value ? 700 : 400, fontStyle: value ? 'normal' : 'italic', fontSize: 12 }}>{label}<div style={{ marginTop: 4 }}>{value || 'Not specified'}</div></div>)}</div><button style={{ width: '100%', marginTop: 18, border: 0, borderRadius: 12, padding: 13, background: '#211c1e', color: '#fff', fontWeight: 800 }}>Close Lead &amp; Generate Invoice</button></section>
    </aside>
  </div>
}
