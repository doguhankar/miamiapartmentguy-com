import fs from 'fs';

const buildings = [
  { prefix: '2000-biscayne', name: '2000 Biscayne' },
  { prefix: 'cmpnd', name: 'CMPND' },
  { prefix: 'flow-miami-world', name: 'Flow Miami World' },
  { prefix: 'miami-world-tower', name: 'Miami World Tower' },
  { prefix: 'modera-edgewater', name: 'Modera Edgewater' },
  { prefix: 'monarc-at-met', name: 'Monarc at Met' },
  { prefix: 'muze-at-met', name: 'Muze at Met' },
  { prefix: 'parkline', name: 'Parkline' },
  { prefix: 'wynwood-plaza-residences', name: 'Wynwood Plaza Residences' }
];

const mapping = {};
let totalImages = 0;

buildings.forEach(({ prefix, name }) => {
  const files = fs.readdirSync('public/images/buildings/')
    .filter(f => f.startsWith(prefix))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });
  
  mapping[name] = files.map(f => `/images/buildings/${f}`);
  totalImages += files.length;
  console.log(`${name}: ${files.length} images`);
});

console.log(`\n✓ Total: ${totalImages} images\n`);
console.log('// ===== UPDATE buildings.ts =====');
console.log('// Replace images: [] with images: [');
console.log('const BUILDING_IMAGES = ' + JSON.stringify(mapping, null, 2) + ';');
