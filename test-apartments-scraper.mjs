import { scrapeApartmentsBuilding } from './lib/scrapers/apartments.js';

async function test() {
  try {
    console.log('[test] Starting Apartments.com scraper test...');
    const units = await scrapeApartmentsBuilding('flow-brickell');
    console.log('[test] Scraper returned units:', units.length);
    if (units.length > 0) {
      console.log('[test] First unit:', JSON.stringify(units[0], null, 2));
    } else {
      console.log('[test] No units found');
    }
  } catch (err) {
    console.error('[test] Error:', err.message);
    process.exit(1);
  }
}

test();
