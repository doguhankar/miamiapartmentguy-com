import fs from 'fs';

const buildingMap = {
  '2000-biscayne': '2000 Biscayne',
  'flow-miami-world': 'Flow Miami World',
  'miami-world-tower': 'Miami World Tower',
  'modera-edgewater': 'Modera Edgewater',
  'monarc-at-met': 'Monarc at Met',
  'muze-at-met': 'Muze at Met',
  'wynwood-plaza-residences': 'Wynwood Plaza Residences'
};

const imagePaths = {};

for (const [prefix, buildingName] of Object.entries(buildingMap)) {
  const files = fs.readdirSync('public/images/buildings/')
    .filter(f => f.startsWith(prefix))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });
  
  imagePaths[buildingName] = files.map(f => `/images/buildings/${f}`);
  console.log(`${buildingName}: ${files.length} images`);
}

console.log('\n// Paste this into buildings.ts:\n');
console.log(JSON.stringify(imagePaths, null, 2));
