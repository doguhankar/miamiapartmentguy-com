'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { HomeDealsStrip } from '@/components/home-deals-strip'

const SMS_HREF = 'sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20an%20apartment%20in%20Miami'
const HOODS = ['Downtown', 'Midtown', 'Edgewater', 'Wynwood', 'Just exploring']

const REVIEWS = [
  { text: 'I had an amazing experience working with Don. He truly went above and beyond to help us find a great place to live. Consistently responsive, punctual, and on top of every detail.', name: 'Katherine B.' },
  { text: 'Do\u011fuhan gave me three options within my budget and got me concessions when possible. Found me the perfect place. Couldn\u2019t be happier.', name: 'Arismendis A.' },
  { text: 'He didn\u2019t just find us a perfect apartment \u2014 his deep expertise in Fort Lauderdale was critical. He went above and beyond at every turn.', name: 'Cody S.' },
  { text: 'Super responsive, accommodating and patient \u2014 even when our criteria changed 3x. Told us the honest truth about every location.', name: 'Nick N.' },
  { text: 'Without Do\u011fuhan I would have given up at least ten times. His patience, warmth, and dedication made all the difference. 100% recommend.', name: 'Poca W.' },
  { text: 'He immediately jumped on a luxury apartment not yet ready to show, FaceTimed us a tour, and we got the spot. Treated us like family.', name: 'Nisa A.' },
]

function Stars({ label }: { label?: string }) {
  return (
    <span
      className="mh-stars"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

export function HomePageClient({ neighborhoods, inventory }: { neighborhoods: { slug: string; name: string }[]; inventory?: ReactNode }) {
  const [activeChip, setActiveChip] = useState('Downtown')
  const [budget, setBudget] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleLeadSubmit = async () => {
    // Validation
    setSubmitError('')
    const trimmedName = fullName.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) {
      setSubmitError('Name is required')
      return
    }
    if (!trimmedPhone || trimmedPhone.length < 7) {
      setSubmitError('Phone must be at least 7 characters')
      return
    }

    setSubmitLoading(true)

    try {
      const leadData = {
        moveDate: 'Not specified',
        apartmentSize: 'Not specified',
        budget: budget || 'Not specified',
        neighborhoods: [activeChip],
        creditScore: 'Not specified',
        agent: 'don',
        name: trimmedName,
        phone: trimmedPhone,
      }

      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData?.error?.message || `Request failed with status ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Submission failed')
      }

      // Show success state
      setSubmitSuccess(true)
      setBudget('')
      setFullName('')
      setPhone('')

      // Reset success state after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setSubmitError(errorMsg)
      console.error('[MAG] Lead submission failed:', err)
    } finally {
      setSubmitLoading(false)
    }
  }

  const formLocked = submitLoading || submitSuccess

  return (
    <>
      <nav className="mh-nav" aria-label="Primary">
        <div className="mh-wrap mh-nav-in">
          <Link href="/" className="mh-logo">
            MAG<span className="mh-pink">.</span>
          </Link>
          <div className="mh-nav-links">
            <Link href="/blog">Guides</Link>
 <Link href="/join-team">Join the Team</Link>
            <a href="https://miamiapartmentguy.com/agent">Agent Login</a>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <header className="mh-hero">
          <div className="mh-wrap mh-hero-grid">
            <div>
              <div className="mh-eyebrow">Miami Real Estate Advisor · 305 International</div>
              <h1>
                Miami apartments,
                <br />
                <span className="mh-pink">the right way.</span>
              </h1>
              <p className="mh-sub">Real prices, real deals, real locator. Skip the BS.</p>
              <div className="mh-live">
                <span className="mh-dot" aria-hidden="true" /> Responds in minutes
              </div>
              <div className="mh-cta-row">
                <a className="mh-btn mh-btn-pink" href={SMS_HREF}>
                  Text Don now
                </a>
                <Link className="mh-btn mh-btn-teal" href="/map">
                  Browse the Map &rarr;
                </Link>
              </div>
              <div className="mh-find">
                <span className="mh-find-label">FIND ME</span>
                <a className="mh-soc" href="https://wa.me/14077657306" title="WhatsApp" aria-label="WhatsApp">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.89-1.25-4.78-4.15-4.93-4.34-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.15.12.32.02.51-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.13.57.16.28.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.22 1.36.28.14.44.12.61-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.1 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.17 1.36z" /></svg>
                </a>
                <a className="mh-soc" href="https://instagram.com/miamiapartmentguy" title="Instagram" aria-label="Instagram">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07c-4.35.2-6.78 2.62-6.98 6.98C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8zm6.41-10.85a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" /></svg>
                </a>
                <a className="mh-soc" href="https://tiktok.com/@themiamiapartmentguy" title="TikTok" aria-label="TikTok">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                </a>
                <a className="mh-soc" href="mailto:don@miamiapartmentguy.com" title="Email" aria-label="Email">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg>
                </a>
              </div>
            </div>

            <div className="mh-photo">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC05137.JPG-aqGnZwibx0gzkFcqxI5lVtHjEFZVAY.jpeg"
                alt="Don Karahan, Miami apartment locator"
              />
              <div className="mh-sticker">Free for renters</div>
              <div className="mh-plate">
                <div className="mh-plate-name">Don Karahan</div>
                <div className="mh-plate-role">Miami Apartment Locator</div>
              </div>
            </div>
          </div>
        </header>

        {/* TRUST + SOCIAL PROOF */}
        <section className="mh-trust" aria-label="Why renters trust MAG">
          <div className="mh-wrap">
            <div className="mh-trust-in">
              <span><b>10,000+</b> apartments in South Florida</span>
              <span className="mh-trust-sep" aria-hidden="true">·</span>
              <span><b>100%</b> free locating help</span>
              <span className="mh-trust-sep" aria-hidden="true">·</span>
              <span>Pick your agent</span>
            </div>
            <div className="mh-proof">
              131 buildings tracked · 10,000+ units · <span className="mh-proof-live">updated daily</span>
            </div>
          </div>
        </section>

        {/* THIS WEEK'S DEALS */}
        <HomeDealsStrip />

        {/* THE REAL COST */}
        <section className="mh-truecost" aria-labelledby="mh-truecost-title">
          <div className="mh-wrap mh-truecost-in">
            <h2 id="mh-truecost-title">
              We show you the real monthly cost.
              <br />
              <span className="mh-teal">Nobody else in Miami does.</span>
            </h2>
            <p>Base rent plus every fee — amenity, pest, pet — before you ever tour. No surprises on move-in day.</p>
            <div className="mh-ex">
              <span className="mh-ex-tag">MIRO BRICKELL</span>
              <span className="mh-ex-was">$2,340 rent</span>
              <span className="mh-ex-arrow" aria-hidden="true">&rarr;</span>
              <span className="mh-ex-now">$2,447 true monthly</span>
            </div>
          </div>
        </section>

        {/* QUIZ ENTRY */}
        <section className="mh-wrap mh-quiz" aria-labelledby="mh-quiz-title">
          <div className="mh-quiz-card">
            <div>
              <h2 id="mh-quiz-title">Not sure where to live?</h2>
              <p>Find your Miami match in 60 seconds — budget, vibe, and move-in date.</p>
            </div>
            <Link className="mh-btn mh-btn-pink" href="/quiz">
              Take the quiz &rarr;
            </Link>
          </div>
        </section>

        {/* LEAD FORM */}
        <section className="mh-lead" aria-labelledby="mh-lead-title">
          <div className="mh-wrap mh-lead-in">
            <h2 id="mh-lead-title">Your Move Starts Here</h2>
            <div className="mh-lead-label">I&apos;m looking to rent in</div>
            <div className="mh-hoods">
              {HOODS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="mh-chip"
                  aria-pressed={activeChip === chip}
                  onClick={() => setActiveChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="mh-form-row">
              <input className="mh-field" type="text" placeholder="Budget" aria-label="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} disabled={formLocked} />
              <input className="mh-field" type="text" placeholder="Full name" aria-label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={formLocked} />
              <input className="mh-field" type="tel" placeholder="Phone (so I can text you options)" aria-label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={formLocked} />
              <button type="button" className="mh-btn mh-btn-pink" onClick={handleLeadSubmit} disabled={formLocked}>
                {submitSuccess ? 'Sent! Don will text you shortly' : submitLoading ? 'Sending...' : 'Get my matches \u2192'}
              </button>
            </div>
            {submitError && (
              <div className="mh-form-error" role="alert">
                {submitError}
              </div>
            )}
          </div>
        </section>

        {/* GOOGLE REVIEWS + TESTIMONIALS */}
        <section className="mh-wrap mh-reviews" aria-labelledby="mh-reviews-title">
          <a className="mh-gchip" href="https://share.google/Cknw6EKycHwFY381b" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.12A12 12 0 0 0 12 24z" /><path fill="#FBBC05" d="M5.27 14.26a7.2 7.2 0 0 1 0-4.52V6.62H1.27a12 12 0 0 0 0 10.76l4-3.12z" /><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.12C6.22 6.86 8.87 4.75 12 4.75z" /></svg>
            <Stars />
            <b>5.0</b> · 16 Google reviews
          </a>
          <span className="mh-reviews-hint">Tap to read on Google</span>
          <h2 id="mh-reviews-title" className="mh-reviews-title">What clients say</h2>

          <div className="mh-track">
            <div className="mh-track-inner">
              {[...REVIEWS, ...REVIEWS].map((r, i) => (
                <figure key={i} className="mh-tcard" aria-hidden={i >= REVIEWS.length}>
                  <Stars label="5 out of 5 stars" />
                  <p>&ldquo;{r.text}&rdquo;</p>
                  <figcaption className="mh-tcard-who">{r.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
        {inventory}
      </main>

      <footer className="mh-footer">
        <nav className="mh-wrap mh-footer-nav" aria-label="Miami apartments by neighborhood">
          <Link href="/miami-apartment-locator">Miami apartment locator</Link>
          <Link href="/miami-affordability-calculator">Can I afford Miami? Rent calculator</Link>
          <Link href="/map">Apartment map</Link>
          {neighborhoods.map((hood) => (
            <Link key={hood.slug} href={`/neighborhoods/${hood.slug}`}>
              {hood.name} apartments
            </Link>
          ))}
        </nav>
        <div className="mh-wrap mh-footer-in">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="Equal Housing Opportunity" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="22" height="22" rx="2" stroke="#6e6e7e" strokeWidth="1.4" />
            <path d="M12 5L5 10.5V19H9.5V14H14.5V19H19V10.5L12 5Z" fill="#6e6e7e" />
          </svg>
          <div>
            Don Karahan · FL Real Estate License #SL3581300 · Casa Locators / 305 International Realty · Miami-Dade &amp; Broward
            <br />
            Equal Housing Opportunity
          </div>
        </div>
      </footer>
    </>
  )
}
