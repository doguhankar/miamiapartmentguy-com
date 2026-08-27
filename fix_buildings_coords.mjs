import fs from 'fs'

let content = fs.readFileSync('lib/buildings.ts', 'utf-8')

// Specific fixes for Brickell, Downtown, Wynwood
const fixes = [
  // Brickell fixes
  ["name: 'Maizon', neighborhood: 'Brickell', address: '221 SW 12th St, Miami, FL 33130', lat: 25.7528, lng: -80.1958,",
   "name: 'Maizon', neighborhood: 'Brickell', address: '221 SW 12th St, Miami, FL 33130', lat: 25.7528, lng: -80.1858,"],
  
  ["name: 'Flow Brickell', neighborhood: 'Brickell', address: '275 SW 6th St, Miami, FL 33130', lat: 25.7684, lng: -80.1990,",
   "name: 'Flow Brickell', neighborhood: 'Brickell', address: '275 SW 6th St, Miami, FL 33130', lat: 25.7684, lng: -80.1890,"],
  
  // Downtown fix
  ["name: 'Parkline', neighborhood: 'Downtown', address: '100 NW 6th St, Miami, FL 33136', lat: 25.7781, lng: -80.1997,",
   "name: 'Parkline', neighborhood: 'Downtown', address: '100 NW 6th St, Miami, FL 33136', lat: 25.7781, lng: -80.1897,"],
  
  // Wynwood fixes (all shift -80.199x to -80.189x, some special cases)
  ["name: 'The Dorsey', neighborhood: 'Wynwood', address: '27 NW 28th St, Miami, FL 33127', lat: 25.7975, lng: -80.1970,",
   "name: 'The Dorsey', neighborhood: 'Wynwood', address: '27 NW 28th St, Miami, FL 33127', lat: 25.7975, lng: -80.1870,"],
  
  ["name: 'Wynwood 25', neighborhood: 'Wynwood', address: '2530 NW 25th St, Miami, FL 33142', lat: 25.7978, lng: -80.1992,",
   "name: 'Wynwood 25', neighborhood: 'Wynwood', address: '2530 NW 25th St, Miami, FL 33142', lat: 25.7978, lng: -80.1892,"],
  
  ["name: 'Joule House', neighborhood: 'Wynwood', address: '2525 NW 31st St, Miami, FL 33142', lat: 25.7980, lng: -80.1990,",
   "name: 'Joule House', neighborhood: 'Wynwood', address: '2525 NW 31st St, Miami, FL 33142', lat: 25.7980, lng: -80.1890,"],
  
  ["name: 'Amara Wynwood', neighborhood: 'Wynwood', address: '2600 NW 30th St, Miami, FL 33142', lat: 25.7985, lng: -80.1995,",
   "name: 'Amara Wynwood', neighborhood: 'Wynwood', address: '2600 NW 30th St, Miami, FL 33142', lat: 25.7985, lng: -80.1895,"],
  
  ["name: 'Strata Wynwood', neighborhood: 'Wynwood', address: '2629 NW 24th St, Miami, FL 33142', lat: 25.7987, lng: -80.1997,",
   "name: 'Strata Wynwood', neighborhood: 'Wynwood', address: '2629 NW 24th St, Miami, FL 33142', lat: 25.7987, lng: -80.1897,"],
  
  ["name: 'AMLI Wynwood', neighborhood: 'Wynwood', address: '2710 NW 27th St, Miami, FL 33142', lat: 25.7988, lng: -80.1980,",
   "name: 'AMLI Wynwood', neighborhood: 'Wynwood', address: '2710 NW 27th St, Miami, FL 33142', lat: 25.7988, lng: -80.1880,"],
  
  ["name: 'The Highley House', neighborhood: 'Wynwood', address: '2730 NW 25th St, Miami, FL 33142', lat: 25.7990, lng: -80.1998,",
   "name: 'The Highley House', neighborhood: 'Wynwood', address: '2730 NW 25th St, Miami, FL 33142', lat: 25.7990, lng: -80.1898,"],
  
  ["name: 'Wynd 27 & Wynd 28', neighborhood: 'Wynwood', address: '2751 NW 27th St, Miami, FL 33142', lat: 25.7992, lng: -80.2000,",
   "name: 'Wynd 27 & Wynd 28', neighborhood: 'Wynwood', address: '2751 NW 27th St, Miami, FL 33142', lat: 25.7992, lng: -80.1900,"],
  
  ["name: 'Flow Wynwood', neighborhood: 'Wynwood', address: '2925 NW 28th St, Miami, FL 33142', lat: 25.7995, lng: -80.1975,",
   "name: 'Flow Wynwood', neighborhood: 'Wynwood', address: '2925 NW 28th St, Miami, FL 33142', lat: 25.7995, lng: -80.1875,"],
  
  ["name: 'Artem', neighborhood: 'Wynwood', address: '3000 NW 29th St, Miami, FL 33142', lat: 25.7998, lng: -80.1978,",
   "name: 'Artem', neighborhood: 'Wynwood', address: '3000 NW 29th St, Miami, FL 33142', lat: 25.7998, lng: -80.1878,"],
  
  ["name: 'Wynwood Plaza Residences', neighborhood: 'Wynwood', address: '3140 NW 30th St, Miami, FL 33142', lat: 25.8000, lng: -80.1985,",
   "name: 'Wynwood Plaza Residences', neighborhood: 'Wynwood', address: '3140 NW 30th St, Miami, FL 33142', lat: 25.8000, lng: -80.1885,"],
  
  ["name: '29 WYN', neighborhood: 'Wynwood', address: '2901 NW 29th St, Miami, FL 33142', lat: 25.8005, lng: -80.2002,",
   "name: '29 WYN', neighborhood: 'Wynwood', address: '2901 NW 29th St, Miami, FL 33142', lat: 25.8005, lng: -80.1902,"],
]

let fixed = 0
fixes.forEach(([old, newVal]) => {
  if (content.includes(old)) {
    content = content.replace(old, newVal)
    fixed++
  } else {
    console.log(`[warning] Could not find: ${old.substring(0, 50)}...`)
  }
})

// Delete far suburbs - remove entire building objects
const toDelete = [
  'Villa Laguna', 'The Gardens', 'Aura North Miami Beach', 'Soleste Nomi Beach',
  'The Shoreline at Sole Mia', 'Arvella', 'Avida Aventura', 'Blu Aventura', 'Modera Aventura',
  'Alvista Hollywood', 'The Tropic', 'Circ Residences', 'Bread Building', '1818 Park',
  'Hollywood Heights on The Boulevard', 'Town Hollywood', '101 Dania Beach', 'Elevate Dania Beach',
  'Avery Dania Pointe East', 'Soleste Seaside', 'Leksa at Cityplace', 'Century Town Center',
  'Casero', 'Palmera', 'Sanctuary Doral', 'Palms of Doral', 'The Landmark South', 'AMLI 8800',
  'Gran Vista at Doral', 'Cordoba', 'Elemi at Grove Village', 'Grove Central Residences',
  'Cascade Link at Douglas', 'Platform 3750', 'Core at Link', 'Zoi House Grove', 'MB Station',
  'The Mile Coral Gables', 'Grove Station Tower', 'Modera Douglas Station', 'Berkshire Coral Gables',
  'Society Las Olas', 'Flow Fort Lauderdale', '10x Riverwalk', 'Gables Riverwalk', 'Hanover Riverwalk',
  'Veneto Las Olas', 'Icon Las Olas', 'The Registry', 'Coasterra', 'Alluvion', 'Novo Las Olas',
  '10x Las Olas Walk', 'Rivr Lofts', 'Harbour at New River'
]

let deleted = 0
toDelete.forEach(name => {
  // Match building object with this name and remove it
  const regex = new RegExp(`\\s*\\{\\s*id:\\s*"[^"]*",\\s*name:\\s*'${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}',\\s*[^}]*\\},?`, 'g')
  const matches = content.match(regex)
  if (matches) {
    content = content.replace(regex, '')
    deleted += matches.length
  }
})

// Clean up excess whitespace
content = content.replace(/\n\s*\n\s*\n/g, '\n\n')

fs.writeFileSync('lib/buildings.ts', content)

console.log(`[v0] Applied fixes:`)
console.log(`  - Fixed coordinates: ${fixed} buildings`)
console.log(`  - Deleted out-of-bounds: ${deleted} buildings`)

const remaining = content.match(/\{\s*id:\s*"/g)?.length || 0
console.log(`  - Remaining buildings: ${remaining}`)
