import fs from 'fs'

let content = fs.readFileSync('lib/buildings.ts', 'utf-8')

// Precise replacements - match full building objects and fix just the coordinates
// Only fix the ones we identified as wrong:
// 1. Maizon: lat: 25.7528, lng: -80.1958 → lng: -80.1858
// 2. Flow Brickell: lat: 25.7684, lng: -80.1990 → lng: -80.1890  
// 3. Parkline: lat: 25.7781, lng: -80.1997 → lng: -80.1897

const fixes = [
  // Maizon - specific match to avoid collisions
  ['name: \'Maizon\', neighborhood: \'Brickell\', address: \'221 SW 12th St, Miami, FL 33130\', lat: 25.7528, lng: -80.1958,',
   'name: \'Maizon\', neighborhood: \'Brickell\', address: \'221 SW 12th St, Miami, FL 33130\', lat: 25.7528, lng: -80.1858,'],
  
  // Flow Brickell
  ['name: \'Flow Brickell\', neighborhood: \'Brickell\', address: \'275 SW 6th St, Miami, FL 33130\', lat: 25.7684, lng: -80.1990,',
   'name: \'Flow Brickell\', neighborhood: \'Brickell\', address: \'275 SW 6th St, Miami, FL 33130\', lat: 25.7684, lng: -80.1890,'],
  
  // Parkline
  ['name: \'Parkline\', neighborhood: \'Downtown\', address: \'100 NW 6th St, Miami, FL 33136\', lat: 25.7781, lng: -80.1997,',
   'name: \'Parkline\', neighborhood: \'Downtown\', address: \'100 NW 6th St, Miami, FL 33136\', lat: 25.7781, lng: -80.1897,'],
]

let fixed = 0
fixes.forEach(([old, newVal]) => {
  if (content.includes(old)) {
    content = content.replace(old, newVal)
    fixed++
  }
})

fs.writeFileSync('lib/buildings.ts', content)
console.log(`[v0] Fixed ${fixed} coordinate issues`)

// Count remaining buildings
const buildings = content.match(/\{\s*id:\s*"/g)?.length || 0
console.log(`[v0] Total buildings: ${buildings}`)
