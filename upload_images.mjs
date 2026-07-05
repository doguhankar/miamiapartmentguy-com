import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const buildingsToUpload = [
  'cmpnd',
  'miami-world-tower',
  'muze-at-met',
  'flow-miami-world',
  'monarc-at-met',
  'parkline',
  '2000-biscayne',
  'modera-edgewater',
  'wynwood-plaza-residences'
];

const uploadedUrls = {};

for (const building of buildingsToUpload) {
  const files = fs.readdirSync('public/images/buildings/').filter(f => f.startsWith(building));
  uploadedUrls[building] = [];
  
  for (const file of files) {
    const filePath = `public/images/buildings/${file}`;
    const buffer = fs.readFileSync(filePath);
    
    try {
      const blob = await put(file, buffer, {
        access: 'public',
        addRandomSuffix: false
      });
      uploadedUrls[building].push(blob.url);
      console.log(`✅ Uploaded ${file} -> ${blob.url.substring(0, 60)}...`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
    }
  }
}

console.log('\n📊 UPLOAD SUMMARY:');
Object.entries(uploadedUrls).forEach(([building, urls]) => {
  console.log(`${building}: ${urls.length} images uploaded`);
});

// Output JSON for buildings.ts
console.log('\n// UPDATE buildings.ts WITH THESE URLS:');
console.log(JSON.stringify(uploadedUrls, null, 2));
