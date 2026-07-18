'use client'

export default function HomePage() {
  return (
    <div style={{ background: '#0B1220', color: '#F6F8F9', fontFamily: "'Space Grotesk', sans-serif" }}>
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
      `}</style>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-track">
          <b>LIVE</b> Flow Brickell — 1BD from $2,650 · 2 months free &nbsp;✦&nbsp; <b>LIVE</b> Edgewater — Studios from $2,100 · waived admin &nbsp;✦&nbsp; <b>LIVE</b> Wynwood — 2BD from $3,400 · 6 weeks free &nbsp;✦&nbsp; <b>LIVE</b> Downtown — 1BD from $2,350 · $1,000 off first month &nbsp;✦&nbsp; <b>LIVE</b> Flow Brickell — 1BD from $2,650 · 2 months free &nbsp;✦&nbsp; <b>LIVE</b> Edgewater — Studios from $2,100 · waived admin &nbsp;✦&nbsp; <b>LIVE</b> Wynwood — 2BD from $3,400 · 6 weeks free &nbsp;✦&nbsp; <b>LIVE</b> Downtown — 1BD from $2,350 · $1,000 off first month &nbsp;✦&nbsp;
        </div>
      </div>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11,18,32,.85)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.12)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
          <a href="#" style={{ fontFamily: 'Archivo', fontVariationSettings: "'wdth' 125", fontWeight: 900, fontSize: '20px', textTransform: 'uppercase' }}>
            Miami Apartment <span style={{ color: '#FF4D8D' }}>Guy</span>™
          </a>
          <a href="/map" className="btn btn-pink">View Map</a>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ position: 'relative', padding: '90px 0 70px', overflow: 'hidden', background: '#0B1220' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(700px 420px at 85% 0%, rgba(255,77,141,.22), transparent 60%), radial-gradient(600px 400px at 0% 100%, rgba(25,198,192,.18), transparent 60%)' }} />
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px', position: 'relative', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '56px', alignItems: 'center' }}>
          <div>
            <div className="eyebrow">Free for renters · Paid by the buildings</div>
            <h1 style={{ fontFamily: 'Archivo', fontVariationSettings: "'wdth' 120", fontSize: 'clamp(44px, 6.4vw, 84px)', lineHeight: 0.95, margin: '18px 0 22px', fontWeight: 900 }}>
              Every building.<br />Every deal.<br /><span style={{ color: '#FF4D8D' }}>One</span> <span style={{ color: '#19C6C0' }}>text.</span>
            </h1>
            <p style={{ fontSize: '19px', color: '#B8C4D4', maxWidth: '52ch', marginBottom: '32px' }}>
              I track live pricing across Miami and Broward buildings. Text your budget, get real quotes same day. Net effective rent, move-in costs, everything.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment" className="btn btn-pink">💬 Text me your budget</a>
              <a href="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '999px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', border: '1px solid rgba(255,255,255,.12)', color: '#F6F8F9', background: 'transparent', transition: 'transform 0.15s, border-color 0.15s, color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#19C6C0'; e.currentTarget.style.color = '#19C6C0'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = '#F6F8F9'; e.currentTarget.style.transform = 'none'; }}>Browse the map →</a>
            </div>
            <div style={{ fontSize: '13px', color: '#7E8CA0', marginTop: '14px' }}>No fees. No spam. No "create an account to see prices." Ever.</div>
          </div>

          {/* PHONE MOCK */}
          <div style={{ background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '28px', padding: '22px', boxShadow: '0 30px 80px rgba(0,0,0,.5)', maxWidth: '380px', marginLeft: 'auto' }}>
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
      <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', borderBottom: '1px solid rgba(255,255,255,.12)', padding: '28px 0' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
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
              { tag: 'Step 1', icon: '💬', title: 'Text your budget', desc: 'One message: budget, beds, neighborhoods, move date. That\'s the whole application.' },
              { tag: 'Step 2', icon: '📋', title: 'Get real quotes', desc: 'I send formatted quotes with gross rent, concessions, net effective rent, and total move-in cost — straight from my building contacts.' },
              { tag: 'Step 3', icon: '🔑', title: 'Tour & sign', desc: 'I book your tours, negotiate the deal, and walk you to the lease. The building pays me. You pay nothing.' }
            ].map((item, i) => (
              <div key={i} style={{ background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '20px', padding: '32px 28px', position: 'relative', transition: 'border-color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#19C6C0')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)')}>
                <div style={{ position: 'absolute', top: '22px', right: '22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: '#FF4D8D', textTransform: 'uppercase' }}>{item.tag}</div>
                <div style={{ fontSize: '30px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 className="display" style={{ fontSize: '18px', marginBottom: '10px', fontVariationSettings: "'wdth' 115" }}>{item.title}</h3>
                <p style={{ color: '#B8C4D4', fontSize: '15px' }}>{item.desc}</p>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { g: 'linear-gradient(135deg, #1B3B6F, #19C6C0)', name: 'Brickell', desc: 'High-rise living · from $2,300' },
              { g: 'linear-gradient(135deg, #FF4D8D, #FF8E53)', name: 'Wynwood', desc: 'Art & nightlife · from $2,200' },
              { g: 'linear-gradient(135deg, #3E2F8F, #FF4D8D)', name: 'Edgewater', desc: 'Bay views · from $2,100' },
              { g: 'linear-gradient(135deg, #0E5E6F, #FFC24B)', name: 'Downtown', desc: 'Walk everywhere · from $2,000' },
              { g: 'linear-gradient(135deg, #233A7D, #8E54E9)', name: 'Midtown', desc: 'Best of both · from $2,250' },
              { g: 'linear-gradient(135deg, #FF6B6B, #FFC24B)', name: 'Coconut Grove', desc: 'Lush & quiet · from $2,400' },
              { g: 'linear-gradient(135deg, #11998E, #38EF7D)', name: 'Coral Gables', desc: 'Classic Miami · from $2,300' },
              { g: 'linear-gradient(135deg, #FC5C7D, #6A82FB)', name: 'Miami Beach', desc: 'Ocean life · from $2,200' }
            ].map((hood, i) => (
              <a key={i} href="#" style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', aspectRatio: '4/5', display: 'flex', alignItems: 'flex-end', padding: '20px', border: '1px solid rgba(255,255,255,.12)', transition: 'transform 0.2s', background: hood.g, cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(11,18,32,.92))', pointerEvents: 'none' }} />
                <h3 className="display" style={{ fontFamily: 'Archivo', fontVariationSettings: "'wdth' 118", textTransform: 'uppercase', fontSize: '19px', position: 'relative', zIndex: 2 }}>{hood.name}</h3>
                <small style={{ position: 'relative', zIndex: 2, color: '#D7E2EE', fontSize: '12px' }}>{hood.desc}</small>
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
                {['Show 10–30% of what\'s actually available', 'Stale pricing, no concessions shown', 'Your info sold to a call-center funnel', 'You do all the legwork yourself'].map((item, i) => (
                  <li key={i} style={{ padding: '10px 0', borderBottom: 'rgba(0,0,0,.08) 1px solid', fontSize: '15px', display: 'flex', gap: '10px' }}>❌ {item}</li>
                ))}
              </ul>
            </div>

            <div style={{ borderRadius: '20px', padding: '34px', background: '#0B1220', color: '#F6F8F9', boxShadow: '0 24px 60px rgba(11,18,32,.35)' }}>
              <h3 className="display" style={{ fontFamily: 'Archivo', textTransform: 'uppercase', fontVariationSettings: "'wdth' 115", fontSize: '20px' }}>Miami Apartment <span style={{ color: '#FF4D8D' }}>Guy™</span></h3>
              <ul style={{ listStyle: 'none', marginTop: '18px' }}>
                {['Live pricing across 108+ buildings, updated daily', 'Net effective rent — the real number after concessions', 'One human. My number. Straight answers.', 'I negotiate, book tours, and chase the paperwork'].map((item, i) => (
                  <li key={i} style={{ padding: '10px 0', borderBottom: 'rgba(255,255,255,.12) 1px solid', fontSize: '15px', display: 'flex', gap: '10px' }}>✅ {item}</li>
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
              { stars: '★★★★★', text: '"Texted Don a budget at 9pm, had five quotes with net pricing by morning. Signed at Flow with two months free I never would have found on my own."', name: 'Jessica M.', location: 'Brickell', initials: 'JM', bg: '#19C6C0' },
              { stars: '★★★★★', text: '"Relocated from NYC sight unseen. Don FaceTimed me through three tours and negotiated my admin fee to zero. Didn\'t pay him a dime."', name: 'Carlos R.', location: 'Edgewater', initials: 'CR', bg: '#FF4D8D' },
              { stars: '★★★★★', text: '"Every other \'locator\' sent me a Zillow link. Don sent me a quote sheet with move-in costs down to the dollar. Different level."', name: 'Aaliyah T.', location: 'Wynwood', initials: 'AT', bg: '#FFC24B' }
            ].map((review, i) => (
              <div key={i} style={{ background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '18px', padding: '26px' }}>
                <div style={{ color: '#FFC24B', letterSpacing: '2px', marginBottom: '12px' }}>{review.stars}</div>
                <p style={{ fontSize: '15px', color: '#C9D4E2', marginBottom: '16px' }}>{review.text}</p>
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
      <section style={{ position: 'relative', textAlign: 'center', overflow: 'hidden', padding: '88px 0' }}>
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

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.12)', padding: '56px 0 32px', fontSize: '14px', color: '#7E8CA0' }}>
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
