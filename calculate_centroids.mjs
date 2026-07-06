import fs from 'fs';

// Read buildings.ts and extract building data
const buildingsFile = fs.readFileSync('lib/buildings.ts', 'utf-8');

// Parse buildings - improved pattern to capture all fields
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

// Group by neighborhood
const byNeighborhood = {};
buildings.forEach(b => {
  if (!byNeighborhood[b.neighborhood]) {
    byNeighborhood[b.neighborhood] = [];
  }
  byNeighborhood[b.neighborhood].push(b);
});

// Calculate centroids and determine zoom levels
const neighborhoodCenters = {};

Object.entries(byNeighborhood)
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([neighborhood, bldgs]) => {
    const count = bldgs.length;
    
    // Special case: Miami Design District with 1 building
    if (neighborhood === 'Miami Design District' && count === 1) {
      const bldg = bldgs[0];
      neighborhoodCenters[neighborhood] = {
        lat: parseFloat(bldg.lat.toFixed(4)),
        lng: parseFloat(bldg.lng.toFixed(4)),
        zoom: 15,
        buildingCount: count
      };
      return;
    }
    
    // Calculate centroid (average lat/lng)
    const sumLat = bldgs.reduce((acc, b) => acc + b.lat, 0);
    const sumLng = bldgs.reduce((acc, b) => acc + b.lng, 0);
    const centerLat = sumLat / count;
    const centerLng = sumLng / count;
    
    // Calculate spread (distance from center to furthest building)
    let maxDistance = 0;
    bldgs.forEach(b => {
      const latDiff = Math.abs(b.lat - centerLat);
      const lngDiff = Math.abs(b.lng - centerLng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      if (distance > maxDistance) maxDistance = distance;
    });
    
    // Determine zoom level based on spread and count
    let zoom = 14;
    if (count <= 2) {
      zoom = 14;
    } else if (count <= 3) {
      zoom = 13;
    } else if (count <= 5) {
      zoom = maxDistance > 0.05 ? 12 : 13;
    } else if (count <= 7) {
      zoom = maxDistance > 0.08 ? 12 : 13;
    } else {
      zoom = maxDistance > 0.12 ? 11 : 13;
    }
    
    neighborhoodCenters[neighborhood] = {
      lat: parseFloat(centerLat.toFixed(4)),
      lng: parseFloat(centerLng.toFixed(4)),
      zoom: zoom,
      buildingCount: count
    };
  });

// Output as JS object
console.log('// Neighborhood centroids - calculated from building coordinates');
console.log('// Used for Mapbox flyTo calls in neighborhood/filter interactions');
console.log('export const neighborhoodCenters = {');

Object.entries(neighborhoodCenters).forEach(([name, data], idx) => {
  const comma = idx < Object.keys(neighborhoodCenters).length - 1 ? ',' : '';
  console.log(`  "${name}": { lat: ${data.lat}, lng: ${data.lng}, zoom: ${data.zoom}, buildingCount: ${data.buildingCount} }${comma}`);
});

console.log('};');

// Also output summary
console.log('\n// Summary:');
console.log(`// Total neighborhoods: ${Object.keys(neighborhoodCenters).length}`);
console.log(`// Total buildings: ${buildings.length}`);
