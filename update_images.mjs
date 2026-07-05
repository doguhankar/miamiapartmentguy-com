import fs from 'fs';

// Map building names to their file prefixes
const buildingImageMap = {
  'Blu 27 Edgewater': 'blu-27-edgewater',
  'Metro Edgewater': 'metro-edgewater',
  'The Hamilton': 'the-hamilton',
  'AMLI Midtown 29': 'amli-midtown-29',
  'AMLI Midtown Miami': 'amli-midtown-miami',
  'Eve at The District': 'eve-at-the-district',
  'Midtown Five': 'midtown-five',
  'Gio Midtown': 'gio-midtown',
  'Cortland Midtown Miami': 'cortland-midtown-miami',
  'Joule House': 'joule-house',
  'Amara Wynwood': 'amara-wynwood',
  'Flow Wynwood': 'flow-wynwood',
  'The Highley House': 'the-highley-house',
  'Wynd 27': 'wynd-27',
  'Wynd 28': 'wynd-28',
  '29 WYN': '29-wyn'
};

// For each building, find how many image files exist
Object.entries(buildingImageMap).forEach(([name, prefix]) => {
  const files = fs.readdirSync('public/images/buildings/').filter(f => f.startsWith(prefix));
  console.log(`${name}: ${files.length} images`);
});
