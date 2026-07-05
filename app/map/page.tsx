'use client'

import React, { useState } from 'react'

export default function MapPage() {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null)

  const buildings = [
    { id: 'flow-brickell', name: 'Flow Brickell', price: 2841, image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f8-PjSUbS6yTrIBusqZ0XXyuU8h1qerGT.webp', neighborhood: 'Brickell', desc: 'Vibrant community, social hub, always buzzing', deal: '🔥 2 months free', amenities: ['Pool', 'Gym', 'Concierge', '+2'] },
    { id: 'modera-riverside', name: 'Modera Riverside', price: 2500, image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m10-eFibmVGaoLcW7F9yCC8Q0iDbnok5RQ.webp', neighborhood: 'Brickell', desc: 'Affordable high rise, quiet, Brickell vibes without the price tag', deal: null, amenities: ['Pool', 'Gym', 'Parking'] },
    { id: 'maizon', name: 'Maizon', price: 2235, image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m7-jNaoQBZPgAJqewPoOFl1BQiCZi739k.webp', neighborhood: 'Brickell', desc: 'Modern living, walkable Brickell, accessible pricing', deal: '💰 Best value', amenities: ['Pool', 'Gym', 'Lounge'] },
    { id: 'solitair', name: 'Solitair', price: 2654, image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s1-Cq8HWNBmCuDUjzUnemNQ0LSL3oAyf9.webp', neighborhood: 'Brickell', desc: 'Heart of Brickell, skyline views, luxury finishes', deal: null, amenities: ['Pool', 'Gym', 'Bar Lounge', 'Billiards'] },
    { id: 'miro-brickell', name: 'Miro Brickell', price: 2425, image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m1-EVGO5Tnuoa56uiQIXOy3hT9IcOEYUu.webp', neighborhood: 'Brickell', desc: 'Sleek modern, Brickell central, rooftop living', deal: null, amenities: ['Pool', 'Dog Wash', 'Yoga Studio'] },
    { id: 'brickell-first', name: 'Brickell First', price: 3045, image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b1-O2FpSvYfF1LHICzaZvBrxtxAVbC0KC.webp', neighborhood: 'Brickell', desc: 'Affordable quality, prime location, reliable community', deal: null, amenities: ['Pool', 'Spa', 'Concierge', '+1'] }
  ]

  const pins = [
    { label: '$2,100', top: '20%', left: '26%', hot: false },
    { label: '$2,350', top: '24%', left: '34%', hot: false },
    { label: '$2,300', top: '36%', left: '56%', hot: false },
    { label: '$2,800', top: '44%', left: '60%', hot: false },
    { label: '$1,950', top: '56%', left: '52%', hot: false },
    { label: '$2,410', top: '60%', left: '42%', hot: false },
    { label: '$2,300', top: '63%', left: '20%', hot: false },
    { label: 'Flow · $2,841', top: '84%', left: '50%', hot: true },
    { label: '$2,235', top: '88%', left: '40%', hot: false },
    { label: '$2,654', top: '80%', left: '58%', hot: false }
  ]

  return (
    <div style={{ background: '#0B1220', color: '#F6F8F9', fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Space+Grotesk:wght@400;500;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Space Grotesk', sans-serif; background: #0B1220; color: #F6F8F9; line-height: 1.5; }
        .display { font-family: 'Archivo', sans-serif; font-variation-settings: 'wdth' 118; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      {/* TICKER */}
      <div style={{ background: '#FF4D8D', color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '12.5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <div style={{ display: 'inline-block', padding: '8px 0', animation: 'scroll 32s linear infinite' }}>
          <b style={{ color: '#0B1220', margin: '0 6px' }}>LIVE</b> Flow Brickell — 1BD from $2,841 · 2 months free &nbsp;✦&nbsp; <b style={{ color: '#0B1220', margin: '0 6px' }}>LIVE</b> CMPND Downtown — from $1,950 · brand new &nbsp;✦&nbsp; <b style={{ color: '#0B1220', margin: '0 6px' }}>LIVE</b> The Dorsey Wynwood — from $2,100 · 6 weeks free &nbsp;✦&nbsp; <b style={{ color: '#0B1220', margin: '0 6px' }}>LIVE</b> Parkline — from $2,120 · waived admin &nbsp;✦&nbsp;
          <b style={{ color: '#0B1220', margin: '0 6px' }}>LIVE</b> Flow Brickell — 1BD from $2,841 · 2 months free &nbsp;✦&nbsp; <b style={{ color: '#0B1220', margin: '0 6px' }}>LIVE</b> CMPND Downtown — from $1,950 · brand new &nbsp;✦&nbsp; <b style={{ color: '#0B1220', margin: '0 6px' }}>LIVE</b> The Dorsey Wynwood — from $2,100 · 6 weeks free &nbsp;✦&nbsp; <b style={{ color: '#0B1220', margin: '0 6px' }}>LIVE</b> Parkline — from $2,120 · waived admin &nbsp;✦&nbsp;
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 60, background: 'rgba(11,18,32,.88)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.12)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '62px' }}>
          <a style={{ fontFamily: 'Archivo', fontVariationSettings: "'wdth' 125", fontWeight: 900, fontSize: '18px', textTransform: 'uppercase' }} href="/">
            MIAMI APARTMENT <span style={{ color: '#FF4D8D' }}>GUY</span>™
          </a>
          <a href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 20px', borderRadius: '999px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', background: '#FF4D8D', color: '#fff', boxShadow: '0 4px 20px rgba(255,77,141,.4)', transition: 'transform .15s' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
            💬 Text Don
          </a>
        </div>
      </nav>

      {/* FILTER BAR */}
      <div style={{ position: 'sticky', top: 62, zIndex: 55, background: 'rgba(11,18,32,.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.12)', padding: '14px 0' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0F1B30', border: '1px solid #19C6C0', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#19C6C0' }}>
            Neighborhood: Brickell <span style={{ fontSize: '10px', color: '#7E8CA0' }}>▼</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'border-color .15s' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#19C6C0')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)')}>
            Beds: Any <span style={{ fontSize: '10px', color: '#7E8CA0' }}>▼</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'border-color .15s' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#19C6C0')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)')}>
            Price: Any <span style={{ fontSize: '10px', color: '#7E8CA0' }}>▼</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'border-color .15s' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#19C6C0')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)')}>
            Move-in: Aug 2026 <span style={{ fontSize: '10px', color: '#7E8CA0' }}>▼</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0F1B30', border: '1px dashed rgba(255,255,255,.12)', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#7E8CA0' }}>
            ✕ Clear filters
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#7E8CA0' }}>
            <b style={{ fontFamily: 'Archivo', fontWeight: 900, color: '#FFC24B', fontSize: '16px' }}>107</b> buildings live
          </div>
        </div>
      </div>

      {/* SPLIT LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 0, height: 'calc(100vh - 140px)', minHeight: '640px' }}>
        {/* MAP */}
        <div style={{ position: 'relative', background: 'radial-gradient(500px 400px at 78% 30%, rgba(25,198,192,.10), transparent 60%), linear-gradient(150deg, #0C1626 0%, #0E1F38 55%, #0A2E3D 100%)', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,.12)' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '34%', background: 'linear-gradient(200deg, rgba(25,198,192,.16), rgba(25,198,192,.05))', borderLeft: '2px solid rgba(25,198,192,.35)' }}>
            <span style={{ position: 'absolute', top: '44%', left: '50%', transform: 'translateX(-50%) rotate(90deg)', color: 'rgba(25,198,192,.55)', fontSize: '12px', letterSpacing: '0.4em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Biscayne Bay</span>
          </div>

          <div style={{ position: 'absolute', left: 0, right: '34%', top: '38%', height: '3px', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', left: '44%', top: 0, bottom: 0, width: '3px', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', left: 0, right: '34%', top: '70%', height: '2px', background: 'rgba(255,255,255,.06)', transform: 'rotate(-4deg)' }} />

          <div style={{ position: 'absolute', top: '12%', left: '20%', color: '#7E8CA0', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>Wynwood</div>
          <div style={{ position: 'absolute', top: '30%', left: '50%', color: '#7E8CA0', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>Edgewater</div>
          <div style={{ position: 'absolute', top: '56%', left: '14%', color: '#7E8CA0', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>Little Havana</div>
          <div style={{ position: 'absolute', top: '52%', left: '48%', color: '#7E8CA0', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>Downtown</div>
          <div style={{ position: 'absolute', top: '80%', left: '44%', color: '#7E8CA0', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>Brickell</div>

          {pins.map((pin, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredPin(pin.label)}
              onMouseLeave={() => setHoveredPin(null)}
              style={{
                position: 'absolute',
                top: pin.top,
                left: pin.left,
                transform: 'translate(-50%, -100%)',
                background: hoveredPin === pin.label || pin.hot ? '#FF4D8D' : '#0F1B30',
                border: `1.5px solid ${hoveredPin === pin.label || pin.hot ? '#FF4D8D' : '#19C6C0'}`,
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                padding: '6px 12px',
                borderRadius: '999px',
                boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                cursor: 'pointer',
                transition: 'transform .15s, background .15s, border-color .15s',
                zIndex: pin.hot || hoveredPin === pin.label ? 5 : 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -100%) scale(1.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -100%)'
              }}
            >
              {pin.label}
            </div>
          ))}

          <div style={{ position: 'absolute', left: '20px', bottom: '20px', background: '#0F1B30', border: '1px solid rgba(255,255,255,.12)', borderRadius: '14px', padding: '14px 18px', fontSize: '13px', color: '#B8C4D4', maxWidth: '280px' }}>
            <b style={{ color: '#F6F8F9' }}>Tap a pin</b> for live pricing, or skip it all — text Don your budget and get quotes back today.
          </div>

          <div style={{ position: 'absolute', right: '20px', bottom: '20px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', overflow: 'hidden' }}>
            <button style={{ width: '40px', height: '40px', background: '#0F1B30', border: 'none', color: '#F6F8F9', fontSize: '18px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.12)', transition: 'color .15s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#19C6C0')} onMouseLeave={(e) => (e.currentTarget.style.color = '#F6F8F9')}>+</button>
            <button style={{ width: '40px', height: '40px', background: '#0F1B30', border: 'none', color: '#F6F8F9', fontSize: '18px', cursor: 'pointer', transition: 'color .15s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#19C6C0')} onMouseLeave={(e) => (e.currentTarget.style.color = '#F6F8F9')}>−</button>
          </div>
        </div>

        {/* LIST */}
        <div style={{ overflowY: 'auto', padding: '18px', background: '#0B1220' }}>
          {buildings.map((building) => (
            <div
              key={building.id}
              style={{
                background: '#0F1B30',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: '18px',
                overflow: 'hidden',
                marginBottom: '16px',
                transition: 'border-color .15s, transform .15s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#19C6C0'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                <img src={building.image} alt={building.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(11,18,32,.85)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '999px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {building.neighborhood}
                </span>
                {building.deal && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', background: building.deal.startsWith('💰') ? '#FFC24B' : '#FF4D8D', color: building.deal.startsWith('💰') ? '#0B1220' : '#fff', border: 'none', borderRadius: '999px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {building.deal}
                  </span>
                )}
              </div>

              <div style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  <h3 className="display" style={{ fontVariationSettings: "'wdth' 115", fontSize: '17px' }}>
                    {building.name}
                  </h3>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '11px', color: '#7E8CA0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</div>
                    <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: '19px', color: '#19C6C0' }}>${building.price}</div>
                  </div>
                </div>

                <p style={{ color: '#B8C4D4', fontSize: '13.5px', margin: '8px 0 12px' }}>
                  {building.desc}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{ background: '#152341', border: '1px solid rgba(25,198,192,.35)', color: '#19C6C0', borderRadius: '999px', padding: '4px 10px', fontSize: '11.5px' }}>
                    Studio · 1B · 2B
                  </span>
                  {building.amenities.map((amenity) => (
                    <span key={amenity} style={{ background: '#152341', borderRadius: '999px', padding: '4px 10px', fontSize: '11.5px', color: '#B8C4D4' }}>
                      {amenity}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: '#F6F8F9', borderRadius: '999px', padding: '11px 0', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'border-color .15s, color .15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#19C6C0'; e.currentTarget.style.color = '#19C6C0' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = '#F6F8F9' }}>
                    View details
                  </button>
                  <a href={`sms:+14077657306?body=Hi%20Don%2C%20I%27m%20interested%20in%20${encodeURIComponent(building.name)}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FF4D8D', color: '#fff', border: 'none', borderRadius: '999px', padding: '11px 0', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'transform .15s' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
                    💬 Text Don
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
