'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  DON_SMS_HREF,
  START_BEDS,
  START_NEIGHBORHOODS,
  START_NOT_SURE,
  oneYearOutIso,
  startLeadSchema,
  todayIso,
  type StartSource,
} from '@/lib/start-lead'

type FieldErrors = Partial<Record<string, string[]>>

interface FormState {
  name: string
  phone: string
  moveDate: string
  beds: string
  budget: string
  neighborhood: string
  creditScore: string
  notes: string
  website: string
}

const INITIAL_STATE: FormState = {
  name: '',
  phone: '',
  moveDate: '',
  beds: '',
  budget: '',
  neighborhood: START_NOT_SURE,
  creditScore: '',
  notes: '',
  website: '',
}

const FIELD_ORDER = ['name', 'phone', 'moveDate', 'beds', 'budget', 'neighborhood', 'creditScore', 'notes']

const REQUIRED_MARK = (
  <span className="st-req" aria-hidden="true">
    *
  </span>
)

export type StartPrefill = Partial<Pick<FormState, 'beds' | 'budget' | 'neighborhood' | 'notes'>>

export function StartForm({
  source,
  agent,
  prefill,
}: {
  source: StartSource
  agent?: { slug: string; displayName: string; phone: string | null }
  prefill?: StartPrefill
}) {
  const [state, setState] = useState<FormState>(() => ({ ...INITIAL_STATE, ...prefill }))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const thanksRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (firstName) thanksRef.current?.focus()
  }, [firstName])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState(current => ({ ...current, [key]: value }))
    if (errors[key]) setErrors(current => ({ ...current, [key]: undefined }))
  }

  const focusFirstError = (found: FieldErrors) => {
    const key = FIELD_ORDER.find(field => found[field]?.length)
    if (!key) return
    const target = document.getElementById(`st-${key}`)
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const focusable = target?.matches('input, textarea, select') ? target : target?.querySelector<HTMLElement>('input, textarea, select')
    focusable?.focus({ preventScroll: true })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setFormError('')

    const payload = { ...state, source, agentSlug: agent?.slug }
    const parsed = startLeadSchema.safeParse(payload)
    if (!parsed.success) {
      const found = parsed.error.flatten().fieldErrors as FieldErrors
      setErrors(found)
      focusFirstError(found)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      const response = await fetch('/api/submit-start-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json().catch(() => null)) as { success?: boolean; error?: string; fieldErrors?: FieldErrors } | null

      if (response.ok && result?.success) {
        setFirstName(state.name.trim().split(/\s+/)[0])
        return
      }
      if (result?.fieldErrors) {
        setErrors(result.fieldErrors)
        focusFirstError(result.fieldErrors)
      }
      setFormError(result?.error || 'Something went wrong. Please try again or text Don directly.')
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again, or text Don directly.")
    } finally {
      setSubmitting(false)
    }
  }

  if (firstName) {
    return (
      <section className="st-thanks" aria-live="polite">
        <h1 ref={thanksRef} tabIndex={-1}>
          {`Got it, ${firstName}. I'll text you within the hour.`}
        </h1>
        <p>Keep an eye on your messages. A short list that fits is on its way.</p>
        <a className="st-btn st-btn-teal" href={agent?.phone ? `sms:${agent.phone}` : DON_SMS_HREF}>
          {agent ? `Text ${agent.displayName} now` : 'Text Don now'}
        </a>
      </section>
    )
  }

  const errorId = (key: string) => (errors[key]?.length ? `st-${key}-error` : undefined)
  const fieldError = (key: string) =>
    errors[key]?.length ? (
      <p className="st-error" id={`st-${key}-error`} role="alert">
        {errors[key]![0]}
      </p>
    ) : null

  return (
    <>
      <h1 className="st-title">Find your Miami apartment</h1>
      <p className="st-sub">{"Tell me what you're looking for. I'll text you a short list that fits."}</p>

      <form className="st-form" onSubmit={submit} noValidate>
        <p className="st-required-note">{REQUIRED_MARK} Required</p>

        <div className="st-field">
          <label className="st-label" htmlFor="st-name">Your name {REQUIRED_MARK}</label>
          <input id="st-name" className="st-input" type="text" autoComplete="name" autoCapitalize="words" enterKeyHint="next" placeholder="Jane Smith" value={state.name} onChange={event => set('name', event.target.value)} aria-required="true" aria-invalid={!!errors.name?.length} aria-describedby={errorId('name')} />
          {fieldError('name')}
        </div>

        <div className="st-field">
          <label className="st-label" htmlFor="st-phone">Phone number {REQUIRED_MARK} <span className="st-hint">(so I can text you)</span></label>
          <input id="st-phone" className="st-input" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" placeholder="(305) 555-0123" value={state.phone} onChange={event => set('phone', event.target.value)} aria-required="true" aria-invalid={!!errors.phone?.length} aria-describedby={errorId('phone')} />
          {fieldError('phone')}
        </div>

        <div className="st-field">
          <label className="st-label" htmlFor="st-moveDate">Move-in date {REQUIRED_MARK}</label>
          <input id="st-moveDate" className="st-input" type="date" min={todayIso()} max={oneYearOutIso()} value={state.moveDate} onChange={event => set('moveDate', event.target.value)} aria-required="true" aria-invalid={!!errors.moveDate?.length} aria-describedby={errorId('moveDate')} />
          {fieldError('moveDate')}
        </div>

        <fieldset className="st-field" id="st-beds">
          <legend className="st-legend">Apartment size {REQUIRED_MARK}</legend>
          <div className="st-beds" role="radiogroup" aria-label="Apartment size" aria-describedby={errorId('beds')}>
            {START_BEDS.map(option => (
              <label className="st-chip" key={option}>
                <input type="radio" name="beds" value={option} checked={state.beds === option} onChange={() => set('beds', option)} />
                <span>{option === 'Studio' ? 'Studio' : `${option} BR`}</span>
              </label>
            ))}
          </div>
          {fieldError('beds')}
        </fieldset>

        <div className="st-field">
          <label className="st-label" htmlFor="st-budget">Monthly budget {REQUIRED_MARK}</label>
          <input id="st-budget" className="st-input" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={9} placeholder="$2,500" value={state.budget ? `$${Number(state.budget).toLocaleString('en-US')}` : ''} onChange={event => set('budget', event.target.value.replace(/[^\d]/g, '').slice(0, 7))} aria-required="true" aria-invalid={!!errors.budget?.length} aria-describedby={errorId('budget')} />
          {fieldError('budget')}
        </div>

        <div className="st-field">
          <label className="st-label" htmlFor="st-neighborhood">Neighborhood <span className="st-hint">(optional)</span></label>
          <select id="st-neighborhood" className="st-input st-select" value={state.neighborhood} onChange={event => set('neighborhood', event.target.value)} aria-invalid={!!errors.neighborhood?.length} aria-describedby={errorId('neighborhood')}>
            <option value={START_NOT_SURE}>{START_NOT_SURE}</option>
            {START_NEIGHBORHOODS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {fieldError('neighborhood')}
        </div>

        <div className="st-field">
          <label className="st-label" htmlFor="st-creditScore">Credit score <span className="st-hint">(optional, 300–850)</span></label>
          <input id="st-creditScore" className="st-input" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} placeholder="720" value={state.creditScore} onChange={event => set('creditScore', event.target.value.replace(/[^\d]/g, ''))} aria-invalid={!!errors.creditScore?.length} aria-describedby={errorId('creditScore')} />
          {fieldError('creditScore')}
        </div>

        <div className="st-field">
          <label className="st-label" htmlFor="st-notes">Anything else? <span className="st-hint">(optional)</span></label>
          <textarea id="st-notes" className="st-input" rows={3} maxLength={500} placeholder="Roommates, pets, a specific building, anything that helps." value={state.notes} onChange={event => set('notes', event.target.value)} aria-invalid={!!errors.notes?.length} aria-describedby={errorId('notes')} />
          {fieldError('notes')}
        </div>

        <div className="st-trap" aria-hidden="true">
          <label htmlFor="st-website">Website</label>
          <input id="st-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={state.website} onChange={event => set('website', event.target.value)} />
        </div>

        {formError && (
          <div className="st-banner" role="alert">
            {formError} <a href={DON_SMS_HREF}>{agent ? `Text ${agent.displayName}` : 'Text Don'}</a>
          </div>
        )}

        <button className="st-btn" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send me my list'}
        </button>
        <p className="st-fine">Free for renters. No spam. I only text about apartments.</p>
      </form>
    </>
  )
}
