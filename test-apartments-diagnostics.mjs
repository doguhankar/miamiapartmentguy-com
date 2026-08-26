import { scrapeApartmentsBuilding } from './lib/scrapers/apartments.js';

async function test() {
  console.log('\n========== APARTMENTS.COM SCRAPER DIAGNOSTICS ==========\n');
  
  try {
    console.log('[v0] Starting scraper test...');
    const units = await scrapeApartmentsBuilding('flow-brickell');
    
    console.log('\n========== RESULTS ==========');
    console.log('[v0] ✓ Successfully scraped', units.length, 'units\n');
    
    if (units.length > 0) {
      console.log('[v0] First 5 units:');
      units.slice(0, 5).forEach((u, i) => {
        console.log(`${i + 1}. ${u.unitType} - $${u.price}/mo - ${u.beds}bed/${u.baths}bath - ${u.sqft}sqft - Available: ${u.availableDate || 'unknown'}`);
      });
      
      console.log('\n[v0] Date extraction analysis:');
      const dateGroups = {};
      units.forEach(u => {
        const date = u.availableDate || 'null';
        dateGroups[date] = (dateGroups[date] || 0) + 1;
      });
      
      Object.entries(dateGroups).forEach(([date, count]) => {
        console.log(`  ${date}: ${count} units`);
      });
    }
    
  } catch (err) {
    console.error('\n[v0] ✗ Scraper failed:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  }
}

test();
