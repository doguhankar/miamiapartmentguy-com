'use client'

import { useState, useMemo } from 'react'
import { buildings, Building } from '@/lib/buildings'
import { MapView } from '@/components/map-view'
import { DesktopBuildingCard } from '@/components/desktop-building-card'

const THEME = {
  INK: '#0B1220',
  PAPER: '#FFFFFF',
  LINE: '#E0E0E0',
  AQUA: '#06B6D4',
  SUN: '#FFC107',
  FLAME: '#FF6B35',
}

export default function MapPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [neighborhood, setNeighborhood] = useState<string>('All')
  const [beds, setBeds] = useState<string>('Any')
  const [priceRange, setPriceRange] = useState<string>('Any')

  const filtered = useMemo(() => {
    return buildings.filter((b) => {
      if (neighborhood !== 'All' && b.neighborhood !== neighborhood) return false
      if (beds !== 'Any') {
        const bedsNum = parseInt(beds)
        if (bedsNum === 3) {
          if (!b.units.includes('3B')) return false
        } else {
          if (!b.units.find((u) => u.startsWith(`${bedsNum}B`))) return false
        }
      }
      if (priceRange !== 'Any') {
        const price = b.priceMin
        if (priceRange === '<2.5k' && price >= 2500) return false
        if (priceRange === '2.5k-3.5k' && (price < 2500 || price > 3500)) return false
        if (priceRange === '3.5k-5k' && (price < 3500 || price > 5000)) return false
        if (priceRange === '5k+' && price < 5000) return false
      }
      return true
    })
  }, [neighborhood, beds, priceRange])

  return (
    <div style={{ background: THEME.INK, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header/Nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: `1px solid ${THEME.LINE}`,
          background: 'rgba(11,18,32,.95)',
          backdropFilter: 'blur(14px)',
          zIndex: 60,
        }}
      >
        <h1 style={{ color: THEME.PAPER, fontSize: '18px', fontWeight: 700, margin: 0 }}>Miami Apartment Guy</h1>
        <button
          style={{
            background: THEME.FLAME,
            color: THEME.PAPER,
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Text Don
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: `1px solid ${THEME.LINE}`,
          background: 'rgba(11,18,32,.92)',
          backdropFilter: 'blur(14px)',
          zIndex: 55,
          flexShrink: 0,
        }}
      >
        <select
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: `1px solid ${THEME.LINE}`,
            background: THEME.PAPER,
            color: THEME.INK,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <option value="All">All Neighborhoods</option>
          <option value="Brickell">Brickell</option>
          <option value="Downtown">Downtown</option>
          <option value="Edgewater">Edgewater</option>
          <option value="Wynwood">Wynwood</option>
          <option value="Midtown">Midtown</option>
        </select>

        <select
          value={beds}
          onChange={(e) => setBeds(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: `1px solid ${THEME.LINE}`,
            background: THEME.PAPER,
            color: THEME.INK,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <option value="Any">Any Beds</option>
          <option value="0">Studio</option>
          <option value="1">1 Bed</option>
          <option value="2">2 Bed</option>
          <option value="3">3 Bed</option>
        </select>

        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: `1px solid ${THEME.LINE}`,
            background: THEME.PAPER,
            color: THEME.INK,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <option value="Any">Any Price</option>
          <option value="<2.5k">Under $2.5k</option>
          <option value="2.5k-3.5k">$2.5k - $3.5k</option>
          <option value="3.5k-5k">$3.5k - $5k</option>
          <option value="5k+">$5k+</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#9CA3AF' }}>
          <span style={{ fontWeight: 900, color: THEME.SUN, fontSize: '16px' }}>{filtered.length}</span> buildings live
        </div>
      </div>

      {/* Map + List Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 520px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Map */}
        <MapView
          selectedBuilding={selectedBuilding}
          buildings={filtered}
          onSelectBuilding={setSelectedBuilding}
        />

        {/* Buildings List */}
        <div
          style={{
            background: THEME.INK,
            borderLeft: `1px solid ${THEME.LINE}`,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '16px',
          }}
        >
          {filtered.map((building) => (
            <DesktopBuildingCard
              key={building.id}
              building={building}
              selected={selectedBuilding?.id === building.id}
              onSelect={() => setSelectedBuilding(building)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
