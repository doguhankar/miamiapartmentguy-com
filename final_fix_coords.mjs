import fs from 'fs'

let content = fs.readFileSync('lib/buildings.ts', 'utf-8')

// Simple global replacements for specific longitude fixes
const replacements = [
  // Brickell
  [', lng: -80.1958, priceMin: 2235,', ', lng: -80.1858, priceMin: 2235,'], // Maizon
  [', lng: -80.1990, priceMin: 2841,', ', lng: -80.1890, priceMin: 2841,'], // Flow Brickell
  
  // Downtown
  [', lng: -80.1997, priceMin: 2120,', ', lng: -80.1897, priceMin: 2120,'], // Parkline
]

replacements.forEach(([old, newVal]) => {
  content = content.replace(old, newVal)
})

fs.writeFileSync('lib/buildings.ts', content)
console.log('[v0] Fixed Brickell and Downtown coordinates')

// Now remove all non-core Miami buildings (those with lat > 25.82)
const lines = content.split('\n')
const filtered = []
let inBuildingObj = false
let currentBuildingLines = []

lines.forEach((line, i) => {
  if (line.includes('{ id:')) {
    inBuildingObj = true
    currentBuildingLines = [line]
  } else if (inBuildingObj) {
    currentBuildingLines.push(line)
    // Check if this completes the building
    if (line.match(/\},?\s*$/)) {
      inBuildingObj = false
      // Check if building is in core Miami range (25.71-25.82)
      const buildingStr = currentBuildingLines.join('\n')
      const latMatch = buildingStr.match(/lat:\s*([\d.]+)/)
      if (latMatch) {
        const lat = parseFloat(latMatch[1])
        if (lat >= 25.71 && lat <= 25.82) {
          filtered.push(...currentBuildingLines)
        }
      }
    }
  } else {
    filtered.push(line)
  }
})

fs.writeFileSync('lib/buildings.ts', filtered.join('\n'))
console.log('[v0] Filtered to core Miami buildings (lat 25.71-25.82)')
