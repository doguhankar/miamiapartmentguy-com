import * as cheerio from 'cheerio';

const FLOW_BUILDINGS = {
  'flow-brickell': 'https://flow.life/en/properties/miami-brickell/available-homes',
};

export async function scrapeFlowBuilding(buildingId) {
  const baseUrl = FLOW_BUILDINGS[buildingId];

  try {
    console.log('[v0] Scraper starting for building:', buildingId);
    console.log('[v0] Fetching URL:', baseUrl);

    // Fetch the page with a user agent
    const response = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('[v0] HTML fetched, length:', html.length);

    // Parse with Cheerio to get clean text
    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    console.log('[v0] Extracted body text, length:', bodyText.length);

    const units = [];

    // Regex patterns to extract unit data
    const pricePattern = /\$([0-9,]+)\/month/g;
    const typePattern = /Studio|1 Bed|2 Bed|3 Bed|1BR|2BR|3BR/g;
    const sqftPattern = /([0-9]+)\s*sqft/g;

    // Find all price matches
    console.log('[v0] Searching for prices with regex: /\\$([0-9,]+)\\/month/g');
    let priceMatch;
    const prices = [];
    while ((priceMatch = pricePattern.exec(bodyText)) !== null) {
      const price = parseInt(priceMatch[1].replace(/,/g, ''));
      prices.push(price);
    }
    console.log('[v0] Found', prices.length, 'prices');
    console.log('[v0] First 5 prices:', prices.slice(0, 5));

    // Find all sqft values
    console.log('[v0] Searching for sqft with regex: /([0-9]+)\\s*sqft/g');
    let sqftMatch;
    const sqftValues = [];
    while ((sqftMatch = sqftPattern.exec(bodyText)) !== null) {
      const sqft = parseInt(sqftMatch[1]);
      sqftValues.push(sqft);
    }
    console.log('[v0] Found', sqftValues.length, 'sqft values');
    console.log('[v0] First 5 sqft:', sqftValues.slice(0, 5));

    // Find all unit types
    console.log('[v0] Searching for unit types with regex: /Studio|1 Bed|2 Bed|3 Bed|1BR|2BR|3BR/g');
    let typeMatch;
    const types = [];
    while ((typeMatch = typePattern.exec(bodyText)) !== null) {
      types.push(typeMatch[0]);
    }
    console.log('[v0] Found', types.length, 'unit types');
    console.log('[v0] First 5 types:', types.slice(0, 5));

    // Match up prices with other data (assuming they're in order)
    // Use the minimum length to avoid mismatches
    const unitCount = Math.min(prices.length, sqftValues.length, types.length);
    console.log('[v0] Building', unitCount, 'units from matched data');

    for (let i = 0; i < unitCount; i++) {
      const type = types[i];
      const price = prices[i];
      const sqft = sqftValues[i];

      // Parse beds and baths from type
      let beds = null;
      let baths = null;
      if (type === 'Studio') {
        beds = 0;
        baths = 1;
      } else if (type === '1 Bed' || type === '1BR') {
        beds = 1;
        baths = 1;
      } else if (type === '2 Bed' || type === '2BR') {
        beds = 2;
        baths = 2;
      } else if (type === '3 Bed' || type === '3BR') {
        beds = 3;
        baths = 3;
      }

      const unit = {
        floorPlanType: type,
        price,
        beds,
        baths,
        sqft,
        availableCount: null,
        availableDate: 'Available Now',
      };

      units.push(unit);
      console.log('[v0] Added unit:', JSON.stringify(unit));
    }

    console.log('[v0] Scraping completed successfully. Total units:', units.length);
    console.log('[v0] Sample units:', JSON.stringify(units.slice(0, 3)));
    return units;
  } catch (err) {
    console.error('[v0] CRITICAL ERROR in scrapeFlowBuilding:', err.message);
    console.error('[v0] Error type:', err.constructor.name);
    console.error('[v0] Error stack:', err.stack);
    throw err;
  }
}
