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

    // Parse with Cheerio
    const $ = cheerio.load(html);
    console.log('[v0] HTML loaded into Cheerio');

    const units = [];
    const seenUnits = new Set();

    // Extract units by parsing each link element that contains "From $"
    // Links contain: unit type, price, beds, baths, sqft all in one text block
    const links = $('a');
    console.log('[v0] Scanning', links.length, 'links for unit data');

    links.each((_, link) => {
      const text = $(link).text() || '';
      
      // Must have a price in "From $X,XXX" format
      const priceMatch = text.match(/From\s*\$([0-9,]+)/);
      if (!priceMatch) return;
      
      const price = parseInt(priceMatch[1].replace(/,/g, ''));
      
      // Must have sqft
      const sqftMatch = text.match(/([0-9,]+)\s*sqft/i);
      if (!sqftMatch) return;
      
      const sqft = parseInt(sqftMatch[1].replace(/,/g, ''));
      
      // Extract unit type and bed/bath info
      let type = null;
      let beds = null;
      let baths = null;
      
      // Check for bed/bath patterns like "X beds | X baths" or "X beds | X.X baths"
      const bedBathMatch = text.match(/(\d+)\s*beds?\s*\|\s*([0-9.]+)\s*baths?/i);
      if (bedBathMatch) {
        beds = parseInt(bedBathMatch[1]);
        baths = parseFloat(bedBathMatch[2]);
        type = beds === 1 ? '1 Bed' : beds === 2 ? '2 Bed' : beds === 3 ? '3 Bed' : `${beds} Bed`;
      } else if (text.match(/Studio/i) && !text.match(/\d+\s*bed/i)) {
        // It's a studio if it says "Studio" but doesn't mention beds
        type = 'Studio';
        beds = 0;
        baths = 1;
      }
      
      // Must have identified a valid unit type
      if (!type || beds === null) {
        console.log('[v0] Skipped link - could not parse type:', text.substring(0, 100));
        return;
      }
      
      // Create unit record - use price+sqft as unique identifier
      const unitKey = `${price}-${sqft}`;
      if (seenUnits.has(unitKey)) {
        console.log('[v0] Skipped duplicate:', unitKey);
        return;
      }
      
      seenUnits.add(unitKey);
      
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
    });

    console.log('[v0] Scraping completed. Found', units.length, 'unique units');
    if (units.length > 0) {
      console.log('[v0] Price range: $' + Math.min(...units.map(u => u.price)) + ' - $' + Math.max(...units.map(u => u.price)));
      console.log('[v0] Prices:', units.map(u => u.price).sort((a, b) => a - b));
    }
    
    return units;
  } catch (err) {
    console.error('[v0] CRITICAL ERROR in scrapeFlowBuilding:', err.message);
    console.error('[v0] Error type:', err.constructor.name);
    console.error('[v0] Error stack:', err.stack);
    throw err;
  }
}
