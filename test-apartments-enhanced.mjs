import { scrapeApartmentsBuilding } from './lib/scrapers/apartments.js';

async function test() {
  try {
    console.log('[v0] Starting enhanced apartments scraper test...');
    const units = await scrapeApartmentsBuilding('flow-brickell');
    console.log('[v0] Test completed successfully!');
    console.log('[v0] Total units scraped:', units.length);
    
    if (units.length > 0) {
      console.log('[v0] First unit sample:');
      const unit = units[0];
      console.log('[v0]  - Type:', unit.unitType);
      console.log('[v0]  - Price: $' + unit.price);
      console.log('[v0]  - Availability Date:', unit.availableDate);
      
      console.log('[v0] Date distribution:');
      const dateGroups = {};
      units.forEach(u => {
        const date = u.availableDate || 'null';
        dateGroups[date] = (dateGroups[date] || 0) + 1;
      });
      Object.entries(dateGroups).forEach(([date, count]) => {
        console.log(`[v0]  ${date}: ${count} units`);
      });
    }
  } catch (err) {
    console.error('[v0] Error:', err.message);
    process.exit(1);
  }
}

test();
