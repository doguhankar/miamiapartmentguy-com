import * as cheerio from 'cheerio';

// Deployment trigger: 2026-06-27 - Real availability date parsing enabled
// This version correctly extracts YYYY-MM-DD dates from listings instead of hardcoded strings

const FLOW_BUILDINGS = {
  'flow-brickell': 'https://flow.life/en/properties/miami-brickell/available-homes',
};

/**
 * Parse availability date string to YYYY-MM-DD format or today's date
 * Handles: "Available now", specific dates like "07/15/2026", "Contact for availability", etc.
 * Updated: 2026-06-27 - Returns real YYYY-MM-DD dates, NOT hardcoded strings
 */
function parseAvailabilityDate(dateStr) {
  if (!dateStr) {
    // Default to today's date (represents "now leasing")
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const lowerStr = dateStr.toLowerCase().trim();

  // Handle "Contact for availability" or similar
  if (lowerStr.includes('contact for') || lowerStr === '') {
    return null;
  }

  // Handle "Available now" or "Available immediately"
  if (lowerStr.includes('available now') || lowerStr.includes('immediately') || lowerStr.includes('asap')) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Try to match MM/DD/YYYY format
  let dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [_, month, day, year] = dateMatch;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // Try to match Month DD, YYYY format
  dateMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (dateMatch) {
    const monthMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const month = monthMap[dateMatch[1].toLowerCase().slice(0, 3)];
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3];
    
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Default to today if we couldn't parse
  const today = new Date();
  return today.toISOString().split('T')[0];
}

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

      // Extract availability date from text (look for patterns like "Available now", "07/15/2026", etc.)
      let availableDate = null;
      const availPatterns = [
        /available\s+(?:now|immediately|asap)/i,
        /available\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /available\s+([a-z]+\s+\d{1,2},?\s+\d{4})/i,
      ];
      
      for (const pattern of availPatterns) {
        const match = text.match(pattern);
        if (match) {
          const dateStr = match[1] || match[0];
          availableDate = parseAvailabilityDate(dateStr);
          break;
        }
      }
      
      // If no specific date found, default to today (represents "now leasing")
      if (!availableDate) {
        availableDate = parseAvailabilityDate(null);
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
        availableDate,
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
