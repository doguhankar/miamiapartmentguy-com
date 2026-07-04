'use client'

import React from 'react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const INK      = '#0B1220'
const PANEL    = '#0F1B30'
const PANEL2   = '#152341'
const AQUA     = '#19C6C0'
const FLAMINGO = '#FF4D8D'
const SUN      = '#FFC24B'
const LINE     = 'rgba(255,255,255,.12)'
const PAPER    = '#F6F8F9'
const MUTED    = '#B8C4D4'
const DIM      = '#7E8CA0'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-archivo, "Archivo", sans-serif)',
  fontVariationSettings: "'wdth' 120",
  fontWeight: 900,
  letterSpacing: '-0.01em',
  textTransform: 'uppercase',
}

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '0 24px',
}

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: AQUA,
  fontWeight: 700,
}

// ─── Hover link helper ────────────────────────────────────────────────────────
function HoverLink({ href, style, hoverStyle, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { hoverStyle?: React.CSSProperties }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <a
      href={href}
      style={{ ...style, ...(hovered ? hoverStyle : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...rest}
    >
      {children}
    </a>
  )
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const segment = (
    <>
      <b style={{ color: INK, margin: '0 6px' }}>LIVE</b>
      {' '}Flow Brickell — 1BD from $2,650 · 2 months free
      <span style={{ margin: '0 14px' }}>✦</span>
      <b style={{ color: INK, margin: '0 6px' }}>LIVE</b>
      {' '}Edgewater — Studios from $2,100 · waived admin
      <span style={{ margin: '0 14px' }}>✦</span>
      <b style={{ color: INK, margin: '0 6px' }}>LIVE</b>
      {' '}Wynwood — 2BD from $3,400 · 6 weeks free
      <span style={{ margin: '0 14px' }}>✦</span>
      <b style={{ color: INK, margin: '0 6px' }}>LIVE</b>
      {' '}Downtown — 1BD from $2,350 · $1,000 off first month
      <span style={{ margin: '0 32px' }} />
    </>
  )
  return (
    <div
      aria-hidden="true"
      style={{
        background: FLAMINGO,
        color: '#fff',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
      }}
    >
      <div className="mag-ticker-track" style={{ padding: '9px 0' }}>
        {segment}{segment}
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const navLinks = [
  ['#how',     'How it works'],
  ['#hoods',   'Neighborhoods'],
  ['#why',     'Why MAG'],
  ['#reviews', 'Wins'],
] as const

function Nav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(11,18,32,.85)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${LINE}`,
    }}>
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        <a href="#" style={{ ...DISPLAY, fontVariationSettings: "'wdth' 125", fontSize: 20, color: PAPER, textDecoration: 'none' }}>
          MIAMI APARTMENT <span style={{ color: FLAMINGO }}>GUY</span>™
        </a>

        <div className="mag-nav-links" style={{ display: 'flex', gap: 28, fontSize: 14, fontWeight: 500 }}>
          {navLinks.map(([href, label]) => (
            <HoverLink key={href} href={href} style={{ color: PAPER, textDecoration: 'none' }} hoverStyle={{ color: AQUA }}>
              {label}
            </HoverLink>
          ))}
        </div>

        <HoverLink
          href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 24px', borderRadius: 999,
            fontWeight: 700, fontSize: 15,
            background: FLAMINGO, color: '#fff',
            boxShadow: '0 6px 28px rgba(255,77,141,.4)',
            textDecoration: 'none', transition: 'transform .15s',
          }}
          hoverStyle={{ transform: 'translateY(-2px)' }}
        >
          💬 Text Don
        </HoverLink>
      </div>
    </nav>
  )
}

// ─── Phone mockup ─────────────────────────────────────────────────────────────
const quoteRows: [string, string, string][] = [
  ['Gross rent',   '$2,950/mo',  PAPER],
  ['Concession',   '2 months free', PAPER],
  ['Net effective','$2,458/mo',  AQUA],
  ['Move-in costs','$1,250 total', PAPER],
]

function PhoneMock() {
  return (
    <div aria-label="Example text conversation with Don" style={{
      background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28,
      padding: 22, boxShadow: '0 30px 80px rgba(0,0,0,.5)',
      maxWidth: 380, marginLeft: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${LINE}`, marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: `linear-gradient(135deg,${FLAMINGO},${SUN})`,
          display: 'grid', placeItems: 'center', flexShrink: 0,
          fontFamily: 'var(--font-archivo,"Archivo",sans-serif)', fontWeight: 900, fontSize: 13,
        }}>MAG</div>
        <div>
          <strong style={{ fontSize: 14 }}>Don · Miami Apartment Guy</strong>
          <small style={{ display: 'block', color: DIM, fontSize: 11 }}>Typically replies in minutes</small>
        </div>
      </div>

      {/* Outgoing */}
      <Bubble out>Hey! Looking for a 1BD in Brickell, budget around $2,800. Moving in August 🙏</Bubble>

      {/* Incoming */}
      <Bubble>Say less. Pulling live pricing now — you&apos;re going to like what Flow is running this month 👀</Bubble>

      {/* Quote card bubble */}
      <Bubble>
        <div style={{
          background: `linear-gradient(160deg,${PANEL2},${PANEL})`,
          border: `1px solid rgba(25,198,192,.4)`,
          borderRadius: 14, padding: 14, fontSize: 13,
        }}>
          <div style={{ ...DISPLAY, fontVariationSettings: "'wdth' 115", fontSize: 13, color: SUN, marginBottom: 8 }}>
            Flow Brickell · 1BD/1BA · 705 sqft
          </div>
          {quoteRows.map(([label, val, col]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: MUTED }}>
              <span>{label}</span>
              <b style={{ color: col }}>{val}</b>
            </div>
          ))}
        </div>
      </Bubble>

      <Bubble>Touring slots open Sat 11am. Want me to lock one?</Bubble>
    </div>
  )
}

function Bubble({ children, out }: { children: React.ReactNode; out?: boolean }) {
  return (
    <div style={{
      maxWidth: '85%', padding: '11px 14px',
      borderRadius: 16,
      ...(out
        ? { borderBottomRightRadius: 4, background: AQUA, color: INK, fontWeight: 500, marginLeft: 'auto' }
        : { borderBottomLeftRadius: 4, background: '#1B2A45' }),
      fontSize: 14, marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <header style={{ position: 'relative', padding: '90px 0 70px', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(700px 420px at 85% 0%,rgba(255,77,141,.22),transparent 60%),
                     radial-gradient(600px 400px at 0% 100%,rgba(25,198,192,.18),transparent 60%)`,
      }} />
      <div style={{ ...wrap, position: 'relative', display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 56, alignItems: 'center' }} className="mag-hero-inner">
        <div>
          <div style={eyebrow}>Free for renters · Paid by the buildings</div>

          <h1 style={{ ...DISPLAY, fontSize: 'clamp(44px,6.4vw,84px)', lineHeight: .95, margin: '18px 0 22px' }}>
            Every building.<br />
            Every deal.<br />
            <span style={{ color: FLAMINGO }}>One</span>{' '}
            <span style={{ color: AQUA }}>text.</span>
          </h1>

          <p style={{ fontSize: 19, color: MUTED, maxWidth: '52ch', marginBottom: 32, lineHeight: 1.55 }}>
            {"Miami's rental market moves fast and hides its best concessions. I track live pricing across 108+ buildings from Brickell to Edgewater — you tell me your budget, I send you the real numbers. Net effective rent, move-in costs, everything. Same day."}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <HoverLink
              href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 999, fontWeight: 700, fontSize: 15, background: FLAMINGO, color: '#fff', boxShadow: '0 6px 28px rgba(255,77,141,.4)', textDecoration: 'none', transition: 'transform .15s' }}
              hoverStyle={{ transform: 'translateY(-2px)' }}
            >
              💬 Text me your budget
            </HoverLink>
            <HoverLink
              href="#hoods"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 999, fontWeight: 700, fontSize: 15, border: `1px solid ${LINE}`, color: PAPER, background: 'transparent', textDecoration: 'none', transition: 'transform .15s, border-color .15s, color .15s' }}
              hoverStyle={{ borderColor: AQUA, color: AQUA }}
            >
              Browse the map →
            </HoverLink>
          </div>

          <div style={{ fontSize: 13, color: DIM, marginTop: 14 }}>
            No fees. No spam. No &quot;create an account to see prices.&quot; Ever.
          </div>
        </div>

        <PhoneMock />
      </div>
    </header>
  )
}

// ─── Proof bar ────────────────────────────────────────────────────────────────
const proofStats: [string, string][] = [
  ['108+', 'Buildings tracked'],
  ['$0',   'Cost to you'],
  ['24h',  'Budget → quotes'],
  ['100%', 'Real net pricing'],
]

function ProofBar() {
  return (
    <div style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: '28px 0' }}>
      <div style={{ ...wrap, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }} className="mag-proof-grid">
        {proofStats.map(([num, lbl]) => (
          <div key={lbl}>
            <div style={{ ...DISPLAY, fontSize: 34, color: SUN, marginBottom: 4 }}>{num}</div>
            <div style={{ fontSize: 13, color: DIM, textTransform: 'uppercase', letterSpacing: '.12em' }}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
const steps = [
  { tag: 'Step 1', icon: '💬', title: 'Text your budget',  body: "One message: budget, beds, neighborhoods, move date. That's the whole application." },
  { tag: 'Step 2', icon: '📋', title: 'Get real quotes',   body: 'I send formatted quotes with gross rent, concessions, net effective rent, and total move-in cost — straight from my building contacts.' },
  { tag: 'Step 3', icon: '🔑', title: 'Tour & sign',       body: 'I book your tours, negotiate the deal, and walk you to the lease. The building pays me. You pay nothing.' },
]

function HowItWorks() {
  const [hovered, setHovered] = React.useState<number | null>(null)
  return (
    <section id="how" style={{ padding: '88px 0' }}>
      <div style={wrap}>
        <div style={eyebrow}>How it works</div>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(30px,4vw,48px)', margin: '12px 0 16px' }}>Three steps. Zero portals.</h2>
        <p style={{ color: MUTED, fontSize: 17, maxWidth: '60ch', lineHeight: 1.55 }}>
          Other sites make you fill out a four-page form to see a price. Here&apos;s the entire process:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 48 }} className="mag-steps">
          {steps.map((s, i) => (
            <div
              key={s.tag}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: PANEL,
                border: `1px solid ${hovered === i ? AQUA : LINE}`,
                borderRadius: 20, padding: '32px 28px',
                position: 'relative', transition: 'border-color .2s',
              }}
            >
              <span style={{ position: 'absolute', top: 22, right: 22, fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: FLAMINGO, textTransform: 'uppercase' }}>{s.tag}</span>
              <div style={{ fontSize: 30, marginBottom: 16 }}>{s.icon}</div>
              <h3 style={{ ...DISPLAY, fontVariationSettings: "'wdth' 115", fontSize: 18, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Neighborhoods ────────────────────────────────────────────────────────────
const hoods = [
  { name: 'Brickell',      sub: 'High-rise living · from $2,300', grad: 'linear-gradient(135deg,#1B3B6F,#19C6C0)' },
  { name: 'Wynwood',       sub: 'Art & nightlife · from $2,200',  grad: 'linear-gradient(135deg,#FF4D8D,#FF8E53)' },
  { name: 'Edgewater',     sub: 'Bay views · from $2,100',        grad: 'linear-gradient(135deg,#3E2F8F,#FF4D8D)' },
  { name: 'Downtown',      sub: 'Walk everywhere · from $2,000',  grad: 'linear-gradient(135deg,#0E5E6F,#FFC24B)' },
  { name: 'Midtown',       sub: 'Best of both · from $2,250',     grad: 'linear-gradient(135deg,#233A7D,#8E54E9)' },
  { name: 'Coconut Grove', sub: 'Lush & quiet · from $2,400',     grad: 'linear-gradient(135deg,#FF6B6B,#FFC24B)' },
  { name: 'Coral Gables',  sub: 'Classic Miami · from $2,300',    grad: 'linear-gradient(135deg,#11998E,#38EF7D)' },
  { name: 'Miami Beach',   sub: 'Ocean life · from $2,200',       grad: 'linear-gradient(135deg,#FC5C7D,#6A82FB)' },
]

function Neighborhoods() {
  const [hovered, setHovered] = React.useState<number | null>(null)
  return (
    <section id="hoods" style={{ paddingBottom: 88 }}>
      <div style={wrap}>
        <div style={eyebrow}>Neighborhoods</div>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(30px,4vw,48px)', margin: '12px 0 44px' }}>Where do you want to wake up?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="mag-hoods">
          {hoods.map((h, i) => (
            <a
              key={h.name}
              href="#"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative', borderRadius: 18, overflow: 'hidden',
                aspectRatio: '4/5', display: 'flex', alignItems: 'flex-end',
                padding: 20, border: `1px solid ${LINE}`,
                background: h.grad, textDecoration: 'none', color: PAPER,
                transform: hovered === i ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'transform .2s',
              }}
            >
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 30%,rgba(11,18,32,.92))' }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{ ...DISPLAY, fontVariationSettings: "'wdth' 118", fontSize: 19 }}>{h.name}</h3>
                <small style={{ color: '#D7E2EE', fontSize: 12 }}>{h.sub}</small>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Why MAG ──────────────────────────────────────────────────────────────────
const themItems = [
  "❌ Show 10–30% of what's actually available",
  '❌ Stale pricing, no concessions shown',
  '❌ Your info sold to a call-center funnel',
  '❌ You do all the legwork yourself',
]
const usItems = [
  '✅ Live pricing across 108+ buildings, updated daily',
  '✅ Net effective rent — the real number after concessions',
  '✅ One human. My number. Straight answers.',
  '✅ I negotiate, book tours, and chase the paperwork',
]

function WhyMag() {
  return (
    <section id="why" style={{ padding: '88px 0', background: PAPER, color: INK }}>
      <div style={wrap}>
        <div style={{ ...eyebrow, color: '#C2185B' }}>Why MAG™</div>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(30px,4vw,48px)', margin: '12px 0 16px', color: INK }}>
          Listing sites show you ads.<br />I show you deals.
        </h2>
        <p style={{ color: '#44506A', fontSize: 17, maxWidth: '60ch', lineHeight: 1.55 }}>
          The big rental sites list whatever buildings pay them to promote. I track the whole market and I only win when you sign somewhere you love.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 44 }} className="mag-compare">
          {/* Them */}
          <div style={{ background: '#E9EDF2', borderRadius: 20, padding: 34, color: '#44506A' }}>
            <h3 style={{ ...DISPLAY, fontVariationSettings: "'wdth' 115", fontSize: 20, color: INK }}>The big listing sites</h3>
            <ul style={{ listStyle: 'none', marginTop: 18 }}>
              {themItems.map(item => (
                <li key={item} style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,.08)', fontSize: 15, display: 'flex', gap: 10 }}>{item}</li>
              ))}
            </ul>
          </div>
          {/* Us */}
          <div style={{ background: INK, color: PAPER, borderRadius: 20, padding: 34, boxShadow: '0 24px 60px rgba(11,18,32,.35)' }}>
            <h3 style={{ ...DISPLAY, fontVariationSettings: "'wdth' 115", fontSize: 20 }}>
              Miami Apartment <span style={{ color: FLAMINGO }}>Guy™</span>
            </h3>
            <ul style={{ listStyle: 'none', marginTop: 18 }}>
              {usItems.map(item => (
                <li key={item} style={{ padding: '10px 0', borderBottom: `1px solid ${LINE}`, fontSize: 15, display: 'flex', gap: 10 }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
const reviews = [
  { quote: '"Texted Don a budget at 9pm, had five quotes with net pricing by morning. Signed at Flow with two months free I never would have found on my own."', name: 'Jessica M.', loc: 'Brickell',  initials: 'JM', bg: AQUA,     fg: INK   },
  { quote: '"Relocated from NYC sight unseen. Don FaceTimed me through three tours and negotiated my admin fee to zero. Didn\'t pay him a dime."',               name: 'Carlos R.', loc: 'Edgewater', initials: 'CR', bg: FLAMINGO, fg: '#fff' },
  { quote: '"Every other \'locator\' sent me a Zillow link. Don sent me a quote sheet with move-in costs down to the dollar. Different level."',                 name: 'Aaliyah T.',loc: 'Wynwood',   initials: 'AT', bg: SUN,      fg: INK   },
]

function Reviews() {
  return (
    <section id="reviews" style={{ padding: '88px 0' }}>
      <div style={wrap}>
        <div style={eyebrow}>Recent wins</div>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(30px,4vw,48px)', margin: '12px 0 44px' }}>Renters keep the receipts.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="mag-reviews">
          {reviews.map(r => (
            <div key={r.name} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: 26 }}>
              <div style={{ color: SUN, letterSpacing: 2, marginBottom: 12, fontSize: 16 }}>★★★★★</div>
              <p style={{ fontSize: 15, color: '#C9D4E2', marginBottom: 16, lineHeight: 1.55 }}>{r.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: r.bg, color: r.fg,
                  display: 'grid', placeItems: 'center',
                  fontSize: 12, fontWeight: 900, flexShrink: 0,
                  fontFamily: 'var(--font-archivo,"Archivo",sans-serif)',
                }}>
                  {r.initials}
                </div>
                {r.name} <span style={{ color: DIM, fontWeight: 400 }}>· {r.loc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: '88px 0', position: 'relative', textAlign: 'center', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(600px 340px at 50% 100%,rgba(255,77,141,.28),transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ ...wrap, position: 'relative' }}>
        <div style={eyebrow}>Ready when you are</div>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(38px,5.6vw,72px)', margin: '12px 0 0' }}>
          Your next place is<br />one text away.
        </h2>

        <div>
          <HoverLink
            href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, padding: '16px 34px', borderRadius: 999, fontWeight: 700, fontSize: 17, background: FLAMINGO, color: '#fff', boxShadow: '0 6px 28px rgba(255,77,141,.4)', textDecoration: 'none', transition: 'transform .15s' }}
            hoverStyle={{ transform: 'translateY(-2px)' }}
          >
            💬 Text Don now
          </HoverLink>
        </div>

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            background: PANEL, border: `1px solid ${AQUA}`,
            borderRadius: 999, padding: '16px 28px',
            marginTop: 30, fontSize: 17, fontWeight: 700,
          }}>
            📱{' '}
            <span style={{ color: AQUA, fontFamily: 'var(--font-archivo,"Archivo",sans-serif)', fontSize: 20, letterSpacing: '.04em' }}>
              (407) 765-7306
            </span>
            {' '}— budget · beds · move date
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const footerLinks = {
    Neighborhoods: ['Brickell', 'Wynwood', 'Edgewater', 'Downtown', 'Midtown'],
    Company: ['How it works', 'FAQ', 'Reviews', 'For agents'],
  }
  return (
    <footer style={{ borderTop: `1px solid ${LINE}`, padding: '56px 0 32px', fontSize: 14, color: DIM }}>
      <div style={wrap}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }} className="mag-foot-grid">
          <div>
            <div style={{ ...DISPLAY, fontVariationSettings: "'wdth' 125", fontSize: 20, color: PAPER, marginBottom: 14 }}>
              MIAMI APARTMENT <span style={{ color: FLAMINGO }}>GUY</span>™
            </div>
            <p style={{ lineHeight: 1.55 }}>
              Free apartment locating across Greater Miami. Paid by buildings, never by renters. Operated under 305 International Realty, 848 Brickell Ave.
            </p>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 style={{ color: PAPER, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 14 }}>{heading}</h4>
              {links.map(l => (
                <HoverLink key={l} href="#" style={{ display: 'block', padding: '5px 0', color: DIM, textDecoration: 'none' }} hoverStyle={{ color: AQUA }}>{l}</HoverLink>
              ))}
            </div>
          ))}

          <div>
            <h4 style={{ color: PAPER, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 14 }}>Contact</h4>
            <HoverLink href="sms:+14077657306" style={{ display: 'block', padding: '5px 0', color: DIM, textDecoration: 'none' }} hoverStyle={{ color: AQUA }}>Text (407) 765-7306</HoverLink>
            <HoverLink href="#" style={{ display: 'block', padding: '5px 0', color: DIM, textDecoration: 'none' }} hoverStyle={{ color: AQUA }}>Instagram</HoverLink>
            <HoverLink href="#" style={{ display: 'block', padding: '5px 0', color: DIM, textDecoration: 'none' }} hoverStyle={{ color: AQUA }}>TikTok</HoverLink>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 24, fontSize: 12 }}>
          © 2026 MAG™ · Miami Apartment Guy. Equal Housing Opportunity. Licensed under 305 International Realty.
        </div>
      </div>
    </footer>
  )
}

// ─── Responsive styles injection ──────────────────────────────────────────────
function ResponsiveStyles() {
  return (
    <style>{`
      @media (max-width: 920px) {
        .mag-hero-inner  { grid-template-columns: 1fr !important; }
        .mag-steps       { grid-template-columns: 1fr !important; }
        .mag-reviews     { grid-template-columns: 1fr !important; }
        .mag-hoods       { grid-template-columns: repeat(2,1fr) !important; }
        .mag-proof-grid  { grid-template-columns: repeat(2,1fr) !important; }
        .mag-compare     { grid-template-columns: 1fr !important; }
        .mag-foot-grid   { grid-template-columns: 1fr 1fr !important; }
        .mag-nav-links   { display: none !important; }
      }
    `}</style>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <ResponsiveStyles />
      <Ticker />
      <Nav />
      <Hero />
      <ProofBar />
      <HowItWorks />
      <Neighborhoods />
      <WhyMag />
      <Reviews />
      <FinalCTA />
      <Footer />
    </>
  )
}
