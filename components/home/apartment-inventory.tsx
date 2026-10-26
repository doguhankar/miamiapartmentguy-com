'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Building } from '@/lib/buildings'
import type { BuildingPricing } from '@/lib/pricing/building-pricing'
import { buildingAlt } from '@/lib/building-alt'
import { formatPrice } from '@/lib/seo'

type InventoryBuilding = {
  building: Building
  pricing: BuildingPricing | null
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function ApartmentInventory({ items }: { items: InventoryBuilding[] }) {
  const neighborhoods = useMemo(() => Array.from(new Set(items.map(({ building }) => building.neighborhood))).sort(), [items])
  const [neighborhood, setNeighborhood] = useState('All neighborhoods')
  const [bedroom, setBedroom] = useState('All bedrooms')
  const [budget, setBudget] = useState('Any budget')
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const filteredItems = useMemo(() => items.filter(({ building, pricing }) => {
    const price = pricing?.trueMonthly ?? pricing?.baseRent ?? building.priceMin
    const matchesNeighborhood = neighborhood === 'All neighborhoods' || building.neighborhood === neighborhood
    const matchesBedroom = bedroom === 'All bedrooms' || building.units.includes(bedroom)
    const matchesBudget = budget === 'Any budget' || price <= Number(budget)
    return matchesNeighborhood && matchesBedroom && matchesBudget
  }), [items, neighborhood, bedroom, budget])

  async function submitInquiry() {
    setError('')
    if (!name.trim() || phone.trim().length < 7) {
      setError('Add your name and a phone number so Don can send matches.')
      return
    }
    const selected = items.find(({ building }) => building.id === selectedBuilding)?.building
    const response = await fetch('/api/submit-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        moveDate: 'Not specified',
        budget: budget === 'Any budget' ? 'Not specified' : `$${budget}`,
        neighborhoods: neighborhood === 'All neighborhoods' ? ['Miami'] : [neighborhood],
        apartmentSize: bedroom === 'All bedrooms' ? 'Not specified' : bedroom,
        creditScore: 'Not specified',
        buildingId: selected?.id ?? null,
        buildingName: selected?.name ?? '',
        agent: 'don',
        source: 'Miami apartments SEO landing page',
      }),
    })
    if (!response.ok) {
      setError('Something went wrong. Please text Don directly.')
      return
    }
    setSent(true)
  }

  return (
    <section className="mh-inventory" aria-labelledby="inventory-title">
      <div className="mh-wrap">
        <div className="mh-shead mh-inventory-head">
          <div>
            <p className="mh-eyebrow">Live Miami apartment inventory</p>
            <h2 id="inventory-title">Miami Apartments for Rent</h2>
            <p className="mh-inventory-intro">Compare active buildings by neighborhood, bedrooms, and the real monthly cost. Required monthly fees are included; pet, parking, and other optional charges are not.</p>
          </div>
          <Link className="mh-more" href="/map">See the map →</Link>
        </div>

        <div className="mh-filters" aria-label="Apartment filters">
          <label>Neighborhood<select value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}><option>All neighborhoods</option>{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Bedrooms<select value={bedroom} onChange={(event) => setBedroom(event.target.value)}><option>All bedrooms</option><option>Studio</option><option>1B</option><option>2B</option><option>3B</option></select></label>
          <label>Monthly budget<select value={budget} onChange={(event) => setBudget(event.target.value)}><option>Any budget</option><option value="2500">Up to $2,500</option><option value="3000">Up to $3,000</option><option value="4000">Up to $4,000</option></select></label>
        </div>

        <div className="mh-inventory-grid">
          {filteredItems.map(({ building, pricing }, index) => {
            const price = pricing?.trueMonthly ?? pricing?.baseRent ?? building.priceMin
            const priceLabel = pricing?.trueMonthly ? 'true monthly' : 'starting rent'
            return (
              <article className="mh-inventory-card" key={building.id}>
                <Link href={`/buildings/${building.id}`} className="mh-inventory-image-link">
                  {building.images[0] ? <img src={building.images[0]} alt={buildingAlt(building.name, building.neighborhood)} width={640} height={420} loading={index < 4 ? 'eager' : 'lazy'} /> : <div className="mh-inventory-image-fallback">Miami apartment</div>}
                </Link>
                <div className="mh-inventory-body">
                  <div className="mh-inventory-card-top"><span className="mh-inventory-neighborhood">{building.neighborhood}</span><span className="mh-inventory-price">{money.format(price)}<small>/mo</small></span></div>
                  <h3><Link href={`/buildings/${building.id}`}>{building.name}</Link></h3>
                  <p className="mh-inventory-meta">{building.units.join(' · ')} · {building.address}</p>
                  <p className="mh-inventory-cost">{formatPrice(price)} {priceLabel}{pricing?.requiredMonthly ? ` · includes ${formatPrice(pricing.requiredMonthly)} required fees` : ''}</p>
                  {building.concession && building.concession !== 'TBD' && <p className="mh-inventory-deal">{building.concession}</p>}
                  <button type="button" className="mh-inventory-inquire" onClick={() => setSelectedBuilding(building.id)}>Ask about this building →</button>
                </div>
              </article>
            )
          })}
        </div>
        {filteredItems.length === 0 && <p className="mh-empty">No buildings match those filters. Text Don for a broader search.</p>}

        <div className="mh-inquiry" id="apartment-inquiry">
          <div><p className="mh-eyebrow">Free renter help</p><h3>Want the shortlist that fits?</h3><p>Tell Don your preferences and he’ll send honest options, current deals, and tour times.</p></div>
          {sent ? <p className="mh-inquiry-success" role="status">You&apos;re in. Don will text you shortly.</p> : <div className="mh-inquiry-form"><input aria-label="Your name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} /><input aria-label="Phone number" placeholder="Phone number" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /><button type="button" className="mh-btn mh-btn-pink" onClick={submitInquiry}>Get my matches →</button>{error && <p className="mh-form-error" role="alert">{error}</p>}</div>}
        </div>
      </div>
    </section>
  )
}
