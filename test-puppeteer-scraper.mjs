import { scrapeApartmentsWithPuppeteer } from './lib/scrapers/puppeteer-apartments.js';

async function test() {
  try {
    console.log('[v0] Starting Puppeteer scraper test...');
    const startTime = Date.now();
    
    const units = await scrapeApartmentsWithPuppeteer();
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('[v0] ✓ Test completed successfully in', elapsed, 'seconds');
    console.log('[v0] Total units scraped:', units.length);
    
    if (units.length > 0) {
      console.log('[v0] First 3 units:');
      units.slice(0, 3).forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.unitType} - $${u.price} - Available: ${u.availableDate || 'unknown'}`);
      });

      const dateGroups = {};
      units.forEach(u => {
        const date = u.availableDate || 'null';
        dateGroups[date] = (dateGroups[date] || 0) + 1;
      });
      
      console.log('[v0] Date distribution:');
      Object.entries(dateGroups).forEach(([date, count]) => {
        console.log(`  ${date}: ${count} units`);
      });
    }
  } catch (err) {
    console.error('[v0] ✗ Error:', err.message);
    process.exit(1);
  }
}

test();
