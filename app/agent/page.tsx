'use client'

import { useState, useCallback } from 'react'

interface Lead {
  id: string
  first: string
  last: string
  phone: string
  email: string
  budget: string
  beds: string
  move: string
  activity: string
  column: string
  lastContacted: Date
  area: string
  notes: string
  buildings: string[]
  favorited: string[]
  deal: {
    building: string
    unit: string
    tour: string
    leaseStart: string
    leaseTerm: string
    marketRent: string
    invoiceEst: string
  }
}

const COLUMNS = [
  { key: 'newlead', label: 'New Lead', color: '#5B6780' },
  { key: 'discoverycall', label: 'Discovery Call Made', color: '#19C6C0' },
  { key: 'optionssent', label: 'Options Sent', color: '#19C6C0' },
  { key: 'followup', label: 'Follow Up', color: '#FFC24B' },
  { key: 'tourscheduled', label: 'Tour Scheduled', color: '#FF4D8D' },
  { key: 'applied', label: 'Applied / Signed Lease', color: '#FF4D8D' },
  { key: 'archive', label: 'Archive', color: '#5B6780' },
]

const BUILDINGS = [
  'Icon Bay', 'Society Wynwood', 'One Paraiso', 'Elysee Miami',
  'Yacht Club at Brickell', 'Nine at Mary Brickell', 'SLS Lux Brickell',
]

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function spokeText(days: number) {
  return days <= 0 ? 'today' : `${days}d ago`
}

function spokeColor(days: number) {
  if (days < 2) return 'green'
  if (days < 3) return 'yellow'
  return 'red'
}

const INITIAL_LEADS: Lead[] = [
  { id: '1', first: 'Diego', last: 'Alvarez', phone: '(305) 660-2214', email: 'd.alvarez@gmail.com', budget: '$2,100/mo', beds: 'Studio', move: 'Aug 1', activity: 'Texted 3h ago', column: 'newlead', lastContacted: daysAgo(0), area: 'Edgewater', notes: 'Wants gym + pet friendly', buildings: ['Icon Bay', 'Society Wynwood'], favorited: ['Icon Bay'], deal: { building: '', unit: '', tour: '', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' } },
  { id: '2', first: 'Tram', last: 'Nguyen', phone: '(786) 511-9902', email: 'tram.nguyen@outlook.com', budget: '$1,850/mo', beds: '1BR', move: 'Aug 15', activity: 'Inquired via IG · 1d ago', column: 'newlead', lastContacted: daysAgo(1), area: 'Wynwood', notes: 'Remote worker, needs office nook', buildings: ['Society Wynwood'], favorited: [], deal: { building: '', unit: '', tour: '', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' } },
  { id: '3', first: 'Rachel', last: 'Marsh', phone: '(954) 220-7761', email: 'rachel.marsh@yahoo.com', budget: '$3,200/mo', beds: '1BR', move: 'Sep 1', activity: 'New lead · 6h ago', column: 'newlead', lastContacted: daysAgo(0), area: 'Brickell', notes: 'Relocating from NYC, flexible', buildings: [], favorited: [], deal: { building: '', unit: '', tour: '', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' } },
  { id: '4', first: 'Kayla', last: 'Bloom', phone: '(305) 903-4471', email: 'kbloom@gmail.com', budget: '$2,600/mo', beds: '1BR', move: 'Aug 5', activity: 'Call booked · 2d ago', column: 'discoverycall', lastContacted: daysAgo(2), area: 'Edgewater', notes: 'Wants water view', buildings: ['One Paraiso'], favorited: ['One Paraiso'], deal: { building: '', unit: '', tour: '', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' } },
  { id: '5', first: 'Ana', last: 'Reyes', phone: '(305) 771-2093', email: 'ana.reyes92@gmail.com', budget: '$2,400/mo', beds: '1BR', move: 'Aug 10', activity: '3 options sent · 1d ago', column: 'optionssent', lastContacted: daysAgo(1), area: 'Edgewater', notes: 'Needs in-unit W/D', buildings: ['Icon Bay', 'Elysee Miami', 'Yacht Club at Brickell'], favorited: ['Icon Bay', 'Elysee Miami'], deal: { building: '', unit: '', tour: '', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' } },
  { id: '6', first: 'Marcus', last: 'Okafor', phone: '(305) 118-6620', email: 'm.okafor@gmail.com', budget: '$4,100/mo', beds: '2BR', move: 'Aug 1', activity: 'Options sent · 5h ago', column: 'optionssent', lastContacted: daysAgo(0), area: 'Brickell', notes: 'Two dogs, needs pet park nearby', buildings: ['One Paraiso', 'Nine at Mary Brickell'], favorited: ['Nine at Mary Brickell'], deal: { building: '', unit: '', tour: '', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' } },
  { id: '7', first: 'Priya', last: 'Suarez', phone: '(305) 662-8814', email: 'psuarez@gmail.com', budget: '$1,700/mo', beds: 'Studio', move: 'Aug 25', activity: 'No response · 2d ago', column: 'followup', lastContacted: daysAgo(2), area: 'Downtown', notes: 'Price sensitive', buildings: ['Society Wynwood'], favorited: [], deal: { building: '', unit: '', tour: '', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' } },
  { id: '8', first: 'Brianna', last: 'Whitfield', phone: '(305) 774-1120', email: 'b.whitfield@gmail.com', budget: '$2,800/mo', beds: '1BR', move: 'Aug 3', activity: 'Tour confirmed · 12h ago', column: 'tourscheduled', lastContacted: daysAgo(0), area: 'Brickell', notes: 'Touring Thursday 2pm', buildings: ['One Paraiso', 'Yacht Club at Brickell'], favorited: ['Yacht Club at Brickell'], deal: { building: 'Yacht Club at Brickell', unit: '', tour: 'Thu 2:00pm', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' } },
  { id: '9', first: 'Gabriel', last: 'Ibarra', phone: '(305) 441-8820', email: 'g.ibarra@gmail.com', budget: '$3,050/mo', beds: '2BR', move: 'Jul 19', activity: 'Signed · closed', column: 'applied', lastContacted: daysAgo(0), area: 'Brickell', notes: 'Signed 14-month lease', buildings: ['Nine at Mary Brickell'], favorited: ['Nine at Mary Brickell'], deal: { building: 'Nine at Mary Brickell', unit: '2104', tour: 'Jul 10', leaseStart: 'Jul 19', leaseTerm: '14 mo', marketRent: '$3,050', invoiceEst: '$3,050' } },
]

function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: '#152238',
      border: '1px solid #19C6C0',
      color: '#E9EDF6',
      padding: '14px 18px',
      borderRadius: '10px',
      fontSize: '13px',
      maxWidth: '300px',
      zIndex: 999,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      animation: 'fadeInOut 3.2s ease-in-out',
    }}>
      {message}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function AgentPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [leadUpdates, setLeadUpdates] = useState<Record<string, Partial<Lead>>>({})

  const handleGoogleLogin = () => {
    setIsLoggedIn(true)
    setToast('Welcome back, Marcus!')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, ...updates } : l))
    setLeadUpdates(prev => ({ ...prev, [leadId]: updates }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Copied!')
  }

  const toggleFavorite = (leadId: string, building: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    const isFav = lead.favorited.includes(building)
    const newFav = isFav ? lead.favorited.filter(b => b !== building) : [...lead.favorited, building]
    updateLead(leadId, { favorited: newFav })
  }

  const markContacted = (leadId: string) => {
    updateLead(leadId, { lastContacted: new Date() })
  }

  const generateInvoice = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    showToast(`Invoice generated for ${lead.first} — Don notified, filed to team drive.`)
  }

  if (!isLoggedIn) {
    return (
      <div style={{
        background: '#0B1220',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Inter", sans-serif',
      }}>
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; }
        `}</style>
        <div style={{
          width: '360px',
          background: '#111B2E',
          border: '1px solid #223252',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#E9EDF6',
            marginTop: 0,
            marginBottom: '28px',
            textAlign: 'center',
            fontFamily: '"Archivo", sans-serif',
          }}>
            Sign in to MIAMI APARTMENT<span style={{ color: '#FF4D8D' }}> GUY</span>
          </h2>

          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              border: '1px solid #223252',
              borderRadius: '8px',
              color: '#E9EDF6',
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: '"Archivo", sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(25,198,192,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#19C6C0" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FF4D8D" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FFC24B" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#E9EDF6" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#0B1220',
      color: '#E9EDF6',
      fontFamily: '"Inter", sans-serif',
      minHeight: '100vh',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #223252; border-radius: 8px; }
      `}</style>

      {/* TOPBAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #223252',
        background: 'linear-gradient(180deg, #0D1526, #0B1220)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontFamily: '"Archivo", sans-serif', fontWeight: 900, fontSize: '20px', letterSpacing: '0.5px', color: '#fff' }}>MIAMI APARTMENT</span>
          <span style={{ fontFamily: '"Archivo", sans-serif', fontWeight: 900, fontSize: '20px', letterSpacing: '0.5px', color: '#FF4D8D' }}>GUY</span>
          <span style={{ fontSize: '11px', color: '#5B6780', marginLeft: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>Your Pipeline</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input
            placeholder="Search leads…"
            style={{
              background: '#111B2E',
              border: '1px solid #223252',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#8C97AE',
              fontFamily: '"Inter", sans-serif',
              width: '220px',
              outline: 'none',
            }}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px 6px 6px',
            borderRadius: '100px',
            background: '#111B2E',
            border: '1px solid #223252',
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#19C6C0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#03211F',
            }}>
              MW
            </div>
            <span style={{ fontSize: '13px', color: '#8C97AE' }}>Marcus Webb · Agent</span>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', height: 'calc(100vh - 61px)' }}>
        {/* KANBAN */}
        <div style={{ flex: 1, minWidth: 0, padding: '20px 0 20px 24px', display: 'flex', flexDirection: 'column', paddingRight: selectedLead ? 0 : 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '17px', fontWeight: 700, margin: 0, color: '#E9EDF6' }}>
              Your Pipeline <span style={{ color: '#5B6780', fontSize: '12px', fontWeight: 500, marginLeft: '8px' }}>· {leads.length}</span>
            </h1>
          </div>

          <div style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '12px',
            flex: 1,
            paddingRight: 24,
          }}>
            {COLUMNS.map((col) => {
              const colLeads = leads.filter(l => l.column === col.key)
              return (
                <div key={col.key} style={{ minWidth: '216px', maxWidth: '216px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '10px',
                    marginBottom: '10px',
                    borderBottom: `2px solid ${col.color}`,
                  }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.3px', margin: 0, color: '#E9EDF6', textTransform: 'uppercase' }}>
                      {col.label}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#5B6780', background: '#111B2E', padding: '1px 7px', borderRadius: '20px' }}>
                      {colLeads.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingBottom: '6px', minHeight: '20px' }}>
                    {colLeads.map((lead) => {
                      const diffMs = Date.now() - lead.lastContacted.getTime()
                      const days = Math.floor(diffMs / 86400000)
                      const color = spokeColor(days)
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          style={{
                            background: '#152238',
                            border: selectedLead?.id === lead.id ? '1px solid #FF4D8D' : '1px solid #223252',
                            borderRadius: '10px',
                            padding: '11px 12px',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s ease, transform 0.1s ease',
                            position: 'relative',
                            boxShadow: selectedLead?.id === lead.id ? '0 0 0 1px #FF4D8D, 0 4px 14px rgba(255,77,141,0.15)' : 'none',
                          }}
                          onMouseEnter={(e) => !selectedLead?.id === lead.id && (e.currentTarget.style.borderColor = '#5B6780')}
                          onMouseLeave={(e) => !selectedLead?.id === lead.id && (e.currentTarget.style.borderColor = '#223252')}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: color === 'green' ? '#2ECC71' : color === 'yellow' ? '#F39C12' : '#E74C3C',
                            flexShrink: 0,
                          }} />
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#E9EDF6', marginBottom: '6px' }}>
                            {lead.first} {lead.last.charAt(0)}.
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#8C97AE', marginTop: '3px' }}>
                            <span>{lead.beds}</span>
                            <span style={{ color: '#FFC24B', fontWeight: 600, fontFamily: '"Space Mono", monospace' }}>{lead.budget}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#8C97AE', marginTop: '3px' }}>{lead.move}</div>
                          <div style={{
                            marginTop: '8px',
                            fontSize: '10.5px',
                            color: '#5B6780',
                            borderTop: '1px dashed #223252',
                            paddingTop: '6px',
                          }}>
                            {lead.activity}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* DOSSIER */}
        {selectedLead && (
          <div style={{
            position: 'fixed',
            right: 0,
            top: '61px',
            bottom: 0,
            width: '480px',
            background: '#111B2E',
            padding: '22px 20px',
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
            borderLeft: '1px solid #223252',
          }}>
            <button
              onClick={() => setSelectedLead(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#152238',
                border: '1px solid #223252',
                color: '#8C97AE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.12s ease',
                zIndex: 5,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#E9EDF6'; e.currentTarget.style.borderColor = '#FF4D8D'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8C97AE'; e.currentTarget.style.borderColor = '#223252'; }}
            >
              ✕
            </button>

            {/* HEADER */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px',
              paddingBottom: '18px',
              borderBottom: '1px solid #223252',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Archivo", sans-serif',
                  fontWeight: 700,
                  fontSize: '17px',
                  color: '#03211F',
                  background: '#19C6C0',
                  flexShrink: 0,
                }}>
                  {selectedLead.first.charAt(0)}{selectedLead.last.charAt(0)}
                </div>
                <div>
                  <div style={{ fontFamily: '"Archivo", sans-serif', fontWeight: 700, fontSize: '17px', color: '#fff', lineHeight: 1.2 }}>
                    {selectedLead.first} {selectedLead.last}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#8C97AE', lineHeight: 1.8, marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span>{selectedLead.email}</span>
                      <button onClick={() => copyToClipboard(selectedLead.email)} style={{
                        width: '22px', height: '22px', flexShrink: 0, borderRadius: '6px', background: '#152238',
                        border: '1px solid #223252', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: '11px', color: '#5B6780', transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#19C6C0'; e.currentTarget.style.borderColor = '#19C6C0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#5B6780'; e.currentTarget.style.borderColor = '#223252'; }}
                      >
                        ⧉
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span>{selectedLead.phone}</span>
                      <button onClick={() => copyToClipboard(selectedLead.phone)} style={{
                        width: '22px', height: '22px', flexShrink: 0, borderRadius: '6px', background: '#152238',
                        border: '1px solid #223252', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: '11px', color: '#5B6780', transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#19C6C0'; e.currentTarget.style.borderColor = '#19C6C0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#5B6780'; e.currentTarget.style.borderColor = '#223252'; }}
                      >
                        ⧉
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#5B6780', lineHeight: 1.8 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: spokeColor(Math.floor((Date.now() - selectedLead.lastContacted.getTime()) / 86400000)) === 'green' ? '#2ECC71' : spokeColor(Math.floor((Date.now() - selectedLead.lastContacted.getTime()) / 86400000)) === 'yellow' ? '#F39C12' : '#E74C3C',
                    flexShrink: 0,
                  }} />
                  <b style={{ color: '#E9EDF6' }}>Contacted {spokeText(Math.floor((Date.now() - selectedLead.lastContacted.getTime()) / 86400000))}</b>
                </div>
                <div
                  onClick={() => markContacted(selectedLead.id)}
                  style={{
                    color: '#FF4D8D',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationOffset: '2px',
                    transition: 'color 0.12s ease',
                    display: 'block',
                    marginTop: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6FA0')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#FF4D8D')}
                >
                  Mark contacted
                </div>
              </div>
            </div>

            {/* INQUIRY */}
            <div style={{
              background: '#152238',
              border: '1px solid #223252',
              borderRadius: '14px',
              padding: '22px',
              marginBottom: '20px',
              borderLeft: '3px solid #19C6C0',
            }}>
              <h4 style={{
                margin: '0 0 16px',
                fontFamily: '"Archivo", sans-serif',
                fontSize: '13.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#E9EDF6',
              }}>
                INQUIRY
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Beds</label>
                  <input value={selectedLead.beds} onChange={(e) => updateLead(selectedLead.id, { beds: e.target.value })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Budget</label>
                  <input value={selectedLead.budget} onChange={(e) => updateLead(selectedLead.id, { budget: e.target.value })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Move-in</label>
                  <input value={selectedLead.move} onChange={(e) => updateLead(selectedLead.id, { move: e.target.value })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Area</label>
                  <input value={selectedLead.area} onChange={(e) => updateLead(selectedLead.id, { area: e.target.value })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Notes</label>
                  <textarea value={selectedLead.notes} onChange={(e) => updateLead(selectedLead.id, { notes: e.target.value })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none', resize: 'none', height: '56px', fontFamily: '"Inter", sans-serif',
                  }} />
                </div>
              </div>
            </div>

            {/* FAVORITED */}
            <div style={{
              background: '#152238',
              border: '1px solid #223252',
              borderRadius: '14px',
              padding: '22px',
              marginBottom: '20px',
              borderLeft: '3px solid #FFC24B',
            }}>
              <h4 style={{
                margin: '0 0 16px',
                fontFamily: '"Archivo", sans-serif',
                fontSize: '13.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#E9EDF6',
              }}>
                OPTIONS FAVORITED
              </h4>
              {selectedLead.buildings.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: '#5B6780' }}>No options sent yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {selectedLead.buildings.map((building) => (
                    <div key={building} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#0B1220',
                      border: '1px solid #223252',
                      borderRadius: '8px',
                      padding: '11px 12px',
                      fontSize: '13px',
                    }}>
                      <span>{building}</span>
                      <button
                        onClick={() => toggleFavorite(selectedLead.id, building)}
                        style={{
                          cursor: 'pointer',
                          fontSize: '16px',
                          lineHeight: 1,
                          userSelect: 'none',
                          transition: 'color 0.1s ease',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: selectedLead.favorited.includes(building) ? '#FFC24B' : '#5B6780',
                        }}
                      >
                        ★
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DEAL INFO */}
            <div style={{
              background: '#152238',
              border: '1px solid #223252',
              borderRadius: '14px',
              padding: '22px',
              marginBottom: '20px',
              borderLeft: '3px solid #FF4D8D',
            }}>
              <h4 style={{
                margin: '0 0 16px',
                fontFamily: '"Archivo", sans-serif',
                fontSize: '13.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#E9EDF6',
              }}>
                DEAL INFO
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Building</label>
                  <input value={selectedLead.deal.building} onChange={(e) => updateLead(selectedLead.id, { deal: { ...selectedLead.deal, building: e.target.value } })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Unit</label>
                  <input value={selectedLead.deal.unit} onChange={(e) => updateLead(selectedLead.id, { deal: { ...selectedLead.deal, unit: e.target.value } })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>First Tour</label>
                  <input value={selectedLead.deal.tour} onChange={(e) => updateLead(selectedLead.id, { deal: { ...selectedLead.deal, tour: e.target.value } })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Lease Start</label>
                  <input value={selectedLead.deal.leaseStart} onChange={(e) => updateLead(selectedLead.id, { deal: { ...selectedLead.deal, leaseStart: e.target.value } })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Term</label>
                  <input value={selectedLead.deal.leaseTerm} onChange={(e) => updateLead(selectedLead.id, { deal: { ...selectedLead.deal, leaseTerm: e.target.value } })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#5B6780', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Market Rent</label>
                  <input value={selectedLead.deal.marketRent} onChange={(e) => updateLead(selectedLead.id, { deal: { ...selectedLead.deal, marketRent: e.target.value } })} style={{
                    width: '100%', background: '#0B1220', border: '1px solid #223252', borderRadius: '7px', padding: '10px 12px', fontSize: '13px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
              </div>
              <button
                onClick={() => generateInvoice(selectedLead.id)}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  textAlign: 'center',
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#FF4D8D',
                  color: '#2A0714',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: '"Archivo", sans-serif',
                  letterSpacing: '0.4px',
                  transition: 'filter 0.12s ease',
                  border: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
              >
                GENERATE INVOICE
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} />}
    </div>
  )
}
