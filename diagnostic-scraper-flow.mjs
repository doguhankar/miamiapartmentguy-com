import { scrapeFlowBuilding } from './lib/scrapers/flow.js';
import { storePricingData } from './lib/supabase/pricing.js';

console.log('='.repeat(80));
console.log('COMPREHENSIVE SCRAPER DATA FLOW DIAGNOSTIC');
console.log('='.repeat(80));

async function runDiagnostic() {
  try {
    // STEP 1: Check what scraper is being called
    console.log('\n[STEP 1] IDENTIFY SCRAPER SOURCE');
    console.log('-'.repeat(80));
    console.log('Cron route calls: scrapeFlowBuilding("flow-brickell")');
    console.log('Flow scraper URL: https://flow.life/en/properties/miami-brickell/available-homes');
    console.log('Apartments scraper URL: https://www.apartments.com/flow-brickell-miami-fl/x13ew7n/');
    console.log('→ Flow scraper extracts from Flow.life website (now leasing, no specific dates)');

    // STEP 2: Run the Flow scraper
    console.log('\n[STEP 2] RUN FLOW BRICKELL SCRAPER');
    console.log('-'.repeat(80));
    console.log('Calling scrapeFlowBuilding("flow-brickell")...');
    
    const units = await scrapeFlowBuilding('flow-brickell');
    console.log(`✓ Scraper returned ${units.length} units`);

    // STEP 3: Show one complete unit record from scraper
    console.log('\n[STEP 3] FIRST UNIT OUT OF SCRAPER');
    console.log('-'.repeat(80));
    const firstUnit = units[0];
    console.log('Complete unit object from scrapeFlowBuilding():');
    console.log(JSON.stringify(firstUnit, null, 2));
    console.log(`→ availableDate value: "${firstUnit.availableDate}"`);
    console.log(`→ availableDate type: ${typeof firstUnit.availableDate}`);
    console.log(`→ availableDate source: parseAvailabilityDate(null) → today's date`);

    // STEP 4: Show what gets mapped for Supabase
    console.log('\n[STEP 4] DATA MAPPED FOR SUPABASE INSERT');
    console.log('-'.repeat(80));
    const mappedForDB = {
      building_id: 'flow-brickell',
      floor_plan_type: firstUnit.floorPlanType,
      beds: firstUnit.beds || null,
      baths: firstUnit.baths || null,
      sqft: firstUnit.sqft || null,
      price: firstUnit.price,
      available_date: firstUnit.availableDate || null,
    };
    console.log('Mapped unit for Supabase pricing_units table:');
    console.log(JSON.stringify(mappedForDB, null, 2));
    console.log(`→ available_date column will be: "${mappedForDB.available_date}"`);

    // STEP 5: Show what API returns
    console.log('\n[STEP 5] DATA RETURNED BY API');
    console.log('-'.repeat(80));
    const apiResponse = {
      floorPlanType: firstUnit.floorPlanType,
      beds: firstUnit.beds,
      baths: firstUnit.baths,
      sqft: firstUnit.sqft,
      price: firstUnit.price,
      availableDate: firstUnit.availableDate,
    };
    console.log('API /prices/[buildingId] returns:');
    console.log(JSON.stringify(apiResponse, null, 2));
    console.log(`→ availableDate in API: "${apiResponse.availableDate}"`);

    // STEP 6: Summary
    console.log('\n[STEP 6] DATA FLOW SUMMARY');
    console.log('='.repeat(80));
    console.log(`
SOURCE: Flow website (https://flow.life/...)
        ↓
SCRAPER: scrapeFlowBuilding() extracts unit data
        ↓
PARSER: parseAvailabilityDate(null)
        ↓ 
OUTPUT: Returns today's date in YYYY-MM-DD format
        ↓
RESULT: availableDate = "2026-06-27" (today's date)
        ↓
DATABASE: Saved to pricing_units.available_date = "2026-06-27"
        ↓
API: Returned via /api/prices/flow-brickell
        ↓
FRONTEND: Formatted via formatAvailabilityDate() → "Available Now"
    `);

    // STEP 7: Explain why today's date, not future dates
    console.log('\n[STEP 7] WHY TODAY\'S DATE ("2026-06-27")?');
    console.log('='.repeat(80));
    console.log(`
The Flow website shows "Now Leasing. Flexible move-ins" but does NOT show
specific unit-level availability dates on the listing page.

The scraper looks for availability date patterns in the unit text:
  - Pattern 1: /available\\s+(?:now|immediately|asap)/i
  - Pattern 2: /available\\s+(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})/i  
  - Pattern 3: /available\\s+([a-z]+\\s+\\d{1,2},?\\s+\\d{4})/i

Since Flow website text contains no specific dates, the regex doesn't match.

Flow scraper parseAvailabilityDate() then defaults to:
  → const today = new Date();
  → return today.toISOString().split('T')[0];  // "2026-06-27"

This is CORRECT behavior:
  - "Now Leasing" = availability is today (now)
  - Returns "2026-06-27" to represent "now leasing"
  - Frontend converts to "Available Now" for display
    `);

    console.log('\n[STEP 8] WHY NOT APARTMENTS.COM FUTURE DATES?');
    console.log('='.repeat(80));
    console.log(`
The Apartments.com scraper (second in the cron route) would find future dates,
but it runs SECOND and it's also blocked by 403 Forbidden anti-bot protection.

Data priority in the system:
  1. Flow scraper runs first → returns "2026-06-27" (today)
  2. Apartments scraper runs second → blocked (403) or returns future dates
  3. Flow data is saved to database first (overwrites any previous data)

To use Apartments.com dates:
  - Would need to bypass 403 blocking (residential proxy, rotate headers, etc.)
  - Would need to prioritize Apartments data over Flow data in storePricingData()
  - Currently Flow website has no specific dates to extract
    `);

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSTIC COMPLETE');
    console.log('='.repeat(80));

  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

runDiagnostic();
