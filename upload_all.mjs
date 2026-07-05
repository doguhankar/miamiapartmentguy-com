import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

// Map of building prefixes to building names in buildings.ts
const buildingMap = {
  '2000-biscayne': '2000 Biscayne',
  'flow-miami-world': 'Flow Miami World',
  'miami-world-tower': 'Miami World Tower',
  'modera-edgewater': 'Modera Edgewater',
  'monarc-at-met': 'Monarc at Met',
  'muze-at-met': 'Muze at Met',
  'wynwood-plaza-residences': 'Wynwood Plaza Residences'
};

const uploadedUrls = {};
const errors = [];

for (const [prefix, buildingName] of Object.entries(buildingMap)) {
  uploadedUrls[buildingName] = [];
  
  const files = fs.readdirSync('public/images/buildings/')
    .filter(f => f.startsWith(prefix))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });
  
  console.log(`\n[UPLOADING] ${buildingName} (${files.length} files)`);
  
  for (const file of files) {
    const filePath = `public/images/buildings/${file}`;
    const buffer = fs.readFileSync(filePath);
    
    try {
      const blob = await put(file, buffer, {
        access: 'public',
        addRandomSuffix: false
      });
      uploadedUrls[buildingName].push(blob.url);
      console.log(`  ✓ ${file}`);
    } catch (err) {
      const msg = `${file}: ${err.message}`;
      errors.push(msg);
      console.error(`  ✗ ${msg}`);
    }
  }
}

console.log('\n' + '='.repeat(90));
console.log('\n[UPLOAD COMPLETE]\n');

Object.entries(uploadedUrls).forEach(([building, urls]) => {
  console.log(`${building}: ${urls.length} URLs`);
  if (urls.length > 0) {
    console.log(`  Sample: ${urls[0]}\n`);
  }
});

if (errors.length > 0) {
  console.log(`\n[ERRORS] ${errors.length} uploads failed:`);
  errors.forEach(e => console.log(`  - ${e}`));
}

// Output for buildings.ts
console.log('\n[JSON FOR buildings.ts]:\n');
console.log(JSON.stringify(uploadedUrls, null, 2));
