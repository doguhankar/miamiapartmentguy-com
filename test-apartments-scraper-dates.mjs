import { scrapeApartmentsBuilding } from './lib/scrapers/apartments.js';

async function testScraper() {
  try {
    console.log('[v0] Testing Apartments.com scraper for Flow Brickell...\n');
    
    const units = await scrapeApartmentsBuilding('flow-brickell');
    
    console.log(`\n[v0] ✅ Scraper returned ${units.length} units\n`);
    
    if (units.length > 0) {
      console.log('[v0] Sample units with parsed availability dates:\n');
      units.slice(0, 5).forEach((unit, idx) => {
        console.log(`Unit ${idx + 1}:`);
        console.log(`  Price: $${unit.price}/mo`);
        console.log(`  Type: ${unit.unitType} (${unit.beds}B ${unit.baths}B)`);
        console.log(`  Sqft: ${unit.sqft}`);
        console.log(`  Unit #: ${unit.unitNumber}`);
        console.log(`  Availability Date: ${unit.availableDate || 'null (Contact for info)'}`);
        console.log(`  Photos: ${unit.photos.length} images`);
        console.log('');
      });
      
      // Summary stats
      const withDates = units.filter(u => u.availableDate).length;
      const withoutDates = units.filter(u => !u.availableDate).length;
      
      console.log(`[v0] Summary:`);
      console.log(`  Units with parsed dates: ${withDates}`);
      console.log(`  Units without dates (Contact for info): ${withoutDates}`);
    }
  } catch (err) {
    console.error('[v0] ❌ Scraper error:', err.message);
    process.exit(1);
  }
}

testScraper();
