'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { sendGAEvent } from '@next/third-parties/google'
import '@/app/(home)/miami-affordability-calculator/calculator.css'
import { FROM_OPTIONS, TAX_YEAR, estimateStateTax, fromLabel } from '@/lib/state-tax'
import {
  BED_OPTIONS,
  MAX_SALARY,
  MIN_SALARY,
  bedLabel,
  buildingOptions,
  formatUsd,
  maxRentFor,
  neighborhoodSummaries,
  pickBuildingsInBudget,
  salaryBucket,
  tagFor,
  type AffordabilityDataset,
  type AffordabilityTag,
  type BedKey,
} from '@/lib/affordability'

const TAG_TEXT: Record<AffordabilityTag, string> = { affordable: 'Affordable', stretch: 'Stretch', out: 'Out of range' }
const START_BEDS_PARAM: Record<BedKey, string> = { 0: 'Studio', 1: '1', 2: '2', 3: '3+' }

interface HoodOption {
  name: string
  slug: string
}

function parseBeds(value: string | null): BedKey {
  if (value === 'studio' || value === '0') return 0
  if (value === '2') return 2
  if (value === '3') return 3
  return 1
}

function TagChip({ tag }: { tag: AffordabilityTag }) {
  return <span className={`ac-tag ac-tag-${tag}`}>{TAG_TEXT[tag]}</span>
}

export function AffordabilityCalculator({ dataset, hoods }: { dataset: AffordabilityDataset; hoods: HoodOption[] }) {
  const params = useSearchParams()

  const [salaryText, setSalaryText] = useState(() => {
    const raw = Number((params.get('salary') ?? '').replace(/[^\d]/g, ''))
    return raw >= MIN_SALARY && raw <= MAX_SALARY ? String(raw) : ''
  })
  const [from, setFrom] = useState(() => {
    const value = params.get('from') ?? ''
    return FROM_OPTIONS.some((option) => option.key === value) ? value : ''
  })
  const [beds, setBeds] = useState<BedKey>(() => parseBeds(params.get('beds')))
  const [pet, setPet] = useState(() => params.get('pet') === '1')
  const [picked, setPicked] = useState<string[]>(() => {
    const valid = new Set(hoods.map((hood) => hood.slug))
    return (params.get('hoods') ?? '')
      .split(',')
      .map((slug) => slug.trim())
      .filter((slug, index, all) => valid.has(slug) && all.indexOf(slug) === index)
  })
  const [copied, setCopied] = useState(false)

  const salary = Number(salaryText)
  const salaryValid = salary >= MIN_SALARY && salary <= MAX_SALARY
  const maxRent = salaryValid ? maxRentFor(salary) : 0

  useEffect(() => {
    const next = new URLSearchParams()
    if (salaryValid) next.set('salary', String(salary))
    if (from) next.set('from', from)
    next.set('beds', String(beds))
    next.set('pet', pet ? '1' : '0')
    if (picked.length) next.set('hoods', picked.join(','))
    window.history.replaceState(null, '', `${window.location.pathname}?${next.toString()}`)
  }, [salary, salaryValid, from, beds, pet, picked])

  const lastEvent = useRef('')
  useEffect(() => {
    if (!salaryValid || !from) return
    const payload = { salary_bucket: salaryBucket(salary), moving_from: from, beds: bedLabel(beds) }
    const key = `${payload.salary_bucket}|${from}|${beds}`
    const timer = window.setTimeout(() => {
      if (lastEvent.current === key) return
      lastEvent.current = key
      sendGAEvent('event', 'calculator_complete', payload)
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [salary, salaryValid, from, beds])

  const tax = useMemo(() => (salaryValid && from ? estimateStateTax(salary, from) : null), [salary, salaryValid, from])
  const summaries = useMemo(() => neighborhoodSummaries(dataset, beds, pet), [dataset, beds, pet])
  const options = useMemo(() => buildingOptions(dataset, beds, pet), [dataset, beds, pet])

  const pickedNames = hoods.filter((hood) => picked.includes(hood.slug)).map((hood) => hood.name)
  const scoped = picked.length ? options.filter((item) => pickedNames.includes(item.neighborhood)) : options
  const usingFallback = picked.length > 0 && scoped.length === 0
  const cards = useMemo(
    () => (salaryValid ? pickBuildingsInBudget(usingFallback ? options : scoped, maxRent, 12) : []),
    [salaryValid, usingFallback, options, scoped, maxRent],
  )

  const sortedSummaries = useMemo(() => {
    const selected = summaries.filter((item) => pickedNames.includes(item.name))
    const rest = summaries.filter((item) => !pickedNames.includes(item.name))
    return [...selected, ...rest]
  }, [summaries, pickedNames])

  const missingHoods = pickedNames.filter((name) => !summaries.some((item) => item.name === name))

  const startHref = useMemo(() => {
    const next = new URLSearchParams()
    next.set('src', 'calculator')
    if (salaryValid) next.set('budget', String(Math.floor(maxRent / 50) * 50))
    next.set('beds', START_BEDS_PARAM[beds])
    if (pickedNames.length) next.set('neighborhoods', pickedNames.join(','))
    if (from) next.set('moving_from', fromLabel(from))
    return `/start?${next.toString()}`
  }, [salaryValid, maxRent, beds, pickedNames, from])

  const togglePick = (slug: string) =>
    setPicked((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]))

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copy this link:', window.location.href)
    }
  }

  const onCtaClick = () => {
    sendGAEvent('event', 'calculator_cta_click', {
      salary_bucket: salaryValid ? salaryBucket(salary) : 'none',
      moving_from: from || 'none',
      beds: bedLabel(beds),
    })
  }

  return (
    <div>
      <form className="ac-panel" onSubmit={(event) => event.preventDefault()} aria-label="Affordability inputs">
        <div className="ac-field">
          <label className="ac-label" htmlFor="ac-salary">
            Annual gross salary
          </label>
          <input
            id="ac-salary"
            className="ac-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="$95,000"
            maxLength={12}
            value={salaryText ? `$${Number(salaryText).toLocaleString('en-US')}` : ''}
            onChange={(event) => setSalaryText(event.target.value.replace(/[^\d]/g, '').slice(0, 8))}
            aria-describedby="ac-salary-hint"
          />
          <span className="ac-hint" id="ac-salary-hint">
            Before taxes. Single filer. Minimum {formatUsd(MIN_SALARY)}.
          </span>
        </div>

        <div className="ac-field">
          <label className="ac-label" htmlFor="ac-from">
            Moving from
          </label>
          <select id="ac-from" className="ac-select" value={from} onChange={(event) => setFrom(event.target.value)}>
            <option value="">Select where you live now</option>
            {FROM_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="ac-field">
          <legend className="ac-label">Bedrooms</legend>
          <div className="ac-chips" role="radiogroup" aria-label="Bedrooms">
            {BED_OPTIONS.map((option) => (
              <label className="ac-chip" key={option.key}>
                <input type="radio" name="beds" checked={beds === option.key} onChange={() => setBeds(option.key)} />
                <span>{option.key === 0 ? 'Studio' : `${option.key} BR`}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="ac-field">
          <span className="ac-label" id="ac-pet-label">
            Pets
          </span>
          <button type="button" role="switch" aria-checked={pet} aria-labelledby="ac-pet-label" className="ac-switch" onClick={() => setPet((value) => !value)}>
            <span className="ac-switch-track" aria-hidden="true" />
            {pet ? 'I have a pet' : 'No pet'}
          </button>
        </div>

        <fieldset className="ac-field ac-span">
          <legend className="ac-label">
            Preferred neighborhoods <span className="ac-hint">(optional, pick any)</span>
          </legend>
          <div className="ac-chips">
            {hoods.map((hood) => (
              <label className="ac-chip" key={hood.slug}>
                <input type="checkbox" checked={picked.includes(hood.slug)} onChange={() => togglePick(hood.slug)} />
                <span>{hood.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>

      {!salaryValid ? (
        <p className="ac-empty" style={{ marginTop: 32 }}>
          Enter your salary above to see your Florida raise, the rent you qualify for, and the Miami neighborhoods and buildings that fit.
        </p>
      ) : (
        <div className="ac-results" aria-live="polite">
          <section aria-labelledby="ac-top-title">
            <h2 id="ac-top-title" className="ac-sr">
              Your results
            </h2>
            <div className="ac-top">
              <div className="ac-result">
                <p className="ac-kicker">Your Florida raise</p>
                {!from ? (
                  <p className="ac-sub">Choose where you are moving from to see the state income tax you would stop paying.</p>
                ) : tax && tax.total > 0 ? (
                  <>
                    <p className="ac-big">
                      {formatUsd(tax.total)}
                      <small>/year</small>
                    </p>
                    <p className="ac-sub">
                      About <strong>{formatUsd(tax.total / 12)}/month</strong> back in your paycheck. Florida has no state income tax.
                      {tax.local > 0 && ` Includes ${formatUsd(tax.state)} NY State and ${formatUsd(tax.local)} NYC resident tax.`}
                    </p>
                    <p className="ac-fine">
                      Estimate only, {TAX_YEAR} rates, single filer, standard deduction, wages only. Ignores 401(k) contributions,
                      credits and local taxes outside NYC.
                      {tax.notes.length > 0 && ` ${tax.notes.join(' ')}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="ac-big">
                      $0<small>/year</small>
                    </p>
                    <p className="ac-sub">
                      {from === 'other'
                        ? 'We do not estimate other states. If your state taxes income, moving to Florida would save you that amount.'
                        : 'Your current state has no income tax on wages, so moving to Florida does not change your state tax bill.'}
                    </p>
                  </>
                )}
              </div>

              <div className="ac-result ac-result-hero">
                <p className="ac-kicker">What you qualify for</p>
                <p className="ac-big">
                  {formatUsd(maxRent)}
                  <small>/month</small>
                </p>
                <p className="ac-sub">
                  Max rent at the 3x rule: gross monthly income of {formatUsd(salary / 12)} divided by 3. Most Miami buildings want
                  income of at least 3x the monthly rent.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="ac-hoods-title">
            <h2 id="ac-hoods-title" className="ac-h">
              Neighborhoods you can afford
            </h2>
            <p className="ac-lede">
              Median true monthly cost for a {bedLabel(beds)}
              {pet ? ' with a pet' : ''}: rent plus required monthly fees{pet ? ' and pet rent' : ''}, minus any free-rent concession
              spread over the lease. Affordable is at or under {formatUsd(maxRent)}, stretch is up to 15% over.
            </p>
            {sortedSummaries.length === 0 ? (
              <p className="ac-empty">We do not have current {bedLabel(beds)} listings to compare right now.</p>
            ) : (
              <ul className="ac-rows">
                {sortedSummaries.map((item) => {
                  const isPick = pickedNames.includes(item.name)
                  const tag = tagFor(item.medianCost, maxRent)
                  const noFees = item.feesPublishedBuildings === 0
                  return (
                    <li key={item.slug} className={`ac-row${isPick ? ' ac-row-pick' : ''}`}>
                      <div className="ac-row-head">
                        <h3 className="ac-row-name">
                          <Link href={`/neighborhoods/${item.slug}`}>{item.name}</Link>
                        </h3>
                        <span className="ac-row-cost">{formatUsd(item.medianCost)}/mo</span>
                      </div>
                      <div className="ac-row-meta">
                        <TagChip tag={tag} />
                        {isPick && <span className="ac-pick">Your pick</span>}
                        <span>
                          {item.unitCount} {item.unitCount === 1 ? 'unit' : 'units'} in {item.buildingCount}{' '}
                          {item.buildingCount === 1 ? 'building' : 'buildings'}
                        </span>
                        <span>
                          {noFees
                            ? 'Fees not published, base rent only'
                            : `Fees published for ${item.feesPublishedBuildings} of ${item.buildingCount}`}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {missingHoods.length > 0 && (
              <p className="ac-fine">
                No current {bedLabel(beds)} listings in {missingHoods.join(', ')}.
              </p>
            )}
          </section>

          <section aria-labelledby="ac-buildings-title">
            <h2 id="ac-buildings-title" className="ac-h">
              Buildings in your budget
            </h2>
            <p className="ac-lede">
              Top {cards.length || 12} {bedLabel(beds)} buildings by true monthly cost for the cheapest matching unit, cheapest first.
              {usingFallback && ' Nothing matched your picked neighborhoods, so this shows all of Miami.'}
            </p>
            {cards.length === 0 ? (
              <p className="ac-empty">
                No {bedLabel(beds)} buildings are within 15% of {formatUsd(maxRent)}/month right now. Try a studio, add a guarantor, or let Don
                look for off-market options below.
              </p>
            ) : (
              <ul className="sp-grid">
                {cards.map((card) => (
                  <li key={card.id}>
                    <Link href={`/buildings/${card.id}`} className="sp-card">
                      <div className="sp-card-img">
                        {card.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={card.image || '/placeholder.svg'} alt={`${card.name} apartment building in ${card.neighborhood}, Miami`} loading="lazy" />
                        )}
                      </div>
                      <div className="sp-card-body">
                        <h3 className="sp-card-name">{card.name}</h3>
                        <p className="sp-card-meta">{card.neighborhood}</p>
                        <p className="ac-card-cost">
                          {formatUsd(card.trueCost)}
                          <small>/mo true cost</small>
                        </p>
                        <p className="ac-card-base">
                          vs. advertised base rent <strong>{formatUsd(card.baseRent)}</strong>
                          {!card.feesPublished && ' (fees not published)'}
                        </p>
                        <div className="ac-card-row">
                          <TagChip tag={card.tag} />
                          {card.concession && <span className="ac-tag ac-tag-affordable" style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}>{card.concession}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ac-cta" aria-labelledby="ac-cta-title">
            <h2 id="ac-cta-title">Want Don to find you one? Free.</h2>
            <p>
              Don is a licensed Florida agent. Tell him your budget and he texts you a short list of buildings that fit, with current deals.
              It costs renters nothing.
            </p>
            <div className="ac-actions">
              <Link className="mh-btn mh-btn-pink" href={startHref} onClick={onCtaClick}>
                Find me an apartment
              </Link>
              <button type="button" className="mh-btn ac-ghost" onClick={copyLink}>
                {copied ? 'Link copied' : 'Copy link to my results'}
              </button>
            </div>
          </section>
        </div>
      )}
      <span className="ac-sr" role="status">
        {copied ? 'Link to your results copied to clipboard' : ''}
      </span>
    </div>
  )
}
