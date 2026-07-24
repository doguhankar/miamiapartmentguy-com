'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  quick_note: string
  deal_value: number
  archive_reason: string
  archive_notes: string
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

// Matches the Supabase leads table schema exactly
interface DbLead {
  id: number
  created_at: string | null
  name: string | null
  email: string | null
  phone: string | null
  move_in_timing: string | null
  beds: string | null
  budget: string | null
  area: string | null
  credit_range: string | null
  notes: string | null
  agent_id: string | null
  stage: string | null
  spoke_with: string | null
  source: string | null
  quick_note: string | null
  deal_value: number | null
  archive_reason: string | null
  archive_notes: string | null
}

// Map DB stage value → COLUMNS key
function stageToColumnKey(stage: string | null): string {
  if (!stage) return 'newlead'
  const s = stage.toLowerCase().replace(/[\s\/]+/g, '')
  if (s.includes('new') || s.includes('newlead')) return 'newlead'
  if (s.includes('discovery') || s.includes('call')) return 'discoverycall'
  if (s.includes('option') || s.includes('sent')) return 'optionssent'
  if (s.includes('follow') || s.includes('followup')) return 'followup'
  if (s.includes('tour')) return 'tourscheduled'
  if (s.includes('applied') || s.includes('signed') || s.includes('lease')) return 'applied'
  if (s.includes('archive')) return 'archive'
  return 'newlead'
}

function dbLeadToLead(row: DbLead): Lead {
  const nameParts = (row.name ?? 'Unknown').trim().split(' ')
  const first = nameParts[0] ?? 'Unknown'
  const last = nameParts.slice(1).join(' ') || ''
  const lastContacted = row.spoke_with ? new Date(row.spoke_with) : new Date(row.created_at ?? Date.now())
  const daysSince = Math.floor((Date.now() - lastContacted.getTime()) / 86400000)
  const activity = row.spoke_with
    ? `Last contact · ${daysSince === 0 ? 'today' : `${daysSince}d ago`}`
    : row.source
      ? `Via ${row.source}`
      : 'New lead'
  return {
    id: String(row.id),
    first,
    last,
    phone: row.phone ?? '',
    email: row.email ?? '',
    budget: row.budget ?? '',
    beds: row.beds ?? '',
    move: row.move_in_timing ?? '',
    activity,
    column: stageToColumnKey(row.stage),
    lastContacted,
    area: row.area ?? '',
    notes: row.notes ?? '',
    quick_note: row.quick_note ?? '',
    deal_value: row.deal_value ?? 0,
    archive_reason: row.archive_reason ?? '',
    archive_notes: row.archive_notes ?? '',
    buildings: [],
    favorited: [],
    deal: { building: '', unit: '', tour: '', leaseStart: '', leaseTerm: '', marketRent: '', invoiceEst: '' },
  }
}

// Parse a budget string into a midpoint dollar value for PPV calculation
function parseBudgetMidpoint(budget: string): number {
  if (!budget) return 0
  const nums = budget.replace(/[,$]/g, '').match(/\d+/g)?.map(Number) ?? []
  if (nums.length === 0) return 0
  if (nums.length === 1) return nums[0]
  return Math.round((nums[0] + nums[1]) / 2)
}

const COLUMNS = [
  { key: 'newlead', label: 'New Lead', color: '#5B6780', stage: 'New Lead' },
  { key: 'discoverycall', label: 'Discovery Call Made', color: '#19C6C0', stage: 'Discovery Call Made' },
  { key: 'optionssent', label: 'Options Sent', color: '#19C6C0', stage: 'Options Sent' },
  { key: 'followup', label: 'Follow Up', color: '#FFC24B', stage: 'Follow Up' },
  { key: 'tourscheduled', label: 'Tour Scheduled', color: '#FF4D8D', stage: 'Tour Scheduled' },
  { key: 'applied', label: 'Applied / Signed Lease', color: '#FF4D8D', stage: 'Applied / Signed Lease' },
  { key: 'archive', label: 'Archive', color: '#5B6780', stage: 'Archive' },
]

const BUILDINGS = [
  'Icon Bay', 'Society Wynwood', 'One Paraiso', 'Elysee Miami',
  'Yacht Club at Brickell', 'Nine at Mary Brickell', 'SLS Lux Brickell',
]

// Returns days since a date, or 0 if the date is invalid (guards against NaN crash)
function safeGetDays(d: Date): number {
  const ms = Date.now() - d.getTime()
  return isNaN(ms) ? 0 : Math.floor(ms / 86400000)
}

function spokeColor(days: number) {
  if (days < 2) return 'green'
  if (days < 3) return 'yellow'
  return 'red'
}

function spokeText(days: number) {
  return days <= 0 ? 'today' : `${days}d ago`
}

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

// Auth status drives which screen is shown:
//   idle      → login page
//   loading   → spinner (OAuth redirect returned, checking session)
//   checking  → spinner (querying agent_allowlist)
//   denied    → Access Denied card
//   approved  → dashboard
type AuthStatus = 'idle' | 'loading' | 'checking' | 'denied' | 'approved'

export default function AgentPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [leadUpdates, setLeadUpdates] = useState<Record<string, Partial<Lead>>>({})
  const [allowlistError, setAllowlistError] = useState<string | null>(null)
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [archivePopupOpen, setArchivePopupOpen] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')
  const [archiveNotes, setArchiveNotes] = useState('')

  // Null until hydrated in useEffect — prevents createClient() from running
  // during SSR/build prerender where NEXT_PUBLIC env vars are unavailable.
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Guard against concurrent allowlist checks (e.g. getSession + SIGNED_IN racing)
  const checkingRef = useRef(false)

  useEffect(() => {
    // Initialize Supabase client only in the browser — never during SSR/prerender
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    const sb = supabaseRef.current

    const fetchLeads = async () => {
      const { data, error } = await sb
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) setLeads((data as DbLead[]).map(dbLeadToLead))
    }

    const runAllowlistCheck = async (
      email: string,
      name: string,
      onApproved: () => void,
    ) => {
      if (checkingRef.current) return
      checkingRef.current = true
      setAuthStatus('checking')
      setUser({ email, name })
      try {
        const { data, error } = await sb
          .from('agent_allowlist')
          .select('approved')
          .eq('email', email)
          .eq('approved', true)
          .maybeSingle()
        if (error) {
          setAllowlistError('Error checking authorization. Try again.')
          setAuthStatus('denied')
        } else if (!data) {
          setTimeout(() => sb.auth.signOut(), 0)
          setAllowlistError(null)
          setAuthStatus('denied')
        } else {
          setAuthStatus('approved')
          onApproved()
        }
      } catch {
        setAllowlistError('Error checking authorization. Try again.')
        setAuthStatus('denied')
      } finally {
        checkingRef.current = false
      }
    }

    // onAuthStateChange fires INITIAL_SESSION first (existing session or null),
    // then SIGNED_IN only for fresh logins — both must run the allowlist check.
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const email = session.user.email ?? ''
        const name = session.user.user_metadata?.full_name || email.split('@')[0] || 'User'
        const showWelcome = event === 'SIGNED_IN'
        setTimeout(() => {
          runAllowlistCheck(email, name, () => {
            if (showWelcome) showToast(`Welcome back, ${name}!`)
            fetchLeads()
          })
        }, 0)
      } else if (event === 'INITIAL_SESSION' && !session?.user) {
        setAuthStatus('idle')
      } else if (event === 'SIGNED_OUT') {
        checkingRef.current = false
        setUser(null)
        setAuthStatus('idle')
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    // REQUIRED OAUTH CONFIGURATION:
    // Before this works, you must configure OAuth in THREE places:
    //
    // 1. SUPABASE DASHBOARD (https://app.supabase.com/project/thmklqucaqohzjqmpnqe/auth/url-configuration)
    //    - Site URL: https://miamiapartmentguy.com
    //    - Redirect URLs (allowlist): Add both:
    //      * https://miamiapartmentguy.com/agent
    //      * http://localhost:3000/agent (for local dev)
    //
    // 2. GOOGLE CLOUD CONSOLE (https://console.cloud.google.com/apis/credentials)
    //    - Find the OAuth 2.0 Client ID used in this project
    //    - Add to "Authorized redirect URIs":
    //      * https://thmklqucaqohzjqmpnqe.supabase.co/auth/v1/callback
    //    - Ensure OAuth consent screen is set to "Production" status
    //
    // 3. CODE (already correct below):
    //    - Redirects to: window.location.origin + '/agent' (dynamic per environment)
    //
    // After OAuth succeeds, Google redirects to Supabase callback URL, which then
    // redirects back to /agent. The onAuthStateChange listener detects the session
    // and displays the dashboard.

    const redirectUrl = typeof window !== 'undefined' 
      ? window.location.origin + '/agent'
      : 'https://miamiapartmentguy.com/agent'

    const sb = supabaseRef.current
    if (!sb) return

    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      showToast(`Login error: ${error.message}`)
    }
  }

  const handleLogout = () => {
    supabaseRef.current?.auth.signOut()
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const saveLead = async (leadId: string, updates: Partial<Lead>) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || !supabaseRef.current) return

    // Map Lead fields to DB column names
    const dbUpdates: Record<string, any> = {}
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.beds !== undefined) dbUpdates.beds = updates.beds
    if (updates.budget !== undefined) dbUpdates.budget = updates.budget
    if (updates.move !== undefined) dbUpdates.move_in_timing = updates.move
    if (updates.area !== undefined) dbUpdates.area = updates.area
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.quick_note !== undefined) dbUpdates.quick_note = updates.quick_note
    if (updates.deal_value !== undefined) dbUpdates.deal_value = updates.deal_value
    if (updates.archive_reason !== undefined) dbUpdates.archive_reason = updates.archive_reason
    if (updates.archive_notes !== undefined) dbUpdates.archive_notes = updates.archive_notes

    const { error } = await supabaseRef.current
      .from('leads')
      .update(dbUpdates)
      .eq('id', parseInt(leadId))

    if (error) {
      console.error('[supabase] saveLead error:', error.message)
      showToast('Failed to save changes')
    }
  }

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, ...updates } : l)
    setLeads(updatedLeads)
    // Also update selectedLead if it's the one being edited — keeps the input synced
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, ...updates })
    }
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

  const markContacted = async (leadId: string) => {
    const now = new Date()
    updateLead(leadId, { lastContacted: now })
    // Persist spoke_with timestamp to Supabase
    if (supabaseRef.current) {
      const { error } = await supabaseRef.current
        .from('leads')
        .update({ spoke_with: now.toISOString() })
        .eq('id', parseInt(leadId))
      if (error) console.error('[supabase] markContacted error:', error.message)
    }
  }

  const handleArchiveLead = async () => {
    if (!selectedLead || !archiveReason) return
    // Move lead to Archive column and save archive details
    updateLead(selectedLead.id, {
      column: 'archive',
      archive_reason: archiveReason,
      archive_notes: archiveNotes,
    })
    // Persist to Supabase
    if (supabaseRef.current) {
      const { error } = await supabaseRef.current
        .from('leads')
        .update({
          stage: 'Archive',
          archive_reason: archiveReason,
          archive_notes: archiveNotes,
        })
        .eq('id', parseInt(selectedLead.id))
      if (error) {
        console.error('[supabase] archive error:', error.message)
        showToast('Failed to archive lead')
      } else {
        showToast('Lead archived')
        setArchivePopupOpen(false)
        setArchiveReason('')
        setArchiveNotes('')
      }
    }
  }

  const generateInvoice = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    showToast(`Invoice generated for ${lead.first} — Don notified, filed to team drive.`)
  }

  const centeredWrap = {
    background: '#0B1220' as const,
    minHeight: '100vh',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontFamily: '"Inter", sans-serif',
  }
  const card = {
    width: '360px',
    background: '#111B2E',
    border: '1px solid #223252',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
  }
  const baseStyles = <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
  const logoHeading = (
    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#E9EDF6', marginTop: 0, marginBottom: '28px', textAlign: 'center', fontFamily: '"Archivo", sans-serif' }}>
      Sign in to MIAMI APARTMENT<span style={{ color: '#FF4D8D' }}> GUY</span>
    </h2>
  )
  const googleSvg = (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#19C6C0" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FF4D8D" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FFC24B" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#E9EDF6" />
    </svg>
  )

  // ── IDLE: login screen ──────────────────���───────────────────────────────────
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('leadId', leadId)
    setDraggedLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnColumn = async (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('leadId')
    const targetCol = COLUMNS.find(c => c.key === targetColumnKey)
    if (!draggedId || !targetCol) return

    const draggedLead = leads.find(l => l.id === draggedId)
    if (!draggedLead || draggedLead.column === targetColumnKey) {
      setDraggedLeadId(null)
      return
    }

    // Update local state immediately for visual feedback
    const newColumnKey = targetColumnKey
    const newStage = targetCol.stage
    updateLead(draggedId, { column: newColumnKey })
    if (selectedLead?.id === draggedId) {
      setSelectedLead({ ...selectedLead, column: newColumnKey })
    }

    // Persist to Supabase with error handling
    try {
      if (supabaseRef.current) {
        const { error } = await supabaseRef.current
          .from('leads')
          .update({ stage: newStage })
          .eq('id', parseInt(draggedId))

        if (error) {
          console.error('[supabase] drag-drop save failed:', error.message)
          // Revert local state on error
          const oldLead = leads.find(l => l.id === draggedId)
          if (oldLead) {
            updateLead(draggedId, { column: oldLead.column })
            if (selectedLead?.id === draggedId) {
              setSelectedLead({ ...selectedLead, column: oldLead.column })
            }
          }
          showToast('Failed to move lead — changes reverted')
        } else {
          showToast(`Lead moved to ${newStage}`)
        }
      }
    } catch (err) {
      console.error('[supabase] drag-drop exception:', err)
      showToast('Error moving lead')
    } finally {
      setDraggedLeadId(null)
    }
  }

  if (authStatus === 'idle') {
    return (
      <div style={centeredWrap}>
        {baseStyles}
        <div style={card}>
          {logoHeading}
          <button
            onClick={handleGoogleLogin}
            style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid #223252', borderRadius: '8px', color: '#E9EDF6', fontWeight: 700, fontSize: '14px', fontFamily: '"Archivo", sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.12s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(25,198,192,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {googleSvg}
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  // ── LOADING / CHECKING: spinner ─────────────────────────────────────────────
  if (authStatus === 'loading' || authStatus === 'checking') {
    return (
      <div style={centeredWrap}>
        {baseStyles}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ ...card, textAlign: 'center' }}>
          {logoHeading}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #223252', borderTopColor: '#19C6C0', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#5B6780' }}>
              {authStatus === 'checking' ? 'Verifying access...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── DENIED: access denied screen ──────────────���────────────────────────────
  if (authStatus === 'denied') {
    return (
      <div style={centeredWrap}>
        {baseStyles}
        <div style={{ ...card, maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,77,141,0.12)', border: '1px solid rgba(255,77,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF4D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#E9EDF6', margin: '0 0 10px', fontFamily: '"Archivo", sans-serif' }}>
              Access Denied
            </h2>
            <p style={{ fontSize: '14px', color: '#5B6780', margin: 0, lineHeight: 1.6 }}>
              {allowlistError
                ? allowlistError
                : 'Your email is not authorized to access the agent portal. Contact Don Karahan for access.'}
            </p>
          </div>
          <button
            onClick={async () => { await supabaseRef.current?.auth.signOut(); window.location.href = '/' }}
            style={{ width: '100%', padding: '14px', background: 'rgba(255,77,141,0.1)', border: '1px solid rgba(255,77,141,0.3)', borderRadius: '8px', color: '#FF4D8D', fontWeight: 700, fontSize: '14px', fontFamily: '"Archivo", sans-serif', cursor: 'pointer', transition: 'all 0.12s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,77,141,0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,77,141,0.1)')}
          >
            Sign out
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
            cursor: 'pointer',
            transition: 'border-color 0.12s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#19C6C0')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#223252')}
          onClick={handleLogout}
          title="Click to logout"
          >
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
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <span style={{ fontSize: '13px', color: '#8C97AE' }}>{user?.name || 'User'} · Agent</span>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', height: 'calc(100vh - 61px)' }}>
        {/* KANBAN */}
        <div style={{ flex: 1, minWidth: 0, padding: '20px 0 0 24px', display: 'flex', flexDirection: 'column', paddingRight: selectedLead ? 0 : 24, overflowY: 'auto' }}>
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
                <div
                  key={col.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnColumn(e, col.key)}
                  style={{
                    minWidth: '216px',
                    maxWidth: '216px',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    borderRadius: '8px',
                    padding: '8px',
                    transition: 'background-color 0.15s ease',
                  }}
                >
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
                      const days = safeGetDays(lead.lastContacted)
                      const color = spokeColor(days)
                      return (
                        <div
                          key={lead.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => setSelectedLead(lead)}
                          style={{
                            background: draggedLeadId === lead.id ? '#0B1220' : '#152238',
                            border: selectedLead?.id === lead.id ? '1px solid #FF4D8D' : '1px solid #223252',
                            borderRadius: '10px',
                            padding: '11px 12px',
                            cursor: draggedLeadId === lead.id ? 'grabbing' : 'grab',
                            transition: 'border-color 0.15s ease, transform 0.1s ease, opacity 0.1s ease',
                            position: 'relative',
                            boxShadow: selectedLead?.id === lead.id ? '0 0 0 1px #FF4D8D, 0 4px 14px rgba(255,77,141,0.15)' : 'none',
                            opacity: draggedLeadId === lead.id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => !selectedLead?.id === lead.id && draggedLeadId !== lead.id && (e.currentTarget.style.borderColor = '#5B6780')}
                          onMouseLeave={(e) => !selectedLead?.id === lead.id && draggedLeadId !== lead.id && (e.currentTarget.style.borderColor = '#223252')}
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
                          {lead.quick_note && (
                            <div style={{
                              marginTop: '8px',
                              fontSize: '11px',
                              fontStyle: 'italic',
                              color: '#6B7488',
                              borderTop: '1px dashed #223252',
                              paddingTop: '6px',
                            }}>
                              {lead.quick_note}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* METRICS ROW */}
          {(() => {
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

            // GCI: sum of deal_value for closed leads this calendar month
            const closedThisMonth = leads.filter(l =>
              l.column === 'applied' && l.lastContacted >= monthStart
            )
            const gci = closedThisMonth.reduce((sum, l) => sum + (l.deal_value ?? 0), 0)

            // PPV: sum of budget midpoints across active (non-archive, non-closed) leads
            const activeLeads = leads.filter(l => l.column !== 'archive' && l.column !== 'applied')
            const ppv = activeLeads.reduce((sum, l) => sum + parseBudgetMidpoint(l.budget), 0)

            // Conversion rate: closed ÷ total
            const totalLeads = leads.length
            const closedTotal = leads.filter(l => l.column === 'applied').length
            const convRate = totalLeads > 0 ? Math.round((closedTotal / totalLeads) * 100) : 0

            const fmt = (n: number) => n >= 1000
              ? '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k'
              : '$' + n.toLocaleString()

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                paddingRight: 24,
                paddingBottom: 20,
                flexShrink: 0,
              }}>
                {/* GCI */}
                <div style={{
                  background: '#151E33',
                  border: '0.5px solid rgba(255,77,141,0.25)',
                  borderLeft: '2px solid #FF4D8D',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#6B7488', letterSpacing: '0.05em', margin: 0 }}>GCI</p>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '28px', fontWeight: 500, color: '#FFFFFF', margin: 0 }}>{fmt(gci)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF4D8D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <p style={{ fontSize: '12px', color: '#F4C0D1', margin: 0 }}>{closedThisMonth.length} deals closed this month</p>
                  </div>
                </div>

                {/* PPV */}
                <div style={{
                  background: '#151E33',
                  border: '0.5px solid rgba(25,198,192,0.25)',
                  borderLeft: '2px solid #19C6C0',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#6B7488', letterSpacing: '0.05em', margin: 0 }}>PPV</p>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#19C6C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '28px', fontWeight: 500, color: '#FFFFFF', margin: 0 }}>{fmt(ppv)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#19C6C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                    </svg>
                    <p style={{ fontSize: '12px', color: '#9FE1CB', margin: 0 }}>{activeLeads.length} active leads in motion</p>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div style={{
                  background: '#151E33',
                  border: '0.5px solid rgba(255,194,75,0.25)',
                  borderLeft: '2px solid #FFC24B',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#6B7488', letterSpacing: '0.05em', margin: 0 }}>conversion rate</p>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC24B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '28px', fontWeight: 500, color: '#FFFFFF', margin: 0 }}>{convRate}%</p>
                  <div style={{ margin: '8px 0 0', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#FFC24B', height: '100%', width: `${convRate}%`, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#FAC775', margin: '6px 0 0' }}>{closedTotal} of {totalLeads} leads closed</p>
                </div>
              </div>
            )
          })()}
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

            {/* HEADER — Compact design with avatar, name, contacted status, quick note, email/phone */}
            <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '0.5px solid #223252' }}>
              {/* Top row: Avatar + Name + Contacted Status */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingRight: '28px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  flex: '0 0 38px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 500,
                  fontSize: '13px',
                  color: '#19C6C0',
                  background: 'rgba(25, 198, 192, 0.15)',
                }}>
                  {selectedLead.first.charAt(0)}{selectedLead.last.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{ fontWeight: 500, fontSize: '15px', margin: 0, color: '#fff' }}>
                      {selectedLead.first} {selectedLead.last}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: spokeColor(safeGetDays(selectedLead.lastContacted)) === 'green' ? '#4ADE80' : spokeColor(safeGetDays(selectedLead.lastContacted)) === 'yellow' ? '#F39C12' : '#EF4444',
                          display: 'inline-block',
                        }} />
                        <span style={{ fontSize: '11px', color: '#A9B2C3' }}>Contacted {spokeText(safeGetDays(selectedLead.lastContacted))}</span>
                      </div>
                      <button
                        onClick={() => setArchivePopupOpen(true)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: '#fff',
                          background: '#EF4444',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#DC2626' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#EF4444' }}
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                  {/* Quick note input — borderless, italic, muted */}
                  <input
                    type="text"
                    value={selectedLead.quick_note}
                    onChange={(e) => updateLead(selectedLead.id, { quick_note: e.target.value })}
                    onBlur={(e) => saveLead(selectedLead.id, { quick_note: e.target.value })}
                    placeholder="Add a note..."
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      marginTop: '1px',
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: selectedLead.quick_note ? '#E9EDF6' : '#6B7488',
                      width: '100%',
                      height: 'auto',
                      fontFamily: '"Inter", sans-serif',
                      outline: 'none',
                    }}
                    onFocus={(e) => { if (!selectedLead.quick_note) e.target.style.color = '#E9EDF6' }}
                    onBlur={(e) => { if (!e.target.value) e.target.style.color = '#6B7488' }}
                  />
                </div>
              </div>
            </div>

            {/* ARCHIVE POPUP */}
            {archivePopupOpen && (
              <div style={{
                background: '#152238',
                border: '1px solid #223252',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '12px',
                borderTop: '3px solid #EF4444',
              }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Why are you archiving this lead?</p>
                <select
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    marginBottom: '12px',
                    background: '#0B1220',
                    border: '0.5px solid #223252',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#E9EDF6',
                    fontFamily: '"Inter", sans-serif',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select a reason...</option>
                  <option value="Ghosted / stopped responding">Ghosted / stopped responding</option>
                  <option value="Went with another agent/competitor">Went with another agent/competitor</option>
                  <option value="Budget mismatch">Budget mismatch</option>
                  <option value="Bad credit / income">Bad credit / income</option>
                  <option value="Not serious / tire-kicker">Not serious / tire-kicker</option>
                  <option value="Found a place already">Found a place already</option>
                  <option value="Duplicate/test lead">Duplicate/test lead</option>
                </select>
                <textarea
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  placeholder="Any context for later..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    marginBottom: '12px',
                    background: '#0B1220',
                    border: '0.5px solid #223252',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#E9EDF6',
                    fontFamily: '"Inter", sans-serif',
                    outline: 'none',
                    resize: 'none',
                    height: '48px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setArchivePopupOpen(false)
                      setArchiveReason('')
                      setArchiveNotes('')
                    }}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      color: '#A9B2C3',
                      background: 'transparent',
                      border: '0.5px solid #223252',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5B6780'; e.currentTarget.style.color = '#E9EDF6' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#223252'; e.currentTarget.style.color = '#A9B2C3' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleArchiveLead}
                    disabled={!archiveReason}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: archiveReason ? '#fff' : '#6B7488',
                      background: archiveReason ? '#EF4444' : '#5B6780',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: archiveReason ? 'pointer' : 'not-allowed',
                      transition: 'all 0.12s ease',
                      opacity: archiveReason ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => { if (archiveReason) e.currentTarget.style.background = '#DC2626' }}
                    onMouseLeave={(e) => { if (archiveReason) e.currentTarget.style.background = '#EF4444' }}
                  >
                    Archive lead
                  </button>
                </div>
              </div>
            )}

            {/* EMAIL & PHONE — Icon + borderless input */}
            <div style={{ borderTop: '0.5px solid #223252', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '0.5px solid #223252' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6B7488', flex: '0 0 auto' }}>✉</span>
                <input
                  type="text"
                  value={selectedLead.email}
                  onChange={(e) => updateLead(selectedLead.id, { email: e.target.value })}
                  onBlur={(e) => saveLead(selectedLead.id, { email: e.target.value })}
                  placeholder="Add email"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '12px',
                    padding: 0,
                    flex: 1,
                    color: '#E9EDF6',
                    height: 'auto',
                    fontFamily: '"Inter", sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6B7488', flex: '0 0 auto' }}>☎</span>
                <input
                  type="text"
                  value={selectedLead.phone}
                  onChange={(e) => updateLead(selectedLead.id, { phone: e.target.value })}
                  onBlur={(e) => saveLead(selectedLead.id, { phone: e.target.value })}
                  placeholder="Add phone"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '12px',
                    padding: 0,
                    flex: 1,
                    color: '#E9EDF6',
                    height: 'auto',
                    fontFamily: '"Inter", sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* INQUIRY */}
            <div style={{
              background: '#152238',
              border: '1px solid #223252',
              borderRadius: '14px',
              padding: '12px',
              marginBottom: '20px',
              borderLeft: '3px solid #19C6C0',
            }}>
              <p style={{
                margin: '0 0 10px',
                fontSize: '10px',
                fontWeight: 500,
                color: '#6B7488',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}>
                INQUIRY
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <p style={{ fontSize: '10px', color: '#6B7488', margin: '0 0 2px' }}>beds</p>
                  <input value={selectedLead.beds} onChange={(e) => updateLead(selectedLead.id, { beds: e.target.value })} onBlur={(e) => saveLead(selectedLead.id, { beds: e.target.value })} style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: '#6B7488', margin: '0 0 2px' }}>budget</p>
                  <input value={selectedLead.budget} onChange={(e) => updateLead(selectedLead.id, { budget: e.target.value })} onBlur={(e) => saveLead(selectedLead.id, { budget: e.target.value })} style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: '#6B7488', margin: '0 0 2px' }}>move-in</p>
                  <input value={selectedLead.move} onChange={(e) => updateLead(selectedLead.id, { move: e.target.value })} onBlur={(e) => saveLead(selectedLead.id, { move: e.target.value })} style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: '#6B7488', margin: '0 0 2px' }}>area</p>
                  <input value={selectedLead.area} onChange={(e) => updateLead(selectedLead.id, { area: e.target.value })} onBlur={(e) => saveLead(selectedLead.id, { area: e.target.value })} style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none',
                  }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '10px', color: '#6B7488', margin: '0 0 2px' }}>notes</p>
                  <textarea value={selectedLead.notes} onChange={(e) => updateLead(selectedLead.id, { notes: e.target.value })} onBlur={(e) => saveLead(selectedLead.id, { notes: e.target.value })} style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', color: '#E9EDF6', fontFamily: '"Inter", sans-serif', outline: 'none', resize: 'none', height: '48px',
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
