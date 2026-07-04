import { scrapeFlowBuilding } from './lib/scrapers/flow.js';

async function test() {
  try {
    console.log('[v0] Testing Flow Brickell scraper with date extraction...');
    const units = await scrapeFlowBuilding('flow-brickell');
    
    console.log('\n[v0] Scraper Results:');
    console.log('[v0] Total units found:', units.length);
    
    if (units.length > 0) {
      console.log('\n[v0] First 3 units:');
      units.slice(0, 3).forEach((unit, idx) => {
        console.log(`\n[v0] Unit ${idx + 1}:`);
        console.log(`  - Type: ${unit.floorPlanType}`);
        console.log(`  - Price: $${unit.price}`);
        console.log(`  - Beds: ${unit.beds}, Baths: ${unit.baths}`);
        console.log(`  - Sqft: ${unit.sqft}`);
        console.log(`  - Availability Date: ${unit.availableDate}`);
      });
      
      console.log('\n[v0] Availability dates in response:');
      const uniqueDates = new Set(units.map(u => u.availableDate));
      uniqueDates.forEach(date => {
        const count = units.filter(u => u.availableDate === date).length;
        console.log(`  - ${date}: ${count} units`);
      });
    } else {
      console.log('[v0] No units found');
    }
  } catch (err) {
    console.error('[v0] Error:', err.message);
    process.exit(1);
  }
}

test();
