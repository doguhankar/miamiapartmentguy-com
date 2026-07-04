import { scrapeFlowBuilding } from './lib/scrapers/flow.js';

async function testFlow() {
  console.log('[v0] Step 1: Call scraper to get units');
  const units = await scrapeFlowBuilding('flow-brickell');
  
  if (units.length > 0) {
    console.log('[v0] Step 2: Check first unit structure');
    const firstUnit = units[0];
    console.log('[v0] First unit keys:', Object.keys(firstUnit));
    console.log('[v0] First unit full:', JSON.stringify(firstUnit, null, 2));
    
    console.log('[v0] Step 3: Verify availableDate property exists');
    console.log('[v0] Has availableDate?', 'availableDate' in firstUnit);
    console.log('[v0] availableDate value:', firstUnit.availableDate);
    console.log('[v0] availableDate type:', typeof firstUnit.availableDate);
    
    console.log('[v0] Step 4: Check what storePricingData would receive');
    const unitForStorage = {
      floorPlanType: firstUnit.floorPlanType,
      beds: firstUnit.beds,
      baths: firstUnit.baths,
      sqft: firstUnit.sqft,
      price: firstUnit.price,
      availableDate: firstUnit.availableDate,
    };
    console.log('[v0] Unit to store:', JSON.stringify(unitForStorage, null, 2));
    console.log('[v0] available_date would be:', unitForStorage.availableDate || null);
  }
}

testFlow().catch(console.error);
