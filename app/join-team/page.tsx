'use client'

import { FormEvent, useState } from 'react'
import styles from './join-team.module.css'

const tickerItems = [
  'SALES TAKE MONTHS · RENTALS TAKE DAYS',
  'FIRST TEXT WINS · SHOW UP SAME DAY, CLOSE SAME WEEK',
  "EVERY TOUR PAYS TWICE · $99/MO DESK FEE. THAT'S IT.",
]

const loopItems = [
  ['01 — CONTENT', 'Generate', 'Walkthroughs, buildings, the city. Posted daily across TikTok, IG, and Marketplace.'],
  ['02 — LEADS', 'Match', 'Followers become conversations. 10–15 a day. We filter the tire kickers.'],
  ['03 — TOURS', 'Tour', '7–8 a week. Filmed with the client when they\'re game. Camera rolling.'],
  ['04 — DEALS', 'Close', 'Placements close. The footage feeds the next cycle.'],
] as const

const pillars = [
  ['01 — PIPELINE', 'Leads on day one', <>Inbound from content we&apos;re already running. <b>You don&apos;t buy them. You don&apos;t wait for them.</b> You work them.</>],
  ['02 — SYSTEMS', 'A tested playbook', <>Profiles, matching, building intel. Weekly team calls with real leads, real scenarios, <b>out loud.</b></>],
  ['03 — BRAND', 'Your face on the site', <>Renters choose their agent on miamiapartmentguy.com. <b>You get camera training and the gear.</b> We show you the format.</>],
] as const

const dayItems = [
  ['9 AM', 'Pipeline check', <>Overnight DMs answered before coffee gets cold.</>],
  ['11 AM', 'Outreach block', <>10–15 real conversations. <b>Not blasts — conversations.</b></>],
  ['1 PM', 'Tours', <>Camera rolling. Client on film if they&apos;re up for it.</>],
  ['4 PM', 'Paperwork', <>Applications, follow-up, leasing agent calls.</>],
  ['7 PM', 'Post', <>Today&apos;s footage goes out. <b>That&apos;s tomorrow&apos;s pipeline.</b></>],
] as const

const faqs = [
  ['Do I need experience?', <>It helps. It&apos;s not required. <b>Comfort on camera and work ethic matter more.</b></>],
  ['Do I pay for leads?', <>No. Company leads come free — you just split 60/40 on those.</>],
  ['Do I have to make content?', <>Yes. It&apos;s the lead source, not a side task. <b>We train you and give you the gear.</b></>],
  ['Can I keep my own clients?', <>Yes. Your book stays your book. Personal leads pay 80/20.</>],
  ['Is this full-time?', <>It&apos;s commission-only. <b>Part-time effort gets part-time results.</b> Treat it like a business.</>],
  ['How fast can I start?', <>Once your license is hung and onboarding&apos;s done — <b>usually within the week.</b></>],
] as const

export default function JoinTeamPage() {
  const [licensed, setLicensed] = useState<'Yes' | 'Not yet'>('Yes')
  const [form, setForm] = useState({ name: '', phone: '', brokerage: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setStatus('submitting')
    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          brokerage: form.brokerage.trim(),
          licensed,
          source: 'agent_recruit',
          moveDate: 'Agent recruitment',
          apartmentSize: form.brokerage.trim() || 'Not provided',
          budget: 'N/A',
          neighborhoods: ['South Florida'],
          creditScore: licensed,
          agent: 'Join the Team page',
        }),
      })
      if (!response.ok) throw new Error('Submission failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className={styles.page}>
      <nav className={styles.topnav}>
        <div className={styles.topnavInner}>
          <a href="/" className={styles.logo}>MAG<span className={styles.logoDot}>™</span></a>
          <a href="/map" className={styles.navBack}>← back to map</a>
        </div>
      </nav>

      <div className={styles.tickerWrap} aria-hidden="true">
        <div className={styles.ticker}>{[...tickerItems, ...tickerItems].map((item, index) => <span className={styles.tickItem} key={`${item}-${index}`}>{item}</span>)}</div>
      </div>

      <section className={styles.hero}>
        <div className={styles.eyebrow}><span className={styles.eyebrowDot} /> NOW RECRUITING — MIAMI / SOUTH FLORIDA</div>
        <h1>Sales take months.<br /><span className={styles.accent}>Rentals take days.</span></h1>
        <p className={styles.sub}>Miami&apos;s content-first apartment locating team. <b>Built on speed, relationships, and results.</b> The pipeline is built, not bought.</p>
        <div className={styles.ctaRow}><a href="#apply" className={styles.btnPink}>Apply now →</a><a href="#how" className={styles.btnGhost}>See how it works ↓</a></div>
      </section>

      <div className={styles.statsStrip}><div className={styles.statsInner}>{[['118', 'Buildings mapped'], ['$2,500+', 'Avg placement fee'], ['7–8', 'Tours per week'], ['$99', 'Monthly desk fee']].map(([value, label]) => <div className={styles.stat} key={label}><div className={styles.statVal}>{value}</div><div className={styles.statLabel}>{label}</div></div>)}</div></div>

      <section className={styles.section} id="how"><div className={styles.sectionLabel}>How it works</div><div className={styles.loopGrid}>{loopItems.map(([number, title, description], index) => <div className={styles.loopCell} key={number}><div className={styles.loopNum}>{number}</div><div className={styles.loopTitle}>{title}</div><div className={styles.loopDesc}>{description}{index === 3 && <><span> </span><b>Every tour pays twice.</b></>}</div>{index < 3 && <div className={styles.loopArrow}>→</div>}</div>)}</div><p className={styles.loopNote}>Content isn&apos;t marketing on top of the job — <b>it is the lead source.</b></p></section>

      <section className={styles.section}><div className={styles.sectionLabel}>What you get</div><div className={styles.pillarsGrid}>{pillars.map(([number, title, copy]) => <div className={styles.pillarCard} key={number}><div className={styles.pillarNum}>{number}</div><h3>{title}</h3><p>{copy}</p></div>)}</div></section>

      <section className={styles.section}><div className={styles.sectionLabel}>A day at MAG</div><div className={styles.dayPanel}>{dayItems.map(([time, label, copy]) => <div className={styles.dayRow} key={time}><div className={styles.dayTime}>{time}</div><div><div className={styles.dayLabel}>{label}</div><div className={styles.dayDesc}>{copy}</div></div></div>)}</div></section>

      <section className={styles.section}><div className={styles.sectionLabel}>The math</div><div className={styles.mathPanel}><div><div className={styles.mathTag}>Average month · 5 placements</div><div className={styles.mathBig}>$12,500</div><p className={styles.mathDesc}>Average Miami placement is around <b>$2,500</b>. Close five in a month and that&apos;s $12,500 on the board.<br /><br />No tiers, no GCI thresholds, no resets. <b>The split you start on is the split you keep.</b></p></div><div className={styles.mathRight}>{[['Company leads', 'You keep', '60%'], ['Personal leads', 'You keep', '80%'], ['Monthly desk fee', 'No franchise fees', '$99.99']].map(([label, sublabel, value], index) => <div className={styles.splitRow} key={label}><div className={styles.splitLabel}><b>{label}</b>{sublabel}</div><div className={index === 2 ? styles.splitFee : styles.splitVal}>{value}</div></div>)}</div></div></section>

      <section className={styles.section}><div className={styles.sectionLabel}>Questions</div><div className={styles.faqGrid}>{faqs.map(([question, answer]) => <div className={styles.faqItem} key={question}><div className={styles.faqQ}>{question}</div><div className={styles.faqA}>{answer}</div></div>)}</div></section>

      <section className={styles.closing} id="apply"><div className={styles.closingPanel}><h2>We&apos;re not building a brokerage.<br /><span className={styles.accent}>We&apos;re building a team worth joining.</span></h2><p>One conversation. Bring every question you&apos;ve got — <b>including the uncomfortable ones.</b></p><form className={styles.formWrap} onSubmit={submit}><div className={styles.formGrid}><input required className={styles.field} type="text" placeholder="Your name" aria-label="Your name" value={form.name} onChange={(event) => update('name', event.target.value)} /><input required className={styles.field} type="tel" placeholder="Phone number" aria-label="Phone number" value={form.phone} onChange={(event) => update('phone', event.target.value)} /><input className={`${styles.field} ${styles.full}`} type="text" placeholder="Current brokerage (or 'none')" aria-label="Current brokerage" value={form.brokerage} onChange={(event) => update('brokerage', event.target.value)} /></div><div className={styles.licensedLabel}>Licensed in Florida?</div><div className={styles.toggleRow}>{(['Yes', 'Not yet'] as const).map((choice) => <button type="button" className={`${styles.toggleBtn} ${licensed === choice ? styles.active : ''}`} key={choice} onClick={() => setLicensed(choice)}>{choice}</button>)}</div><button className={styles.submitBtn} type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Sending…' : status === 'success' ? 'We\'ll be in touch →' : 'Let\'s chat →'}</button>{status === 'success' && <p className={styles.formMessage}>Thanks — Don will text you within 24 hours.</p>}{status === 'error' && <p className={styles.formError}>Something went wrong. Please try again.</p>}<div className={styles.formFine}>Don will text you within 24 hours · No spam · No pressure<br />Don Karahan · FL #SL3581300 · 305 International Realty</div></form></div></section>

      <footer className={styles.footer}><div className={styles.footerText}>Miami Apartment Guy™ · Don Karahan · FL Real Estate License #SL3581300<br />Casa Locators / 305 International Realty · Miami-Dade &amp; Broward · Equal Housing Opportunity</div></footer>
    </main>
  )
}
