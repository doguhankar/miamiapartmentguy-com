'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'

export default function HomePage() {
  const [activeChip, setActiveChip] = useState('Downtown')
  const [budget, setBudget] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  const handleLeadSubmit = () => {
    const formData = {
      neighborhood: activeChip,
      budget,
      fullName,
      phone,
    }
    console.log('[MAG] Lead form submitted:', formData)
  }

  return (
    <div style={{ background: '#0B1220', color: '#F6F8F9', fontFamily: "'Space Grotesk', sans-serif" }}>
      <Topbar />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Space Grotesk', sans-serif; background: #0B1220; color: #F6F8F9; line-height: 1.55; }
        
        .display { font-family: 'Archivo', sans-serif; font-variation-settings: 'wdth' 120; font-weight: 900; letter-spacing: -0.01em; text-transform: uppercase; }
        .eyebrow { font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #19C6C0; font-weight: 700; }
        a { color: inherit; text-decoration: none; }
        
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px; border-radius: 999px; font-weight: 700; font-size: 15px; cursor: pointer; border: none; transition: transform 0.15s, box-shadow 0.15s; }
        .btn:hover { transform: translateY(-2px); }
        .btn-pink { background: #FF4D8D; color: #fff; box-shadow: 0 6px 28px rgba(255,77,141,.4); }
        .btn-ghost { border: 1px solid rgba(255,255,255,.12); color: #F6F8F9; background: transparent; }
        .btn-ghost:hover { border-color: #19C6C0; color: #19C6C0; }
        
        .ticker { background: #FF4D8D; color: #fff; overflow: hidden; white-space: nowrap; font-weight: 700; font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; }
        .ticker-track { display: inline-block; padding: 9px 0; animation: scroll 32s linear infinite; }
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker b { color: #0B1220; margin: 0 6px; }
        
        @media(prefers-reduced-motion:reduce) { .ticker-track { animation: none; } }

        @keyframes magTickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes magReviewScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-66.66%); }
        }
        @media(prefers-reduced-motion:reduce) {
          [style*="magTickerScroll"], [style*="magReviewScroll"] { animation: none !important; }
        }

        /* ── MOBILE LAYOUT ≤768px ───────────────────────────────────────── */
        /* Hide all desktop sections; show mobile-page instead */
        @media (max-width: 768px) {
          html, body { overflow-x: hidden; max-width: 100vw; }

          /* Hide desktop-only sections */
          header,
          .desktop-proof-bar,
          #how, #hoods, #why, #reviews,
          .desktop-final-cta,
          .desktop-footer { display: none !important; }

          /* Show mobile layout */
          .mobile-page { display: block !important; }

          /* Nav: hide full wordmark, show short */
          .logo-full { display: none !important; }
          .logo-short { display: flex !important; }
          nav > div { height: 56px !important; padding: 0 16px !important; }
        }

        /* ── MOBILE PAGE STYLES ─────────────────────────────────────────── */
        .mobile-page { display: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        /* Hero card */
        .m-hero { padding: 16px; }
        .m-hero-card {
          background: #111C2E; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 24px;
        }
        .m-kicker {
          font-size: 11px; letter-spacing: 0.1em; color: #19C6C0;
          text-transform: uppercase; font-weight: 600; margin-bottom: 8px;
        }
        .m-h1 {
          font-family: 'Archivo', sans-serif; font-variation-settings: 'wdth' 120;
          font-size: 32px; line-height: 1.1; font-weight: 900;
          letter-spacing: -0.02em; margin-bottom: 12px;
        }
        .m-sub { font-size: 14px; color: #8FA0B8; margin-bottom: 16px; line-height: 1.5; }

        /* Chat mockup */
        .m-chat {
          background: #16253A; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 12px; margin-bottom: 16px;
        }
        .m-chat-head {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 10px; border-bottom: 0.5px solid rgba(255,255,255,0.08);
          margin-bottom: 10px;
        }
        .m-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #FF4D8D, #FFC24B);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 900; color: #fff; font-family: 'Archivo', sans-serif;
        }
        .m-bubble {
          border-radius: 10px; padding: 9px 10px; font-size: 12px;
          line-height: 1.4; margin-bottom: 8px; max-width: 88%;
        }
        .m-bubble.user {
          background: #19C6C0; color: #04342C; font-weight: 500; margin-left: auto;
        }
        .m-bubble.don { background: #1B2A45; color: #E6ECF5; }
        .m-quote {
          background: #16253A; border: 0.5px solid rgba(255,194,75,0.25);
          border-radius: 10px; padding: 10px; margin-bottom: 8px; max-width: 88%;
        }
        .m-quote-title {
          color: #FFC24B; font-weight: 700; font-size: 10px;
          letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 6px;
        }
        .m-qrow {
          display: flex; justify-content: space-between;
          padding: 2px 0; color: #8FA0B8; font-size: 11px;
        }
        .m-qrow b { color: #E6ECF5; }
        .m-qrow.net { color: #19C6C0; }
        .m-qrow.net b { color: #19C6C0; }

        /* CTAs */
        .m-cta-primary {
          display: block; width: 100%; text-align: center;
          font-size: 15px; font-weight: 700; color: #fff;
          background: #FF4D8D; border: none; border-radius: 10px;
          padding: 14px; margin-bottom: 8px; cursor: pointer;
          text-decoration: none;
        }
        .m-cta-ghost {
          display: block; width: 100%; text-align: center;
          font-size: 13px; font-weight: 600; color: #E6ECF5;
          background: transparent; border: 0.5px solid rgba(255,255,255,0.18);
          border-radius: 10px; padding: 12px; cursor: pointer;
          text-decoration: none;
        }
        .m-trust { font-size: 11px; color: #6F7F96; text-align: center; margin-top: 10px; }

        /* Stats */
        .m-section { padding: 16px; }
        .m-stats {
          display: flex; justify-content: space-between; padding: 16px; gap: 8px;
          background: #111C2E; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 16px;
        }
        .m-stat { text-align: center; flex: 1; }
        .m-stat b { display: block; font-size: 18px; color: #FFC24B; font-weight: 800; font-family: 'Archivo', sans-serif; }
        .m-stat small { font-size: 9px; letter-spacing: 0.06em; color: #6F7F96; text-transform: uppercase; margin-top: 2px; display: block; }

        /* Section labels */
        .m-sec-label {
          font-size: 11px; letter-spacing: 0.1em; color: #19C6C0;
          text-transform: uppercase; font-weight: 600; margin-bottom: 8px;
        }
        .m-h2 {
          font-family: 'Archivo', sans-serif; font-variation-settings: 'wdth' 118;
          font-size: 22px; font-weight: 800; letter-spacing: -0.01em;
          line-height: 1.2; margin-bottom: 16px;
        }

        /* Steps */
        .m-steps { display: flex; flex-direction: column; }
        .m-step {
          display: flex; gap: 12px; padding: 12px 0;
          border-bottom: 0.5px solid rgba(255,255,255,0.08);
        }
        .m-step:last-child { border-bottom: none; }
        .m-step-num {
          width: 26px; height: 26px; border-radius: 50%; background: #FF4D8D;
          color: #fff; font-size: 12px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .m-step b { font-size: 13px; display: block; margin-bottom: 2px; color: #E6ECF5; }
        .m-step p { font-size: 11px; color: #8FA0B8; line-height: 1.4; }

        /* Neighborhoods 2×3 grid */
        .m-hoods { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .m-hood {
          aspect-ratio: 1/1; border-radius: 12px; position: relative;
          overflow: hidden; background-size: cover; background-position: center;
          display: flex; align-items: flex-end;
          border: 0.5px solid rgba(255,255,255,0.08);
          text-decoration: none;
        }
        .m-hood-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(4,8,16,0.88));
        }
        .m-hood-label { position: relative; z-index: 2; padding: 10px; }
        .m-hood-label b { font-size: 13px; color: #E6ECF5; display: block; font-weight: 700; }
        .m-hood-label small { font-size: 10px; color: #8FA0B8; }

        /* Why card */
        .m-why-card {
          background: #111C2E; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 16px;
        }
        .m-check-row {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 8px 0; font-size: 12px; line-height: 1.4;
          color: #E6ECF5; border-bottom: 0.5px solid rgba(255,255,255,0.06);
        }
        .m-check-row:last-child { border-bottom: none; }
        .m-ck { color: #19C6C0; font-weight: 800; flex-shrink: 0; }
        .m-why-foot { font-size: 11px; color: #6F7F96; margin-top: 10px; line-height: 1.5; }

        /* Reviews horizontal scroll */
        .m-reviews {
          display: flex; gap: 10px; overflow-x: auto;
          scroll-snap-type: x mandatory; padding-bottom: 6px;
          -webkit-overflow-scrolling: touch;
        }
        .m-reviews::-webkit-scrollbar { display: none; }
        .m-review {
          flex: 0 0 82%; scroll-snap-align: start;
          background: #111C2E; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 14px;
        }
        .m-stars { color: #FFC24B; font-size: 11px; letter-spacing: 2px; margin-bottom: 8px; }
        .m-review p { font-size: 12px; line-height: 1.5; margin-bottom: 8px; color: #C9D4E2; }
        .m-review-by { display: flex; align-items: center; gap: 8px; }
        .m-review-av {
          width: 24px; height: 24px; border-radius: 50%;
          font-size: 8px; font-weight: 800; color: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .m-review-by b { font-size: 11px; color: #E6ECF5; }
        .m-review-by small { font-size: 9px; color: #6F7F96; }

        /* Final CTA */
        .m-final {
          padding: 36px 16px; text-align: center;
          background: linear-gradient(180deg, #0B1220, #131029);
        }
        .m-sms-line { margin-top: 12px; font-size: 13px; color: #19C6C0; font-weight: 600; }
        .m-sms-line small { display: block; color: #6F7F96; font-weight: 400; font-size: 10px; margin-top: 2px; }

        /* Footer */
        .m-footer {
          padding: 20px 16px 32px; border-top: 0.5px solid rgba(255,255,255,0.08);
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .m-foot-logo { font-size: 13px; font-weight: 800; color: #E6ECF5; font-family: 'Archivo', sans-serif; }
        .m-foot-logo span { color: #FF4D8D; }
        .m-footer small { display: block; font-size: 9px; color: #6F7F96; margin-top: 6px; line-height: 1.5; }
        .m-foot-links { text-align: right; }
        .m-foot-links a { display: block; font-size: 10px; color: #8FA0B8; text-decoration: none; padding: 3px 0; }
      `}</style>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-track">
          <b>LIVE</b> Flow Brickell — 1BD from $2,650 · 2 months free &nbsp;✦&nbsp; <b>LIVE</b> Edgewater — Studios from $2,100 · waived admin &nbsp;✦&nbsp; <b>LIVE</b> Wynwood — 2BD from $3,400 · 6 weeks free &nbsp;✦&nbsp; <b>LIVE</b> Downtown — 1BD from $2,350 · $1,000 off first month &nbsp;✦&nbsp; <b>LIVE</b> Flow Brickell — 1BD from $2,650 · 2 months free &nbsp;✦&nbsp; <b>LIVE</b> Edgewater — Studios from $2,100 · waived admin &nbsp;✦&nbsp; <b>LIVE</b> Wynwood — 2BD from $3,400 · 6 weeks free &nbsp;✦&nbsp; <b>LIVE</b> Downtown — 1BD from $2,350 · $1,000 off first month &nbsp;✦&nbsp;
        </div>
      </div>



      {/* HERO */}
      <header style={{ position: 'relative', paddingTop: 'calc(61px + 90px)', paddingBottom: '70px', overflow: 'hidden', background: '#0B1220', marginTop: '0' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(700px 420px at 85% 0%, rgba(255,77,141,.22), transparent 60%), radial-gradient(600px 400px at 0% 100%, rgba(25,198,192,.18), transparent 60%)' }} />
        <div className="hero-grid" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px', position: 'relative', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '56px', alignItems: 'center' }}>
          <div>
            <div className="eyebrow">Free for renters · Paid by the buildings</div>
            <h1 style={{ fontFamily: 'Archivo', fontVariationSettings: "'wdth' 120", fontSize: 'clamp(44px, 6.4vw, 84px)', lineHeight: 0.95, margin: '18px 0 22px', fontWeight: 900 }}>
              Every building.<br />Every deal.<br /><span style={{ color: '#FF4D8D' }}>One</span> <span style={{ color: '#19C6C0' }}>text.</span>
            </h1>
            <p className="desktop-copy" style={{ fontSize: '19px', color: '#B8C4D4', maxWidth: '52ch', marginBottom: '32px' }}>
              I track live pricing across Miami and Broward buildings. Text your budget, get real quotes same day. Net effective rent, move-in costs, everything.
            </p>
            <p className="mobile-copy" style={{ display: 'none', fontSize: '18px', color: '#B8C4D4', marginBottom: '32px' }}>
              Text your budget. Get real quotes same day.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment" className="btn btn-pink">💬 Text me your budget</a>
              <a href="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '999px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', border: '1px solid rgba(255,255,255,.12)', color: '#F6F8F9', background: 'transparent', transition: 'transform 0.15s, border-color 0.15s, color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#19C6C0'; e.currentTarget.style.color = '#19C6C0'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = '#F6F8F9'; e.currentTarget.style.transform = 'none'; }}>Browse the map →</a>
            </div>
            <div style={{ fontSize: '13px', color: '#7E8CA0', marginTop: '14px' }}>No fees. No spam. No "create an account to see prices." Ever.</div>
          </div>

          {/* PHONE MOCK */}
          <div className="phone-mock" style={{ background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '28px', padding: '22px', boxShadow: '0 30px 80px rgba(0,0,0,.5)', maxWidth: '380px', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,.12)', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF4D8D, #FFC24B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontFamily: 'Archivo', fontSize: '13px' }}>MAG</div>
              <div><strong>Don · Miami Apartment Guy</strong><small style={{ display: 'block', color: '#7E8CA0', fontSize: '11px' }}>Typically replies in minutes</small></div>
            </div>

            <div style={{ maxWidth: '85%', padding: '11px 14px', borderRadius: '16px', fontSize: '14px', marginBottom: '10px', background: '#19C6C0', color: '#0B1220', marginLeft: 'auto', borderBottomRightRadius: '4px', fontWeight: 500 }}>
              Hey! Looking for a 1BD in Brickell, budget around $2,800. Moving in August 🙏
            </div>

            <div style={{ maxWidth: '85%', padding: '11px 14px', borderRadius: '16px', fontSize: '14px', marginBottom: '10px', background: '#1B2A45', borderBottomLeftRadius: '4px' }}>
              Say less. Pulling live pricing now — you're going to like what Flow is running this month 👀
            </div>

            <div style={{ maxWidth: '85%', padding: '11px 14px', borderRadius: '16px', fontSize: '14px', marginBottom: '10px', background: 'linear-gradient(160deg, #152341, #0F1B30)', border: '1px solid rgba(25,198,192,.4)', borderBottomLeftRadius: '4px' }}>
              <h4 style={{ fontFamily: 'Archivo', fontVariationSettings: "'wdth' 115", textTransform: 'uppercase', fontSize: '13px', color: '#FFC24B', marginBottom: '8px' }}>Flow Brickell · 1BD/1BA · 705 sqft</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#B8C4D4', fontSize: '13px' }}><span>Gross rent</span><b style={{ color: '#fff' }}>$2,950/mo</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#B8C4D4', fontSize: '13px' }}><span>Concession</span><b style={{ color: '#fff' }}>2 months free</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#19C6C0', fontSize: '13px' }}><span>Net effective</span><b style={{ color: '#19C6C0' }}>$2,458/mo</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#B8C4D4', fontSize: '13px' }}><span>Move-in costs</span><b style={{ color: '#fff' }}>$1,250 total</b></div>
            </div>

            <div style={{ maxWidth: '85%', padding: '11px 14px', borderRadius: '16px', fontSize: '14px', background: '#1B2A45', borderBottomLeftRadius: '4px' }}>
              Touring slots open Sat 11am. Want me to lock one?
            </div>
          </div>
        </div>
      </header>

      {/* PROOF BAR */}
      <div className="desktop-proof-bar" style={{ borderTop: '1px solid rgba(255,255,255,.12)', borderBottom: '1px solid rgba(255,255,255,.12)', padding: '28px 0' }}>
        <div className="proof-stats" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
          {[
            { num: '108+', lbl: 'Buildings tracked' },
            { num: '$0', lbl: 'Cost to you' },
            { num: '24h', lbl: 'Budget → quotes' },
            { num: '100%', lbl: 'Real net pricing' }
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: '34px', color: '#FFC24B' }}>{item.num}</div>
              <div style={{ fontSize: '13px', color: '#7E8CA0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{item.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: '88px 0' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div className="eyebrow">How it works</div>
          <h2 className="display" style={{ fontSize: 'clamp(30px, 4vw, 48px)', margin: '12px 0 16px' }}>Three steps. Zero portals.</h2>
          <p style={{ color: '#B8C4D4', fontSize: '17px', maxWidth: '60ch' }}>Other sites make you fill out a four-page form to see a price. Here's the entire process:</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '48px' }}>
            {[
              { tag: 'Step 1', icon: '💬', title: 'Text your budget', descLong: 'One message: budget, beds, neighborhoods, move date. That\'s the whole application.', descShort: 'Send budget, beds, and move date.' },
              { tag: 'Step 2', icon: '📋', title: 'Get real quotes', descLong: 'I send formatted quotes with gross rent, concessions, net effective rent, and total move-in cost — straight from my building contacts.', descShort: 'Receive live pricing in minutes.' },
              { tag: 'Step 3', icon: '🔑', title: 'Tour & sign', descLong: 'I book your tours, negotiate the deal, and walk you to the lease. The building pays me. You pay nothing.', descShort: 'Book tours and close the deal.' }
            ].map((item, i) => (
              <div key={i} style={{ background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '20px', padding: '32px 28px', position: 'relative', transition: 'border-color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#19C6C0')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)')}>
                <div style={{ position: 'absolute', top: '22px', right: '22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: '#FF4D8D', textTransform: 'uppercase' }}>{item.tag}</div>
                <div style={{ fontSize: '30px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 className="display" style={{ fontSize: '18px', marginBottom: '10px', fontVariationSettings: "'wdth' 115" }}>{item.title}</h3>
                <p className="desktop-copy" style={{ color: '#B8C4D4', fontSize: '15px' }}>{item.descLong}</p>
                <p className="mobile-copy" style={{ display: 'none', color: '#B8C4D4', fontSize: '15px' }}>{item.descShort}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section id="hoods" style={{ padding: '88px 0' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div className="eyebrow">Neighborhoods</div>
          <h2 className="display" style={{ fontSize: 'clamp(30px, 4vw, 48px)', margin: '12px 0 44px' }}>Where do you want to wake up?</h2>

          <div className="neighborhoods-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { bg: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.27.49%E2%80%AFPM.png-quNNm2yJanE4YvhAq5LXnzZU6Bc1M0.jpeg)', name: 'Brickell', descLong: 'High-rise living · from $2,300', descShort: 'From $2,300', link: '/map?neighborhood=brickell' },
              { bg: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.34.40%E2%80%AFPM-ZdxO8b0IP4gFzwYPxlmOfFTLS6OGuY.png)', name: 'Wynwood', descLong: 'Art & nightlife · from $2,200', descShort: 'From $2,200', link: '/map?neighborhood=wynwood' },
              { bg: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.38.24%E2%80%AFPM.png-C6ysCh1CAGzrOi7ivCOVLJTCWhFokI.jpeg)', name: 'Edgewater', descLong: 'Bay views · from $2,100', descShort: 'From $2,100', link: '/map?neighborhood=edgewater' },
              { bg: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.41.20%E2%80%AFPM.png-6rvSsbBMrjH0sS02nFjhvTWWW0Jt1E.jpeg)', name: 'Downtown', descLong: 'Walk everywhere · from $2,000', descShort: 'From $2,000', link: '/map?neighborhood=downtown' },
              { bg: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.47.08%E2%80%AFPM-ZtrGk3664gXnLZIQZTlI374n4AcxOt.png)', name: 'Midtown', descLong: 'Best of both · from $2,250', descShort: 'From $2,250', link: '/map?neighborhood=midtown' },
              { bg: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.47.41%E2%80%AFPM.png-8JILMw3ZIOOoo1Vww651TGRuXyncEB.jpeg)', name: 'Coconut Grove', descLong: 'Lush & quiet · from $2,400', descShort: 'From $2,400', link: '/map?neighborhood=coconut-grove' },
              { bg: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.53.27%E2%80%AFPM-rKhZBWNNlhdMcwcehum4MbRpcnV1an.png)', name: 'Coral Gables', descLong: 'Classic Miami · from $2,300', descShort: 'From $2,300', link: '/map?neighborhood=coral-gables' },
              { bg: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.56.40%E2%80%AFPM.png-r2HiLx3k65C0Alzh9JKpRGDjarhiN7.jpeg)', name: 'Miami Beach', descLong: 'Ocean life · from $2,200', descShort: 'From $2,200', link: '/map?neighborhood=miami-beach' }
            ].map((hood, i) => (
              <a key={i} href={hood.link} className="hood" style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', aspectRatio: '4/5', display: 'flex', alignItems: 'flex-end', padding: '20px', border: '1px solid rgba(255,255,255,.12)', transition: 'transform 0.2s', backgroundImage: hood.bg || hood.g, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(11,18,32,.92))', pointerEvents: 'none' }} />
                <h3 className="display" style={{ fontFamily: 'Archivo', fontVariationSettings: "'wdth' 118", textTransform: 'uppercase', fontSize: '19px', position: 'relative', zIndex: 2 }}>{hood.name}</h3>
                <small className="desktop-copy" style={{ position: 'relative', zIndex: 2, color: '#D7E2EE', fontSize: '12px' }}>{hood.descLong}</small>
                <small className="mobile-copy" style={{ display: 'none', position: 'relative', zIndex: 2, color: '#D7E2EE', fontSize: '12px' }}>{hood.descShort}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* WHY MAG */}
      <section id="why" style={{ padding: '88px 0', background: '#F6F8F9', color: '#0B1220' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div className="eyebrow" style={{ color: '#C2185B' }}>Why MAG™</div>
          <h2 className="display" style={{ fontSize: 'clamp(30px, 4vw, 48px)', margin: '12px 0 16px', color: '#0B1220' }}>Listing sites show you ads.<br />I show you deals.</h2>
          <p style={{ color: '#44506A', fontSize: '17px', maxWidth: '60ch' }}>The big rental sites list whatever buildings pay them to promote. I track the whole market and I only win when you sign somewhere you love.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '44px' }}>
            <div style={{ borderRadius: '20px', padding: '34px', background: '#E9EDF2', color: '#44506A' }}>
              <h3 className="display" style={{ fontFamily: 'Archivo', textTransform: 'uppercase', fontVariationSettings: "'wdth' 115", fontSize: '20px' }}>The big listing sites</h3>
              <ul style={{ listStyle: 'none', marginTop: '18px' }}>
                {[
                  { long: 'Show 10–30% of what\'s actually available', short: 'Hide most listings' },
                  { long: 'Stale pricing, no concessions shown', short: 'Outdated prices' },
                  { long: 'Your info sold to a call-center funnel', short: 'Sell your info' },
                  { long: 'You do all the legwork yourself', short: 'DIY everything' }
                ].map((item, i) => (
                  <li key={i} style={{ padding: '10px 0', borderBottom: 'rgba(0,0,0,.08) 1px solid', fontSize: '15px', display: 'flex', gap: '10px' }}>
                    <span className="desktop-copy">❌ {item.long}</span>
                    <span className="mobile-copy" style={{ display: 'none' }}>❌ {item.short}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ borderRadius: '20px', padding: '34px', background: '#0B1220', color: '#F6F8F9', boxShadow: '0 24px 60px rgba(11,18,32,.35)' }}>
              <h3 className="display" style={{ fontFamily: 'Archivo', textTransform: 'uppercase', fontVariationSettings: "'wdth' 115", fontSize: '20px' }}>Miami Apartment <span style={{ color: '#FF4D8D' }}>Guy™</span></h3>
              <ul style={{ listStyle: 'none', marginTop: '18px' }}>
                {[
                  { long: 'Live pricing across 108+ buildings, updated daily', short: '108+ live updates' },
                  { long: 'Net effective rent — the real number after concessions', short: 'Real net pricing' },
                  { long: 'One human. My number. Straight answers.', short: 'Human, not bots' },
                  { long: 'I negotiate, book tours, and chase the paperwork', short: 'I handle everything' }
                ].map((item, i) => (
                  <li key={i} style={{ padding: '10px 0', borderBottom: 'rgba(255,255,255,.12) 1px solid', fontSize: '15px', display: 'flex', gap: '10px' }}>
                    <span className="desktop-copy">✅ {item.long}</span>
                    <span className="mobile-copy" style={{ display: 'none' }}>✅ {item.short}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={{ padding: '88px 0' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div className="eyebrow">Recent wins</div>
          <h2 className="display" style={{ fontSize: 'clamp(30px, 4vw, 48px)', margin: '12px 0 44px' }}>Renters keep the receipts.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { stars: '★★★★★', textLong: '"Texted Don a budget at 9pm, had five quotes with net pricing by morning. Signed at Flow with two months free I never would have found on my own."', textShort: '"Texted budget, got 5 quotes with real pricing by morning."', name: 'Jessica M.', location: 'Brickell', initials: 'JM', bg: '#19C6C0' },
              { stars: '★★★★★', textLong: '"Relocated from NYC sight unseen. Don FaceTimed me through three tours and negotiated my admin fee to zero. Didn\'t pay him a dime."', textShort: '"Got me in from NYC, zero fees. Amazing."', name: 'Carlos R.', location: 'Edgewater', initials: 'CR', bg: '#FF4D8D' },
              { stars: '★★★★★', textLong: '"Every other \'locator\' sent me a Zillow link. Don sent me a quote sheet with move-in costs down to the dollar. Different level."', textShort: '"Don sent real quotes. Everyone else just links."', name: 'Aaliyah T.', location: 'Wynwood', initials: 'AT', bg: '#FFC24B' }
            ].map((review, i) => (
              <div key={i} style={{ background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '18px', padding: '26px' }}>
                <div style={{ color: '#FFC24B', letterSpacing: '2px', marginBottom: '12px' }}>{review.stars}</div>
                <p className="desktop-copy" style={{ fontSize: '15px', color: '#C9D4E2', marginBottom: '16px' }}>{review.textLong}</p>
                <p className="mobile-copy" style={{ display: 'none', fontSize: '15px', color: '#C9D4E2', marginBottom: '16px' }}>{review.textShort}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700 }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, fontFamily: 'Archivo', background: review.bg, color: review.bg === '#FFC24B' ? '#0B1220' : '#fff' }}>
                    {review.initials}
                  </div>
                  <div>{review.name} <span style={{ color: '#7E8CA0', fontWeight: '400' }}>· {review.location}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="desktop-final-cta" style={{ position: 'relative', textAlign: 'center', overflow: 'hidden', padding: '88px 0' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(600px 340px at 50% 100%, rgba(255,77,141,.28), transparent 65%)' }} />
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <div className="eyebrow">Ready when you are</div>
          <h2 className="display" style={{ fontSize: 'clamp(38px, 5.6vw, 72px)' }}>Your next place is<br />one text away.</h2>
          <a href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment" className="btn btn-pink" style={{ marginTop: '28px', fontSize: '17px', padding: '16px 34px' }}>💬 Text Don now</a>
          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', background: '#0F1B30', border: '1px solid #19C6C0', borderRadius: '999px', padding: '16px 28px', fontSize: '17px', fontWeight: 700 }}>
              📱 <span style={{ color: '#19C6C0', fontFamily: 'Archivo', fontSize: '20px', letterSpacing: '0.04em' }}>(407) 765-7306</span> — budget · beds · move date
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE PAGE (≤768px) ─────────────────────────────────────────── */}
      <div className="mobile-page">

        {/* MOBILE NAV */}
        <header style={{ width: '100%', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em' }}>
            MAG<span style={{ color: '#FF3D82' }}>.</span>
          </span>
          <div style={{ display: 'flex', gap: '14px' }}>
            <a href="https://miamiapartmentguy.com/agent" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: '#7C86A0', textDecoration: 'none', letterSpacing: '0.02em' }}>Agent Login</a>
          </div>
        </header>

        {/* PRICE TICKER */}
        <div style={{ width: '100%', background: '#FF1F73', overflow: 'hidden', padding: '4px 0' }}>
          <div style={{ display: 'flex', gap: '40px', whiteSpace: 'nowrap', animation: 'magTickerScroll 26s linear infinite', width: 'max-content' }}>
            {['BRICKELL STUDIO $2,100/mo', 'EDGEWATER 1BR $2,650/mo', 'WYNWOOD 1BR $2,400/mo', 'DOWNTOWN 2BR $3,300/mo', 'MIDTOWN 1BR $2,550/mo',
              'BRICKELL STUDIO $2,100/mo', 'EDGEWATER 1BR $2,650/mo', 'WYNWOOD 1BR $2,400/mo', 'DOWNTOWN 2BR $3,300/mo', 'MIDTOWN 1BR $2,550/mo'].map((item, i) => {
              const [label, price] = item.split(' $')
              return (
                <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px', fontWeight: 600, color: '#1a0510', letterSpacing: '0.02em' }}>
                  {label} <b style={{ fontWeight: 700 }}>${price}</b>
                </span>
              )
            })}
          </div>
        </div>

        {/* HERO */}
        <div style={{ padding: '14px 16px 10px' }}>
          {/* Photo — small, centered, above text */}
          <div style={{ maxWidth: '130px', margin: '0 auto 12px' }}>
            <div style={{ borderRadius: '18px', overflow: 'hidden', aspectRatio: '1/1', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/don-headshot-ELlS4tBqhHqQpd7vBREV7j3YkR3DRv.jpeg"
                alt="Don Karahan — Miami Apartment Locator"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 12%', display: 'block' }}
                onError={(e) => {
                  // Fallback: show initials avatar if photo 404s
                  const el = e.currentTarget.parentElement!
                  e.currentTarget.style.display = 'none'
                  el.style.background = 'linear-gradient(135deg,#FF3D82,#FFC24B)'
                  el.style.display = 'flex'
                  el.style.alignItems = 'center'
                  el.style.justifyContent = 'center'
                  el.innerHTML = '<span style="font-family:Space Grotesk,sans-serif;font-weight:800;font-size:32px;color:#fff">DK</span>'
                }}
              />
            </div>
          </div>

          {/* Text block — centered */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.05em', color: '#FFC24B', fontWeight: 600, marginBottom: '8px', padding: '4px 10px 4px 8px', border: '1px solid rgba(255,194,75,0.3)', borderRadius: '100px', background: 'rgba(255,194,75,0.06)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1CDCD4', boxShadow: '0 0 10px #1CDCD4', display: 'inline-block', flexShrink: 0 }} />
              MIAMI REAL ESTATE ADVISOR · 305 INTERNATIONAL
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: '6px' }}>
              Miami&apos;s most trusted<br /><span style={{ color: '#FF3D82' }}>apartment locators.</span>
            </h1>
            <p style={{ fontSize: '12.5px', color: '#7C86A0', lineHeight: 1.5, margin: '0 auto 10px' }}>
              Smooth, effortless moves in Miami.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,194,75,0.3)', color: '#FFC24B' }}>
                ⚡ Responds in minutes
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <a
                href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20an%20apartment%20in%20Miami"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textDecoration: 'none', background: '#FF3D82', color: '#1a0510', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '14px', padding: '12px 22px', borderRadius: '100px', boxShadow: '0 8px 30px rgba(255,61,130,0.4)' }}
              >
                📲 Text Don now
              </a>
              <a
                href="https://miamiapartmentguy.com/map"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', background: 'rgba(28,220,212,0.1)', border: '1.5px solid #1CDCD4', color: '#1CDCD4', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '14px', padding: '12px 22px', borderRadius: '100px', boxShadow: '0 0 20px rgba(28,220,212,0.25)' }}
              >
                🗺️ Browse the Map →
              </a>
            </div>
            {/* Social row */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#7C86A0', marginRight: '4px' }}>FIND ME</span>
              <a href="https://wa.me/14077657306" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#25D366', fontSize: '17px' }} title="WhatsApp">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.89-1.25-4.78-4.15-4.93-4.34-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.15.12.32.02.51-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.13.57.16.28.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.22 1.36.28.14.44.12.61-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.1 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.17 1.36z"/></svg>
              </a>
              <a href="https://instagram.com/miamiapartmentguy" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#FF3D82' }} title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07c-4.35.2-6.78 2.62-6.98 6.98C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8zm6.41-10.85a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z"/></svg>
              </a>
              <a href="https://tiktok.com/@themiamiapartmentguy" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#F7F8FB' }} title="TikTok">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              <a href="mailto:don@miamiapartmentguy.com" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#1CDCD4' }} title="Email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" fill="none"/><path d="M22 6l-10 7L2 6" stroke="currentColor" fill="none"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* TRUST BAR */}
        <div style={{ margin: '4px 0 0', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { icon: '🏢', strong: '10,000+', plain: 'apartments in South Florida' },
            { icon: '🤝', strong: '100% free', plain: 'locating help' },
            { icon: '✨', strong: 'Pick your agent', plain: '' },
          ].map((item) => (
            <div key={item.strong} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
              <span style={{ fontSize: '15px' }}>{item.icon}</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12.5px', color: '#1CDCD4' }}>{item.strong}</span>
              {item.plain && <span style={{ fontSize: '11px', color: '#7C86A0' }}>{item.plain}</span>}
            </div>
          ))}
        </div>

        {/* QUOTE / LEAD FORM PANEL */}
        <div style={{ padding: '6px 16px 0' }}>
          <div style={{ background: '#0F1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14.5px', fontWeight: 700, marginBottom: '10px' }}>Your Move Starts Here</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#7C86A0', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              I&apos;m looking to rent in
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {['Downtown', 'Midtown', 'Edgewater', 'Wynwood', 'Just exploring'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActiveChip(chip)}
                  style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '100px',
                    background: activeChip === chip ? '#FF3D82' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${activeChip === chip ? '#FF3D82' : 'rgba(255,255,255,0.12)'}`,
                    color: activeChip === chip ? '#1a0510' : '#F7F8FB',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F7F8FB', fontFamily: "'Archivo', sans-serif", fontSize: '14px', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F7F8FB', fontFamily: "'Archivo', sans-serif", fontSize: '14px', outline: 'none' }}
              />
              <input
                type="tel"
                placeholder="Phone (so I can text you options)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F7F8FB', fontFamily: "'Archivo', sans-serif", fontSize: '14px', outline: 'none' }}
              />
              <button
                onClick={handleLeadSubmit}
                style={{ background: '#1CDCD4', color: '#04201e', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '13.5px', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}
              >
                Get my matches →
              </button>
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        <div style={{ marginTop: '36px', padding: '0 16px' }}>
          {/* Google badge */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <a
              href="https://share.google/Cknw6EKycHwFY381b"
              target="_blank"
              rel="noopener noreferrer"
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#0F1729', border: '1px solid rgba(255,194,75,0.35)', borderRadius: '100px', padding: '11px 20px', textDecoration: 'none', color: '#F7F8FB', marginBottom: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.12A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.27 14.26a7.2 7.2 0 0 1 0-4.52V6.62H1.27a12 12 0 0 0 0 10.76l4-3.12z"/><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.12C6.22 6.86 8.87 4.75 12 4.75z"/></svg>
              <span style={{ color: '#FFC24B', fontSize: '13.5px', letterSpacing: '1px' }}>★★★★★</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '14px' }}>5.0 · 16 Google reviews</span>
            </a>
            <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px', color: '#7C86A0', marginBottom: '10px' }}>
              👆 tap to read on Google
            </span>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px' }}>What clients say</div>
          </div>

          {/* Auto-scrolling reviews track */}
          <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, black 4%, black 96%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 4%, black 96%, transparent)' }}>
            <div style={{ display: 'flex', gap: '16px', animation: 'magReviewScroll 40s linear infinite', width: 'max-content' }}>
              {[
                { text: '"I had an amazing experience working with Don. He truly went above and beyond to help us find a great place to live. Consistently responsive, punctual, and on top of every detail."', name: 'Katherine B.' },
                { text: '"Doğuhan gave me three options within my budget and got me concessions when possible. Found me the perfect place. Couldn\'t be happier."', name: 'Arismendis A.' },
                { text: '"He didn\'t just find us a perfect apartment — his deep expertise in Fort Lauderdale was critical. He went above and beyond at every turn."', name: 'Cody S.' },
                { text: '"Super responsive, accommodating and patient — even when our criteria changed 3x. Told us the honest truth about every location."', name: 'Nick N.' },
                { text: '"Without Doğuhan I would have given up at least ten times. His patience, warmth, and dedication made all the difference. 100% recommend."', name: 'Poca W.' },
                { text: '"He immediately jumped on a luxury apartment not yet ready to show, FaceTimed us a tour, and we got the spot. Treated us like family."', name: 'Nisa A.' },
                // Duplicate set for seamless loop
                { text: '"I had an amazing experience working with Don. He truly went above and beyond to help us find a great place to live. Consistently responsive, punctual, and on top of every detail."', name: 'Katherine B.' },
                { text: '"Doğuhan gave me three options within my budget and got me concessions when possible. Found me the perfect place. Couldn\'t be happier."', name: 'Arismendis A.' },
                { text: '"He didn\'t just find us a perfect apartment — his deep expertise in Fort Lauderdale was critical. He went above and beyond at every turn."', name: 'Cody S.' },
              ].map((r, i) => (
                <div key={i} style={{ background: '#0F1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', width: '240px', flexShrink: 0 }}>
                  <div style={{ color: '#FFC24B', fontSize: '13px', letterSpacing: '1px', marginBottom: '10px' }}>★★★★★</div>
                  <p style={{ fontSize: '12px', color: '#F7F8FB', lineHeight: 1.55, marginBottom: '12px', opacity: 0.85 }}>{r.text}</p>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11.5px', color: '#7C86A0' }}>{r.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MOBILE FOOTER */}
        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexDirection: 'column', textAlign: 'center', padding: '28px 24px 44px', color: '#7C86A0', fontSize: '12px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" title="Equal Housing Opportunity">
            <rect x="1" y="1" width="22" height="22" rx="2" stroke="#7C86A0" strokeWidth="1.4"/>
            <path d="M12 5L5 10.5V19H9.5V14H14.5V19H19V10.5L12 5Z" fill="#7C86A0"/>
          </svg>
          <div style={{ lineHeight: 1.6 }}>
            Don Karahan · FL Real Estate License #SL3581300 · Casa Locators / 305 International Realty · Miami-Dade &amp; Broward<br />
            Equal Housing Opportunity
          </div>
        </footer>

      </div>
      {/* ── END MOBILE PAGE ─────────────────────────────────────────────── */}

      {/* FOOTER */}
      <footer className="desktop-footer" style={{ borderTop: '1px solid rgba(255,255,255,.12)', padding: '56px 0 32px', fontSize: '14px', color: '#7E8CA0' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontFamily: 'Archivo', fontVariationSettings: "'wdth' 125", fontWeight: 900, fontSize: '20px', textTransform: 'uppercase', marginBottom: '14px', color: '#F6F8F9' }}>
                Miami Apartment <span style={{ color: '#FF4D8D' }}>Guy</span>™
              </div>
              <p>Free apartment locating across Greater Miami. Paid by buildings, never by renters. Operated under 305 International Realty, 848 Brickell Ave.</p>
            </div>
            <div>
              <h4 style={{ color: '#F6F8F9', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px', fontWeight: 700 }}>Neighborhoods</h4>
              {['Brickell', 'Wynwood', 'Edgewater', 'Downtown', 'Midtown'].map((item) => (
                <a key={item} href="#" style={{ display: 'block', padding: '5px 0', color: 'inherit' }} onMouseEnter={(e) => (e.target.style.color = '#19C6C0')} onMouseLeave={(e) => (e.target.style.color = 'inherit')}>{item}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#F6F8F9', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px', fontWeight: 700 }}>Company</h4>
              {['How it works', 'FAQ', 'Reviews', 'For agents'].map((item) => (
                <a key={item} href="#" style={{ display: 'block', padding: '5px 0', color: 'inherit' }} onMouseEnter={(e) => (e.target.style.color = '#19C6C0')} onMouseLeave={(e) => (e.target.style.color = 'inherit')}>{item}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#F6F8F9', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px', fontWeight: 700 }}>Contact</h4>
              <a href="sms:+14077657306" style={{ display: 'block', padding: '5px 0', color: 'inherit' }} onMouseEnter={(e) => (e.target.style.color = '#19C6C0')} onMouseLeave={(e) => (e.target.style.color = 'inherit')}>Text (407) 765-7306</a>
              <a href="#" style={{ display: 'block', padding: '5px 0', color: 'inherit' }} onMouseEnter={(e) => (e.target.style.color = '#19C6C0')} onMouseLeave={(e) => (e.target.style.color = 'inherit')}>Instagram</a>
              <a href="#" style={{ display: 'block', padding: '5px 0', color: 'inherit' }} onMouseEnter={(e) => (e.target.style.color = '#19C6C0')} onMouseLeave={(e) => (e.target.style.color = 'inherit')}>TikTok</a>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: '24px', fontSize: '12px' }}>
            © 2026 MAG™ · Miami Apartment Guy. Equal Housing Opportunity. Licensed under 305 International Realty.
          </div>
        </div>
      </footer>
    </div>
  )
}
