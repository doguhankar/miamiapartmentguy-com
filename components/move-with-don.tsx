'use client'

import { useState, useEffect } from 'react'

interface LeadData {
  moveDate: string
  apartmentSize: string
  budget: string
  neighborhoods: string[]
  creditScore: string
  agent: string
  name: string
  phone: string
}

interface MoveWithDonProps {
  isOpen: boolean
  onClose: () => void
  /** agent_id value stored on the lead for this route (defaults to Don's address) */
  agentId?: string
  /** source value stored on the lead for this route (defaults to 'Homepage Form') */
  source?: string
  /** Slack channel that should receive the lead notification for this route */
  slackChannel?: string
  /** Skip the agent-selection step for routes with a locked agent */
  skipAgentSelection?: boolean
  /** Display name used in visible flow labels */
  agentDisplayName?: string
}

const TOTAL_STEPS = 7

const emptyLead = (): LeadData => ({
  moveDate: '',
  apartmentSize: '',
  budget: '',
  neighborhoods: [],
  creditScore: '',
  agent: 'don',
  name: '',
  phone: '',
})

export function MoveWithDon({
  isOpen,
  onClose,
  agentId = 'doguhankar1@gmail.com',
  source = 'Homepage Form',
  slackChannel,
  skipAgentSelection = false,
  agentDisplayName = 'Don',
}: MoveWithDonProps) {
  const totalSteps = skipAgentSelection ? TOTAL_STEPS - 1 : TOTAL_STEPS
  const [step, setStep] = useState(0)
  const [data, setData] = useState<LeadData>(emptyLead())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setData(emptyLead())
      setDone(false)
      setSubmitting(false)
    }
  }, [isOpen])

  const handleClose = () => {
    onClose()
  }

  /* ── answer helpers ── */
  const setChip = (field: keyof LeadData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const isSelected = (field: keyof LeadData, value: string) =>
    data[field] === value

  /* ── navigation ── */
  const canNext = (): boolean => {
    if (step === 0) return true
    if (step === 1) return !!data.moveDate
    if (step === 2) return !!data.apartmentSize
    if (step === 3) return !!data.budget
    if (step === 4) return !!data.neighborhoods[0]
    if (step === 5) return !!data.creditScore
    if (step === 6) return skipAgentSelection || !!data.agent
    if (step === 7) return !!data.name.trim() && data.phone.trim().length >= 7
    return false
  }

  const next = async () => {
    if (step < totalSteps) {
      setStep(s => (skipAgentSelection && s === 5 ? 7 : s + 1))
    } else {
      await submit()
    }
  }

  const skip = () => {
    if (step < totalSteps) setStep(s => (skipAgentSelection && s === 5 ? 7 : s + 1))
  }

  const back = () => {
    if (step > 0) setStep(s => (skipAgentSelection && s === 7 ? 5 : s - 1))
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, agentId, source, slackChannel }),
      })
      if (res.ok) setDone(true)
    } catch (e) {
      console.error('[v0] Submit error:', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  /* ── shared chip renderer ── */
  const Chips = ({
    field,
    options,
    cols = 2,
  }: {
    field: keyof LeadData
    options: { label: string; sub?: string }[]
    cols?: number
  }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10,
        marginTop: 4,
      }}
    >
      {options.map(({ label, sub }) => {
        const sel = isSelected(field, label)
        return (
          <button
            key={label}
            onClick={() => setChip(field, label)}
            style={{
              background: sel ? 'rgba(255,77,141,0.12)' : '#16253A',
              border: `0.5px solid ${sel ? '#FF4D8D' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12,
              padding: '16px 12px',
              fontSize: 14,
              fontWeight: 600,
              color: sel ? '#FF4D8D' : '#E6ECF5',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
              lineHeight: 1.3,
            }}
          >
            {label}
            {sub && (
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 400,
                  color: sel ? 'rgba(255,77,141,0.7)' : '#6F7F96',
                  marginTop: 2,
                }}
              >
                {sub}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  /* ── step content ── */
  const renderBody = () => {
    if (done) {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(25,198,192,0.12)',
              border: '0.5px solid rgba(25,198,192,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              fontSize: 28,
              color: '#19C6C0',
            }}
          >
            ✓
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: '#E6ECF5' }}>
            You&apos;re in.
          </h2>
          <p style={{ fontSize: 14, color: '#8FA0B8', lineHeight: 1.6, marginBottom: 4 }}>
            Don&apos;s pulling live pricing for you now.
          </p>
          <p style={{ fontSize: 14, color: '#8FA0B8', lineHeight: 1.6 }}>
            Expect a text{' '}
            <span style={{ color: '#FFC24B', fontWeight: 600 }}>within the hour</span>{' '}
            during the day.
          </p>
        </div>
      )
    }

    if (step === 0) {
      return (
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🌴</div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              color: '#19C6C0',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Move with {agentDisplayName}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 6, color: '#E6ECF5' }}>
            Welcome to Miami.
          </h2>
          <p style={{ fontSize: 13, color: '#8FA0B8', marginBottom: 24, lineHeight: 1.5 }}>
            Let&apos;s find your place.
          </p>
          <div
            style={{
              textAlign: 'left',
              background: '#16253A',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '16px 18px',
            }}
          >
            {[
              { n: 1, text: 'Answer 6 quick questions', sub: '— 30 seconds' },
              { n: 2, text: `${agentDisplayName} texts you real quotes`, sub: '— net pricing, concessions' },
              { n: 3, text: 'Tour, sign, move in', sub: '— free for you, always' },
            ].map(({ n, text, sub }) => (
              <div
                key={n}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '7px 0' }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#FF4D8D',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {n}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: '#E6ECF5' }}>
                  {text}{' '}
                  <span style={{ color: '#6F7F96' }}>{sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (step === 1) {
      return (
        <>
          <Kicker />
          <h2 style={headStyle}>When are you moving?</h2>
          <p style={hintStyle}>Rough timing is fine — deals change monthly.</p>
          <Chips
            field="moveDate"
            options={[
              { label: 'ASAP', sub: 'Within 2 weeks' },
              { label: 'This month', sub: 'Next 30 days' },
              { label: '1–2 months', sub: 'Planning ahead' },
              { label: '3+ months', sub: 'Just browsing' },
            ]}
          />
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <Kicker />
          <h2 style={headStyle}>What size apartment?</h2>
          <p style={hintStyle}>Pick one — you can always change your mind.</p>
          <Chips
            field="apartmentSize"
            cols={3}
            options={[
              { label: 'Studio' },
              { label: '1 Bed' },
              { label: '2 Bed' },
              { label: '3+ Bed' },
              { label: 'Not sure' },
            ]}
          />
        </>
      )
    }

    if (step === 3) {
      return (
        <>
          <Kicker />
          <h2 style={headStyle}>{"What's your budget?"}</h2>
          <p style={hintStyle}>Monthly rent, roughly. I&apos;ll find the best net price under it.</p>
          <Chips
            field="budget"
            options={[
              { label: 'Under $2,000' },
              { label: '$2,000–$2,500' },
              { label: '$2,500–$3,500' },
              { label: '$3,500+' },
            ]}
          />
        </>
      )
    }

    if (step === 4) {
      const hoods = [
        'Brickell', 'Downtown', 'Edgewater',
        'Wynwood / Midtown', 'Miami Beach', 'Open to anything',
      ]
      return (
        <>
          <Kicker />
          <h2 style={headStyle}>What neighborhood?</h2>
          <p style={hintStyle}>Pick your favorite — or let Don surprise you.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            {hoods.map(hood => {
              const sel = data.neighborhoods[0] === hood
              return (
                <button
                  key={hood}
                  onClick={() => setData(prev => ({ ...prev, neighborhoods: [hood] }))}
                  style={{
                    background: sel ? 'rgba(255,77,141,0.12)' : '#16253A',
                    border: `0.5px solid ${sel ? '#FF4D8D' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12,
                    padding: '16px 12px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: sel ? '#FF4D8D' : '#E6ECF5',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {hood}
                </button>
              )
            })}
          </div>
        </>
      )
    }

    if (step === 5) {
      return (
        <>
          <Kicker />
          <h2 style={headStyle}>{"How's your credit?"}</h2>
          <p style={hintStyle}>
            No judgment — this just helps me match you with buildings that&apos;ll say yes.
          </p>
          <Chips
            field="creditScore"
            options={[
              { label: '700+', sub: 'Excellent' },
              { label: '620–700', sub: 'Good' },
              { label: 'Below 620', sub: 'Working on it' },
              { label: 'Not sure', sub: 'No worries' },
            ]}
          />
        </>
      )
    }

    if (step === 6) {
      return (
        <>
          <Kicker />
          <h2 style={headStyle}>Pick your agent</h2>
          <p style={hintStyle}>Choose someone whose vibe matches yours.</p>
          <div style={{ marginTop: 4 }}>
            <label style={{ cursor: 'pointer', display: 'block', marginBottom: 12 }}>
              <input
                type="radio"
                name="agent"
                value="don"
                checked={data.agent === 'don'}
                onChange={() => setData(prev => ({ ...prev, agent: 'don' }))}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  background: data.agent === 'don' ? 'rgba(255,77,141,0.12)' : 'rgba(255,77,141,0.08)',
                  border: `2px solid #FF4D8D`,
                  borderRadius: 12,
                  padding: '16px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(255,77,141,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 20,
                    color: '#FF4D8D',
                    flexShrink: 0,
                  }}
                >
                  D
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 16, color: '#E6ECF5', margin: 0, marginBottom: 2 }}>
                    Don Karahan
                  </p>
                  <p style={{ fontSize: 13, color: '#8FA0B8', margin: 0, marginBottom: 4 }}>
                    Blunt. Building expert. Chess player.
                  </p>
                  <p style={{ fontSize: 12, color: '#19C6C0', margin: 0 }}>
                    @MiamiApartmentGuy
                  </p>
                </div>
              </div>
            </label>
            <div
              style={{
                background: 'rgba(25,198,192,0.08)',
                border: '2px dashed rgba(25,198,192,0.4)',
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 14, color: '#8FA0B8', margin: '0 0 6px' }}>
                We&apos;re hiring.
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#E6ECF5', margin: 0 }}>
                DM Don <span style={{ color: '#19C6C0' }}>@MiamiApartmentGuy</span>
              </p>
            </div>
          </div>
        </>
      )
    }

    if (step === 7) {
      return (
        <>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              color: '#19C6C0',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Almost done
          </div>
          <h2 style={headStyle}>Where should I send your quotes?</h2>
          <p style={hintStyle}>Real quotes from me, not a call center. No spam, ever.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              placeholder="First name"
              value={data.name}
              onChange={e => setData(prev => ({ ...prev, name: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#19C6C0')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={data.phone}
              onChange={e => setData(prev => ({ ...prev, phone: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#19C6C0')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        </>
      )
    }

    return null
  }

  const progressPct = done ? 100 : (Math.max(0, Math.min(step, totalSteps)) / totalSteps) * 100
  const isContactStep = step === totalSteps + 1
  const nextLabel = step === 0 ? "Let's go" : isContactStep ? 'Send to Don 🚀' : 'Next'

  /* ── inline style constants ── */
  const Kicker = () => (
    <div
      style={{
        fontSize: 11,
        letterSpacing: '0.1em',
        color: '#19C6C0',
        textTransform: 'uppercase' as const,
        fontWeight: 600,
        marginBottom: 8,
      }}
    >
      Move with {agentDisplayName}
    </div>
  )
  const headStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: '-0.01em',
    marginBottom: 6,
    color: '#E6ECF5',
  }
  const hintStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#8FA0B8',
    marginBottom: 20,
    lineHeight: 1.5,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#16253A',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 15,
    color: '#E6ECF5',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,8,16,0.8)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          background: '#111C2E',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Header */}
        {!done && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
              }}
            >
              <button
                onClick={back}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8FA0B8',
                  fontSize: 18,
                  cursor: 'pointer',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  visibility: step > 0 ? 'visible' : 'hidden',
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: 12, color: '#6F7F96', fontWeight: 500 }}>
                {step >= 1 && step <= totalSteps ? `${step} of ${totalSteps}` : ''}
              </span>
              <button
                onClick={handleClose}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#8FA0B8',
                  fontSize: 14,
                  cursor: 'pointer',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
            {/* Progress bar */}
            <div style={{ height: 3, background: '#16253A' }}>
              <div
                style={{
                  height: '100%',
                  background: '#FF4D8D',
                  width: `${progressPct}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </>
        )}

        {/* Body */}
        <div
          style={{
            padding: '28px 24px 24px',
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderBody()}
        </div>

        {/* Footer */}
        {!done && (
          <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button
                onClick={skip}
                style={{
                  background: 'transparent',
                  color: '#6F7F96',
                  border: 'none',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: '15px 12px',
                }}
              >
                Skip
              </button>
            )}
            <button
              onClick={next}
              disabled={!canNext() || submitting}
              style={{
                flex: 1,
                background: '#FF4D8D',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: 15,
                fontSize: 15,
                fontWeight: 700,
                cursor: canNext() && !submitting ? 'pointer' : 'default',
                opacity: canNext() && !submitting ? 1 : 0.35,
                transition: 'opacity 0.2s',
              }}
            >
              {submitting ? 'Sending…' : nextLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
