import fs from 'fs'

const content = fs.readFileSync('lib/buildings.ts', 'utf-8')

// Extract all buildings
const buildingMatches = content.matchAll(/\{\s*id:\s*"([^"]+)",\s*name:\s*'([^']+)',\s*neighborhood:\s*'([^']+)',\s*address:\s*'([^']+)',\s*lat:\s*([\d.]+),\s*lng:\s*([\d.-]+)/gm)

const buildings = []
for (const match of buildingMatches) {
  const [, id, name, neighborhood, address, lat, lng] = match
  buildings.push({
    id,
    name,
    neighborhood,
    address,
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  })
}

console.log(`Total buildings found: ${buildings.length}\n`)

// Define expected ranges by neighborhood
const ranges = {
  'Brickell': { latMin: 25.756, latMax: 25.768, lngMin: -80.199, lngMax: -80.194, lngNote: 'West of Biscayne Bay' },
  'Downtown': { latMin: 25.765, latMax: 25.778, lngMin: -80.199, lngMax: -80.188, lngNote: 'East of Biscayne Bay' },
  'Edgewater': { latMin: 25.78, latMax: 25.81, lngMin: -80.19, lngMax: -80.18, lngNote: 'North, around bay' },
  'Wynwood': { latMin: 25.80, latMax: 25.82, lngMin: -80.19, lngMax: -80.18, lngNote: 'Northwest' },
  'Midtown': { latMin: 25.79, latMax: 25.81, lngMin: -80.195, lngMax: -80.18, lngNote: 'North central' },
  'Coconut Grove': { latMin: 25.72, latMax: 25.74, lngMin: -80.195, lngMax: -80.18, lngNote: 'South' },
  'Other': { latMin: 25.71, latMax: 25.82, lngMin: -80.2, lngMax: -80.17, lngNote: 'Flexible' }
}

// Group by neighborhood
const byNeighborhood = {}
buildings.forEach(b => {
  if (!byNeighborhood[b.neighborhood]) byNeighborhood[b.neighborhood] = []
  byNeighborhood[b.neighborhood].push(b)
})

// Audit and report
const issues = []
Object.entries(byNeighborhood).forEach(([neighborhood, nbhBuildings]) => {
  console.log(`\n=== ${neighborhood} (${nbhBuildings.length} buildings) ===`)
  const expectedRange = ranges[neighborhood] || ranges['Other']
  
  nbhBuildings.sort((a, b) => a.lat - b.lat).forEach(b => {
    const latOk = b.lat >= expectedRange.latMin && b.lat <= expectedRange.latMax
    const lngOk = b.lng >= expectedRange.lngMin && b.lng <= expectedRange.lngMax
    const ok = latOk && lngOk ? '✓' : '✗'
    
    if (!latOk || !lngOk) {
      issues.push({
        name: b.name,
        neighborhood,
        lat: b.lat,
        lng: b.lng,
        expected: expectedRange
      })
    }
    
    console.log(`${ok} ${b.name.padEnd(40)} lat: ${b.lat.toFixed(4)}, lng: ${b.lng.toFixed(4)}`)
  })
})

console.log(`\n=== ISSUES FOUND ===`)
if (issues.length === 0) {
  console.log('✓ All coordinates are within expected ranges!')
} else {
  console.log(`Found ${issues.length} coordinate issues:\n`)
  issues.forEach(issue => {
    console.log(`✗ ${issue.name} (${issue.neighborhood})`)
    console.log(`  Current:  (${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)})`)
    console.log(`  Expected: lat ${issue.expected.latMin}-${issue.expected.latMax}, lng ${issue.expected.lngMin}-${issue.expected.lngMax}`)
    console.log(`  Note: ${issue.expected.lngNote}\n`)
  })
}

console.log(`\n=== MAP ZOOM SUGGESTION ===`)
const allLats = buildings.map(b => b.lat)
const allLngs = buildings.map(b => b.lng)
const minLat = Math.min(...allLats)
const maxLat = Math.max(...allLats)
const minLng = Math.min(...allLngs)
const maxLng = Math.max(...allLngs)

console.log(`To fit all ${buildings.length} buildings:`)
console.log(`  Latitude range: ${minLat.toFixed(4)} to ${maxLat.toFixed(4)} (span: ${(maxLat - minLat).toFixed(3)}°)`)
console.log(`  Longitude range: ${minLng.toFixed(4)} to ${maxLng.toFixed(4)} (span: ${(maxLng - minLng).toFixed(3)}°)`)

const centerLat = (minLat + maxLat) / 2
const centerLng = (minLng + maxLng) / 2
console.log(`\n  Map center: ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`)
console.log(`  Map zoom: 11-12 (to fit Brickell Hammock 25.71 to Rt 195 ~25.82)`)
