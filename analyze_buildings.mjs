import fs from 'fs';
import { execSync } from 'child_process';

// Extract building data from buildings.ts using grep and sed to pull out name, neighborhood, lat, lng
const buildingsFile = fs.readFileSync('lib/buildings.ts', 'utf-8');

// Parse the buildings array - look for patterns like: id: "1", name: '...', neighborhood: '...', lat: X, lng: Y
const buildingPattern = /id:\s*"([^"]+)",\s*name:\s*'([^']+)',\s*neighborhood:\s*'([^']+)',[^}]*?lat:\s*([-\d.]+),[^}]*?lng:\s*([-\d.]+)/g;

const buildings = [];
let match;
while ((match = buildingPattern.exec(buildingsFile)) !== null) {
  buildings.push({
    id: match[1],
    name: match[2],
    neighborhood: match[3],
    lat: parseFloat(match[4]),
    lng: parseFloat(match[5])
  });
}

console.log('[v0] BUILDINGS DATASET ANALYSIS\n');
console.log(`Total buildings parsed: ${buildings.length}\n`);

// Check for missing lat/lng
const missingCoords = buildings.filter(b => !b.lat || !b.lng || isNaN(b.lat) || isNaN(b.lng));
console.log(`Buildings with missing/invalid lat/lng: ${missingCoords.length}`);
if (missingCoords.length > 0) {
  missingCoords.forEach(b => console.log(`  - ${b.name} (neighborhood: ${b.neighborhood})`));
}

// Group by neighborhood and count
const byNeighborhood = {};
buildings.forEach(b => {
  if (!byNeighborhood[b.neighborhood]) {
    byNeighborhood[b.neighborhood] = [];
  }
  byNeighborhood[b.neighborhood].push(b);
});

console.log(`\nNeighborhoods: ${Object.keys(byNeighborhood).length}`);
console.log('\nBuildings per neighborhood (sorted by count):');
Object.entries(byNeighborhood)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([hood, bldgs]) => {
    console.log(`  ${hood}: ${bldgs.length} buildings`);
  });

// Find neighborhoods with ≤2 buildings (unreliable centroid)
console.log('\nNeighborhoods with ≤2 buildings (unreliable centroid):');
Object.entries(byNeighborhood)
  .filter(([_, bldgs]) => bldgs.length <= 2)
  .sort((a, b) => a[1].length - b[1].length)
  .forEach(([hood, bldgs]) => {
    console.log(`  ${hood}: ${bldgs.length} building(s)`);
    bldgs.forEach(b => console.log(`    - ${b.name}`));
  });

// Check lat/lng ranges (Miami area is roughly 25.7-26.1 N, -80.3 to -80.0 W)
console.log('\nBuildings with lat/lng outside expected Miami area (25.5-26.3 N, -80.5 to -79.9 W):');
const outOfRange = buildings.filter(b => 
  b.lat < 25.5 || b.lat > 26.3 || b.lng > -79.9 || b.lng < -80.5
);
if (outOfRange.length > 0) {
  outOfRange.forEach(b => console.log(`  - ${b.name}: ${b.lat}, ${b.lng}`));
} else {
  console.log('  None - all coordinates are within expected range');
}

// Check for missing neighborhood field
console.log('\nBuildings with missing/empty neighborhood field:');
const noHood = buildings.filter(b => !b.neighborhood || b.neighborhood.trim() === '');
if (noHood.length > 0) {
  noHood.forEach(b => console.log(`  - ${b.name}`));
} else {
  console.log('  None - all buildings have neighborhood assigned');
}

// List all unique neighborhoods for comparison
console.log('\nAll unique neighborhoods in data (sorted):');
Object.keys(byNeighborhood)
  .sort()
  .forEach(hood => console.log(`  ${hood}`));
