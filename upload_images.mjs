import { put } from '@vercel/blob';
import fs from 'fs';

const token = process.env.BLOB_READ_WRITE_TOKEN;

const buildingsToUpload = {
  'cmpnd': 'CMPND',
  'parkline': 'Parkline',
  'wynwood-plaza-residences': 'Wynwood Plaza Residences'
};

const uploadedUrls = {};

for (const [buildingKey, buildingName] of Object.entries(buildingsToUpload)) {
  const files = fs.readdirSync('public/images/buildings/').filter(f => f.startsWith(buildingKey)).slice(0, 3);
  uploadedUrls[buildingName] = [];
  
  console.log(`\n[v0] Uploading ${buildingName} (${files.length} files)...`);
  
  for (const file of files) {
    const filePath = `public/images/buildings/${file}`;
    const buffer = fs.readFileSync(filePath);
    
    try {
      const blob = await put(file, buffer, {
        access: 'public',
        addRandomSuffix: false,
        token
      });
      uploadedUrls[buildingName].push(blob.url);
      console.log(`  ✓ ${file} -> ${blob.url.substring(0, 60)}...`);
    } catch (error) {
      console.error(`  ✗ ${file}: ${error.message}`);
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log(JSON.stringify(uploadedUrls, null, 2));
