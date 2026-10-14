import { writeFileSync } from 'node:fs'

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
if (!token) throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')

const BUILDINGS = [
  ['flagler-on-the-river', 'Flagler on the River', 'Downtown', '340 W Flagler St, Miami, FL 33130'],
  ['central-tower', 'Central Tower', 'Downtown', '46 NE 6th St, Miami, FL 33132'],
  ['square-station', 'Square Station', 'Downtown', '1424 NE Miami Pl, Miami, FL 33132'],
  ['melody-tower', 'Melody Tower', 'Downtown', '245 NE 14th St, Miami, FL 33132'],
  ['miami-plaza', 'Miami Plaza', 'Downtown', '1500 NE Miami Pl, Miami, FL 33132'],
  ['downtown-5th', 'Downtown 5th', 'Downtown', '55 NE 5th St, Miami, FL 33132'],
  ['downtown-1st', 'Downtown 1st', 'Downtown', '30 SW 1st St, Miami, FL 33130'],
  ['22-skyview', '22 Skyview', 'Edgewater', '425 NE 22nd St, Miami, FL 33137'],
  ['23-biscayne-bay', '23 Biscayne Bay', 'Edgewater', '601 NE 23rd St, Miami, FL 33137'],
  ['urban-22', 'Urban 22', 'Edgewater', '2220 NE 2nd Ave, Miami, FL 33137'],
  ['second-plaza', 'Second Plaza', 'Edgewater', '222 NE 25th St, Miami, FL 33137'],
  ['25-biscayne-park', '25 Biscayne Park', 'Edgewater', '250 NE 25th St, Miami, FL 33137'],
  ['1800-biscayne-plaza', '1800 Biscayne Plaza', 'Edgewater', '275 NE 18th St, Miami, FL 33132'],
  ['25-mirage', '25 Mirage', 'Edgewater', '162 NE 25th St, Miami, FL 33137'],
  ['oak-plaza', 'Oak Plaza', 'Allapattah', '1415 NW 15th Ave, Miami, FL 33125'],
  ['one-plaza-west-brickell', 'One Plaza West Brickell', 'Brickell', '1800 SW 1st Ave, Miami, FL 33129'],
]

const MIAMI_DADE = { minLng: -80.874, maxLng: -80.118, minLat: 25.137, maxLat: 25.979 }
const MAX_MILES = 0.15

function miles(a, b) {
  const R = 3958.8
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

async function mapbox(address) {
  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward')
  url.searchParams.set('q', address)
  url.searchParams.set('country', 'us')
  url.searchParams.set('types', 'address')
  url.searchParams.set('proximity', '-80.1918,25.7617')
  url.searchParams.set('limit', '1')
  url.searchParams.set('access_token', token)
  const res = await fetch(url)
  if (!res.ok) return { error: `mapbox ${res.status}` }
  const feature = (await res.json()).features?.[0]
  if (!feature) return { error: 'no mapbox result' }
  const [lng, lat] = feature.geometry.coordinates
  return {
    lat,
    lng,
    matched: feature.properties.full_address,
    matchCode: feature.properties.match_code?.confidence,
    accuracy: feature.properties.coordinates?.accuracy,
  }
}

async function census(address) {
  const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
  url.searchParams.set('address', address)
  url.searchParams.set('benchmark', 'Public_AR_Current')
  url.searchParams.set('format', 'json')
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const match = (await res.json()).result?.addressMatches?.[0]
    return match ? { lat: match.coordinates.y, lng: match.coordinates.x, matched: match.matchedAddress } : null
  } catch {
    return null
  }
}

const results = []
for (const [id, name, neighborhood, address] of BUILDINGS) {
  const m = await mapbox(address)
  const c = await census(address)
  const reasons = []
  if (m.error) reasons.push(m.error)
  else {
    const streetNumber = address.split(' ')[0]
    if (!m.matched?.startsWith(streetNumber)) reasons.push(`street number mismatch (${m.matched})`)
    if (!['exact', 'high'].includes(m.matchCode)) reasons.push(`match confidence ${m.matchCode}`)
    const inDade = m.lat >= MIAMI_DADE.minLat && m.lat <= MIAMI_DADE.maxLat && m.lng >= MIAMI_DADE.minLng && m.lng <= MIAMI_DADE.maxLng
    if (!inDade) reasons.push('outside Miami-Dade')
    if (c) {
      const d = miles(m, c)
      if (d > MAX_MILES) reasons.push(`mapbox vs census ${d.toFixed(2)} mi apart`)
    } else {
      reasons.push('no independent census match to cross-check')
    }
  }
  results.push({ id, name, neighborhood, address, lat: m.lat, lng: m.lng, matched: m.matched, matchCode: m.matchCode, accuracy: m.accuracy, census: c, status: reasons.length ? 'FLAG' : 'PASS', reasons })
}

writeFileSync('scripts/geocode-results.json', JSON.stringify(results, null, 2))
for (const r of results) {
  console.log(`${r.status}  ${r.id}  ${r.lat?.toFixed(6)},${r.lng?.toFixed(6)}  [${r.accuracy}/${r.matchCode}]  ${r.reasons.join('; ')}`)
}
