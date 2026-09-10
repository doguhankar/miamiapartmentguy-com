'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildings } from '@/lib/buildings'

interface LeadData {
  moveDate: string
  budget: string
  neighborhoods: string[]
  buildingId: string
  buildingName: string
  name: string
  phone: string
}

interface MoveWithDonProps {
  isOpen: boolean
  onClose: () => void
  agentId?: string
  source?: string
  slackChannel?: string
  skipAgentSelection?: boolean
  agentDisplayName?: string
}

const emptyLead = (): LeadData => ({
  moveDate: '', budget: '', neighborhoods: [], buildingId: '', buildingName: '', name: '', phone: '',
})

const neighborhoods = ['Brickell', 'Downtown', 'Edgewater', 'Wynwood / Midtown', 'Miami Beach', 'Open to anything']
const budgets = ['Under $2,000', '$2,000–$2,500', '$2,500–$3,500', '$3,500+']

export function MoveWithDon({
  isOpen,
  onClose,
  agentId = 'doguhankar1@gmail.com',
  source = 'Move with Don',
  slackChannel,
  agentDisplayName = 'Don',
}: MoveWithDonProps) {
  const [data, setData] = useState<LeadData>(emptyLead())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setData(emptyLead())
      setDone(false)
      setError('')
      setSubmitting(false)
    }
  }, [isOpen])

  const selectedNeighborhood = data.neighborhoods[0]
  const filteredBuildings = useMemo(() => {
    if (!selectedNeighborhood || selectedNeighborhood === 'Open to anything') return buildings
    return buildings.filter((building) => building.neighborhood === selectedNeighborhood)
  }, [selectedNeighborhood])
  const selectedBuilding = buildings.find((building) => building.id === data.buildingId)
  const canSubmit = Boolean(data.moveDate && data.budget && selectedNeighborhood && data.name.trim() && data.phone.trim().length >= 7)

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          moveDate: data.moveDate,
          apartmentSize: selectedBuilding?.units?.join(', ') || '',
          agentId,
          source,
          slackChannel,
        }),
      })
      if (!response.ok) throw new Error('Unable to submit your request')
      setDone(true)
    } catch (submissionError) {
      console.error('[v0] Submit error:', submissionError)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: '#16253A', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 11,
    padding: '13px 14px', fontSize: 14, color: '#E6ECF5', outline: 'none', appearance: 'none',
  }
  const labelStyle: React.CSSProperties = { display: 'block', color: '#E6ECF5', fontSize: 13, fontWeight: 700, marginBottom: 8 }
  const pillStyle = (selected: boolean): React.CSSProperties => ({
    border: `1px solid ${selected ? '#FF4D8D' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '10px 13px',
    background: selected ? 'rgba(255,77,141,0.14)' : '#16253A', color: selected ? '#FF77A8' : '#B4C0D1',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  })

  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,16,0.82)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="move-with-don-title" style={{ background: '#111C2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 470, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div><div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#19C6C0', textTransform: 'uppercase', fontWeight: 700 }}>Move with {agentDisplayName}</div><h2 id="move-with-don-title" style={{ fontSize: 18, color: '#E6ECF5', margin: '4px 0 0' }}>{done ? 'Request received' : 'Find your building'}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 0, background: 'rgba(255,255,255,0.07)', color: '#B4C0D1', width: 32, height: 32, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ padding: '22px 20px 24px' }}>
          {done ? <div style={{ textAlign: 'center', padding: '32px 0 18px' }}><div style={{ color: '#19C6C0', fontSize: 44, marginBottom: 12 }}>✓</div><h3 style={{ color: '#E6ECF5', fontSize: 24, margin: 0 }}>You&apos;re in.</h3><p style={{ color: '#8FA0B8', fontSize: 14, lineHeight: 1.6 }}>Don&apos;s pulling live pricing for you now.<br />Expect a text <strong style={{ color: '#FFC24B' }}>within the hour</strong> during the day.</p></div> : <>
            <p style={{ color: '#8FA0B8', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>Tell me what you&apos;re looking for and I&apos;ll send you real-time pricing and concessions.</p>
            <div style={{ display: 'grid', gap: 18 }}>
              <div><label style={labelStyle}>Where do you want to live?</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{neighborhoods.map((neighborhood) => <button type="button" key={neighborhood} onClick={() => setData((prev) => ({ ...prev, neighborhoods: [neighborhood], buildingId: '', buildingName: '' }))} style={pillStyle(selectedNeighborhood === neighborhood)}>{neighborhood}</button>)}</div></div>
              <div><label style={labelStyle} htmlFor="building">Any building in mind? <span style={{ color: '#6F7F96', fontWeight: 400 }}>(optional)</span></label><select id="building" value={data.buildingId} onChange={(event) => { const building = buildings.find((item) => item.id === event.target.value); setData((prev) => ({ ...prev, buildingId: event.target.value, buildingName: building?.name || '' })) }} style={fieldStyle}><option value="">Select a building</option>{filteredBuildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}</select>{selectedBuilding && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, color: '#8FA0B8', fontSize: 12 }}><span>{selectedBuilding.tagline}</span><a href={`/buildings/${selectedBuilding.id}`} target="_blank" rel="noreferrer" style={{ color: '#19C6C0', whiteSpace: 'nowrap' }}>View building</a></div>}</div>
              <div><label style={labelStyle}>When are you moving?</label><input type="date" min={new Date().toISOString().split('T')[0]} value={data.moveDate} onChange={(event) => setData((prev) => ({ ...prev, moveDate: event.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Monthly budget</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{budgets.map((budget) => <button type="button" key={budget} onClick={() => setData((prev) => ({ ...prev, budget }))} style={pillStyle(data.budget === budget)}>{budget}</button>)}</div></div>
              <div><label style={labelStyle} htmlFor="lead-name">Your name</label><input id="lead-name" type="text" autoComplete="given-name" placeholder="First name" value={data.name} onChange={(event) => setData((prev) => ({ ...prev, name: event.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle} htmlFor="lead-phone">Your phone</label><input id="lead-phone" type="tel" autoComplete="tel" placeholder="(305) 555-0123" value={data.phone} onChange={(event) => setData((prev) => ({ ...prev, phone: event.target.value }))} style={fieldStyle} /></div>
            </div>
            <p style={{ color: '#6F7F96', fontSize: 11, lineHeight: 1.5, margin: '18px 0 0' }}>{"By submitting, you give permission for the team at Miami Apartment Guy to contact you. We're cool people, happy to help."}</p>
            {error && <p role="alert" style={{ color: '#FF8CA8', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
            <button type="button" onClick={submit} disabled={!canSubmit || submitting} style={{ width: '100%', marginTop: 18, border: 0, borderRadius: 11, padding: '14px 16px', background: canSubmit ? '#FF4D8D' : '#334159', color: canSubmit ? '#fff' : '#8FA0B8', fontSize: 14, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>{submitting ? 'Sending...' : 'Send me real pricing'}</button>
          </>}
        </div>
      </div>
    </div>
  )
}
