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
    const pricesFound = new Set();

    // Strategy: Look for price patterns and extract surrounding context
    // Find all elements that contain prices (e.g., "$2,841")
    const priceRegex = /\$([0-9,]+)/;
    
    // Get all text nodes and elements
    $('*').each((idx, el) => {
      const text = $(el).text() || '';
      
      // Look for price in this element's text
      const priceMatch = text.match(priceRegex);
      if (!priceMatch) return; // Continue to next element
      
      const price = parseInt(priceMatch[1].replace(/,/g, ''));
      
      // Skip if we've already seen this price (to avoid duplicates from meta tags, etc)
      if (pricesFound.has(price) && pricesFound.size > 10) return;
      pricesFound.add(price);
      
      // Get the text content of this element and its nearby siblings
      let contextText = text;
      
      // Try to find unit type in the same element
      let type = null;
      let beds = null;
      let baths = null;
      
      if (text.includes('Studio')) {
        type = 'Studio';
        beds = 0;
        baths = 1;
      } else if (text.includes('1 Bed')) {
        type = '1 Bed';
        beds = 1;
        baths = 1;
      } else if (text.includes('2 Bed')) {
        type = '2 Bed';
        beds = 2;
        baths = 2;
      } else if (text.includes('3 Bed')) {
        type = '3 Bed';
        beds = 3;
        baths = 3;
      }
      
      // Look for sqft in the same text
      const sqftMatch = text.match(/([0-9]+)\s*(?:sqft|sq\.?\s*ft|SF)/i);
      const sqft = sqftMatch ? parseInt(sqftMatch[1]) : null;
      
      // If we found a type, this is a valid unit listing
      if (type && price) {
        const unit = {
          floorPlanType: type,
          price,
          beds,
          baths,
          sqft,
          availableCount: null,
          availableDate: 'Available Now',
        };
        
        // Check if this unit is already in our list (to avoid duplicates)
        const duplicate = units.find(u => u.price === price && u.floorPlanType === type);
        if (!duplicate) {
          units.push(unit);
          console.log('[v0] Added unit:', JSON.stringify(unit));
        }
      }
    });

    console.log('[v0] Scraping completed. Found', units.length, 'unique units');
    console.log('[v0] Sample units:', JSON.stringify(units.slice(0, 3)));
    
    // If we didn't find any units, log all unique prices for debugging
    if (units.length === 0) {
      console.log('[v0] WARNING: No units found. Unique prices found:', Array.from(pricesFound).sort((a, b) => a - b).slice(0, 10));
    }
    
    return units;
  } catch (err) {
    console.error('[v0] CRITICAL ERROR in scrapeFlowBuilding:', err.message);
    console.error('[v0] Error type:', err.constructor.name);
    console.error('[v0] Error stack:', err.stack);
    throw err;
  }
}
