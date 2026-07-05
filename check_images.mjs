import { buildings } from './lib/buildings.ts';

console.log('[v0] IMAGE DATA AUDIT - COMPLETE SCOPE\n');
console.log('=' .repeat(80));

let missingCount = 0;
let fallbackCount = 0;
let validCount = 0;

buildings.forEach((building, idx) => {
  const imageUrls = building.images || [];
  
  // Check for fallback/placeholder patterns
  const hasUnsplash = imageUrls.some(url => url.includes('unsplash.com'));
  const hasLocalPath = imageUrls.some(url => url.startsWith('/images/'));
  const hasValidBlob = imageUrls.some(url => url.includes('hebbkx1anhila5yf.public.blob'));
  
  if (imageUrls.length === 0) {
    console.log(`\n❌ ${building.name} - NO IMAGES AT ALL`);
    missingCount++;
  } else if (hasUnsplash) {
    console.log(`\n⚠️  ${building.name} - UNSPLASH FALLBACK`);
    console.log(`   First URL: ${imageUrls[0].substring(0, 70)}...`);
    fallbackCount++;
  } else if (hasLocalPath && !hasValidBlob) {
    console.log(`\n⚠️  ${building.name} - LOCAL PATH FALLBACK (never uploaded)`);
    console.log(`   First URL: ${imageUrls[0].substring(0, 70)}...`);
    console.log(`   Count: ${imageUrls.length} local paths`);
    fallbackCount++;
  } else if (hasValidBlob) {
    console.log(`\n✅ ${building.name} - VALID BLOB STORAGE`);
    console.log(`   ${imageUrls.length} images | First: ${imageUrls[0].substring(0, 60)}...`);
    validCount++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 SUMMARY:`);
console.log(`   ✅ Valid Blob Storage: ${validCount} buildings`);
console.log(`   ⚠️  Fallback/Missing: ${fallbackCount} buildings`);
console.log(`   ❌ No Images: ${missingCount} buildings`);
console.log(`   📈 Total: ${buildings.length} buildings\n`);
