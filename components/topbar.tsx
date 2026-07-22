'use client'

import Link from 'next/link'

export default function Topbar() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '61px',
        background: '#0B1220',
        borderBottom: '1px solid #223252',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 900,
          fontSize: '20px',
          lineHeight: '1',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ color: '#E9EDF6' }}>Miami Apartment</span>
        <span style={{ color: '#FF4D8D' }}>
          Guy<sup style={{ fontSize: '11px', marginLeft: '2px' }}>™</sup>
        </span>
      </Link>

      {/* Right buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Agent Login button */}
        <Link
          href="/agent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid #19C6C0',
            color: '#19C6C0',
            fontFamily: "'Archivo', sans-serif",
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(25, 198, 192, 0.08)'
            e.currentTarget.style.borderColor = '#19C6C0'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = '#19C6C0'
          }}
        >
          Agent Login
        </Link>

        {/* View Map button */}
        <Link
          href="/map"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 24px',
            borderRadius: '8px',
            background: '#FF4D8D',
            color: '#0B1220',
            fontFamily: "'Archivo', sans-serif",
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          View Map
        </Link>
      </div>
    </nav>
  )
}
