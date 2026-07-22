'use client'

import Topbar from '@/components/topbar'

export default function HomePage() {
  return (
    <div style={{ background: '#0B1220', color: '#F6F8F9', fontFamily: "'Space Grotesk', sans-serif" }}>
      <Topbar />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Space+Grotesk:wght@400;500;700&display=swap');
        
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

        {/* HERO */}
        <div className="m-hero">
          <div className="m-hero-card">
            <div className="m-kicker">Every building</div>
            <h1 className="m-h1">
              Every deal.<br /><span style={{ color: '#FF4D8D' }}>One</span> <span style={{ color: '#19C6C0' }}>text.</span>
            </h1>
            <p className="m-sub">Text your budget. Get real quotes with net pricing same day.</p>

            {/* Chat mockup */}
            <div className="m-chat">
              <div className="m-chat-head">
                <div className="m-avatar">MAG</div>
                <div>
                  <strong style={{ fontSize: '12px', color: '#E6ECF5' }}>Don</strong>
                  <small style={{ display: 'block', fontSize: '10px', color: '#6F7F96' }}>Typically replies in minutes</small>
                </div>
              </div>
              <div className="m-bubble user">1BD in Brickell, ~$2,800, moving August</div>
              <div className="m-bubble don">Say less. Pulling live pricing now</div>
              <div className="m-quote">
                <div className="m-quote-title">Flow Brickell · 1BD</div>
                <div className="m-qrow"><span>Gross rent</span><b>$2,950/mo</b></div>
                <div className="m-qrow"><span>Concession</span><b>2 months free</b></div>
                <div className="m-qrow net"><span>Net effective</span><b>$2,458/mo</b></div>
              </div>
              <div className="m-bubble don">Tours open Sat 11am. Want me to lock one?</div>
            </div>

            <a href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment" className="m-cta-primary">Text me your budget</a>
            <a href="/map" className="m-cta-ghost">Browse the map →</a>
            <div className="m-trust">No fees · No spam · No accounts</div>
          </div>
        </div>

        {/* STATS */}
        <div className="m-section" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div className="m-stats">
            <div className="m-stat"><b>108+</b><small>Buildings</small></div>
            <div className="m-stat"><b>$0</b><small>Cost</small></div>
            <div className="m-stat"><b>24h</b><small>Quotes</small></div>
            <div className="m-stat"><b>100%</b><small>Net pricing</small></div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="m-section">
          <div className="m-sec-label">How it works</div>
          <h2 className="m-h2">Three steps. Zero portals.</h2>
          <div className="m-steps">
            {[
              { n: '1', title: 'Text your budget', desc: 'Budget, beds, move date.' },
              { n: '2', title: 'Get real quotes', desc: 'Live net pricing in minutes.' },
              { n: '3', title: 'Tour & sign', desc: 'I book tours and chase paperwork.' },
            ].map((s) => (
              <div className="m-step" key={s.n}>
                <div className="m-step-num">{s.n}</div>
                <div><b>{s.title}</b><p>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* NEIGHBORHOODS */}
        <div className="m-section">
          <div className="m-sec-label">Neighborhoods</div>
          <h2 className="m-h2">Where do you want to wake up?</h2>
          <div className="m-hoods">
            {[
              { bg: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.27.49%E2%80%AFPM.png-quNNm2yJanE4YvhAq5LXnzZU6Bc1M0.jpeg', name: 'Brickell', price: 'From $2,300', link: '/map?neighborhood=brickell' },
              { bg: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.34.40%E2%80%AFPM-ZdxO8b0IP4gFzwYPxlmOfFTLS6OGuY.png', name: 'Wynwood', price: 'From $2,200', link: '/map?neighborhood=wynwood' },
              { bg: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.38.24%E2%80%AFPM.png-C6ysCh1CAGzrOi7ivCOVLJTCWhFokI.jpeg', name: 'Edgewater', price: 'From $2,100', link: '/map?neighborhood=edgewater' },
              { bg: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.41.20%E2%80%AFPM.png-6rvSsbBMrjH0sS02nFjhvTWWW0Jt1E.jpeg', name: 'Downtown', price: 'From $2,000', link: '/map?neighborhood=downtown' },
              { bg: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.47.08%E2%80%AFPM-ZtrGk3664gXnLZIQZTlI374n4AcxOt.png', name: 'Midtown', price: 'From $2,250', link: '/map?neighborhood=midtown' },
              { bg: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-07-18%20at%204.47.41%E2%80%AFPM.png-8JILMw3ZIOOoo1Vww651TGRuXyncEB.jpeg', name: 'Coconut Grove', price: 'From $2,400', link: '/map?neighborhood=coconut-grove' },
            ].map((h) => (
              <a key={h.name} href={h.link} className="m-hood" style={{ backgroundImage: `url(${h.bg})` }}>
                <div className="m-hood-overlay" />
                <div className="m-hood-label"><b>{h.name}</b><small>{h.price}</small></div>
              </a>
            ))}
          </div>
        </div>

        {/* WHY MAG */}
        <div className="m-section">
          <div className="m-sec-label">Why MAG™</div>
          <h2 className="m-h2">Ads are what they sell.<br />Deals are what I find.</h2>
          <div className="m-why-card">
            {[
              'Live pricing across 108+ buildings',
              'Net effective rent — the real number',
              'One human, my number, straight answers',
              'I negotiate, book tours, chase paperwork',
            ].map((item) => (
              <div className="m-check-row" key={item}>
                <span className="m-ck">✓</span>
                <span>{item}</span>
              </div>
            ))}
            <p className="m-why-foot">
              Listing sites promote whoever pays them. I track the whole market and only win when you sign somewhere you love.
            </p>
          </div>
        </div>

        {/* REVIEWS */}
        <div className="m-section">
          <div className="m-sec-label">Recent wins</div>
          <h2 className="m-h2">Renters keep the receipts.</h2>
          <div className="m-reviews">
            {[
              { text: '"Texted budget at 9pm, had 5 quotes with net pricing by morning."', name: 'Jessica M.', loc: 'Brickell', init: 'JM', color: '#19C6C0' },
              { text: '"Relocated from NYC sight unseen. Zero fees, zero stress."', name: 'Carlos R.', loc: 'Edgewater', init: 'CR', color: '#FF4D8D' },
              { text: '"Sent me a sheet with move-in costs down to the dollar."', name: 'Aisha T.', loc: 'Wynwood', init: 'AT', color: '#FFC24B' },
            ].map((r) => (
              <div className="m-review" key={r.name}>
                <div className="m-stars">★★★★★</div>
                <p>{r.text}</p>
                <div className="m-review-by">
                  <div className="m-review-av" style={{ background: r.color, color: r.color === '#FFC24B' ? '#0B1220' : '#fff' }}>{r.init}</div>
                  <div><b>{r.name}</b> <small>· {r.loc}</small></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="m-final">
          <div className="m-sec-label" style={{ textAlign: 'center' }}>Ready when you are</div>
          <h2 className="m-h2" style={{ fontSize: '24px' }}>Your next place is one text away.</h2>
          <a href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment" className="m-cta-primary" style={{ maxWidth: '260px', margin: '0 auto 12px' }}>Text Don now</a>
          <div className="m-sms-line">(407) 765-7306<small>budget · beds · move date</small></div>
        </div>

        {/* FOOTER */}
        <div className="m-footer">
          <div>
            <div className="m-foot-logo">MAG<span>™</span></div>
            <small>Free for renters, paid by buildings.<br />305 International Realty<br />© 2026 Miami Apartment Guy</small>
          </div>
          <div className="m-foot-links">
            <a href="/map">View map</a>
            <a href="#how">How it works</a>
          </div>
        </div>

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
