import * as cheerio from 'cheerio';

const APARTMENTS_BUILDINGS = {
  'flow-brickell': 'https://www.apartments.com/flow-brickell-miami-fl/x13ew7n/',
};

// Rotating User-Agent strings to bypass anti-bot detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
];

// Rotating Accept-Language values
const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'en-US,en;q=0.9,es;q=0.8',
  'en;q=0.9,en-US;q=0.8',
  'en-US,en;q=0.9,fr;q=0.8',
];

/**
 * Get random item from array
 */
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get realistic request headers with rotating User-Agent
 */
function getRealisticHeaders() {
  return {
    'User-Agent': getRandomItem(USER_AGENTS),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': getRandomItem(ACCEPT_LANGUAGES),
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://www.google.com/',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
    'Connection': 'keep-alive',
  };
}

/**
 * Parse availability date string to YYYY-MM-DD format or today's date
 * Handles: "Available now", "Available immediately", "Available 07/15/2026", "Contact for availability", etc.
 * Supports formats: MM/DD/YYYY, MM/DD/YY, DD/MM/YYYY, and relative dates
 */
function parseAvailabilityDate(dateStr) {
  if (!dateStr) {
    return null;
  }

  const lowerStr = dateStr.toLowerCase().trim();

  // Handle "Contact for availability" or similar
  if (lowerStr.includes('contact for') || lowerStr === '') {
    return null;
  }

  // Handle "Available now" or "Available immediately"
  if (lowerStr.includes('available now') || lowerStr.includes('immediately') || lowerStr.includes('asap')) {
    // Return today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Try to match MM/DD/YYYY format (most common in US)
  let dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [_, month, day, year] = dateMatch;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    // Validate month and day ranges
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // Try to match MM/DD/YY format
  dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2})(?!\d)/);
  if (dateMatch) {
    const [_, month, day, yearShort] = dateMatch;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    const yearNum = parseInt(yearShort);
    
    // Convert 2-digit year to 4-digit year (assume 20xx for 00-99)
    const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${fullYear}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // Try to match Month DD, YYYY format (e.g., "July 15, 2026")
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

  // If we couldn't parse, return null
  console.log('[v0] Could not parse availability date:', dateStr);
  return null;
}

/**
 * Extract unit number from various formats (e.g., "Unit 1505", "#2301", "Apt 305")
 */
function extractUnitNumber(text) {
  const unitMatch = text.match(/(?:Unit|Apt|#|Apartment)[\s#]*(\d+)/i);
  return unitMatch ? unitMatch[1] : null;
}

/**
 * Extract images/photos from unit listing
 */
function extractPhotos($, unitElement) {
  const photos = [];
  const images = $(unitElement).find('img');
  
  images.each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src');
    if (src && !src.includes('blank') && !src.includes('placeholder')) {
      photos.push(src);
    }
  });

  return photos;
}

export async function scrapeApartmentsBuilding(buildingId) {
  const baseUrl = APARTMENTS_BUILDINGS[buildingId];

  if (!baseUrl) {
    throw new Error(`No URL configured for building: ${buildingId}`);
  }

  const maxRetries = 3;
  let lastError = null;

  try {
    console.log('[v0] Apartments.com scraper starting for building:', buildingId);
    console.log('[v0] Fetching URL:', baseUrl);

    // Retry logic with rotating headers
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[v0] Fetch attempt ${attempt}/${maxRetries}`);

        // Add delay before request (random 1-3 seconds)
        if (attempt > 1) {
          const delayMs = 1000 + Math.random() * 2000;
          console.log(`[v0] Waiting ${delayMs.toFixed(0)}ms before retry...`);
          await sleep(delayMs);
        }

        // Fetch with rotating headers to bypass anti-bot
        const response = await fetch(baseUrl, {
          headers: getRealisticHeaders(),
          timeout: 15000,
        });

        console.log('[v0] Response status:', response.status);

        if (!response.ok) {
          if (response.status === 403) {
            lastError = `403 Forbidden (attempt ${attempt}/${maxRetries})`;
            console.warn('[v0]', lastError, '- Retrying with different User-Agent...');
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Successfully fetched - process the page
        const html = await response.text();
        console.log('[v0] HTML fetched successfully, length:', html.length);

        // Parse with Cheerio
        const $ = cheerio.load(html);
        console.log('[v0] HTML loaded into Cheerio');

        const units = [];
        const seenUnits = new Set();

        // Common selectors for apartments.com unit listings
        // Try multiple selectors to find unit cards
        const unitSelectors = [
          '[data-testid="apartmentCard"]',
          '[class*="ApartmentCard"]',
          '[class*="unit-card"]',
          '[class*="listing"]',
          '.js-apartment-result',
          '[role="article"]',
        ];

        let unitElements = [];
        for (const selector of unitSelectors) {
          unitElements = $(selector);
          if (unitElements.length > 0) {
            console.log(`[v0] Found ${unitElements.length} units using selector: ${selector}`);
            break;
          }
        }

        if (unitElements.length === 0) {
          console.log('[v0] No unit elements found with standard selectors, trying generic approach');
          // Fallback: look for price patterns
          const allDivs = $('div');
          unitElements = allDivs.filter((_, el) => {
            const text = $(el).text();
            return /\$\s*[\d,]+/i.test(text) && /bed|bath|sqft|studio/i.test(text);
          });
        }

        console.log('[v0] Scanning', unitElements.length, 'potential unit elements');

        unitElements.each((idx, el) => {
          try {
            const $el = $(el);
            const text = $el.text() || '';

            // Extract price
            const priceMatch = text.match(/\$\s*([\d,]+)/);
            if (!priceMatch) return;

            const price = parseInt(priceMatch[1].replace(/,/g, ''));
            if (price < 500 || price > 50000) return; // Sanity check

            // Extract bedrooms
            const bedsMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i);
            const beds = bedsMatch ? parseInt(bedsMatch[1]) : null;

            // Extract studio
            const isStudio = /studio/i.test(text);
            const bedrooms = isStudio ? 0 : beds;

            // Extract bathrooms
            const bathsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
            const baths = bathsMatch ? parseFloat(bathsMatch[1]) : null;

            // Extract sqft
            const sqftMatch = text.match(/(\d+(?:,\d+)?)\s*(?:sqft|sq\.?\s*ft|square\s*feet)/i);
            const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;

            // Extract availability date - look for various patterns
            let availabilityDate = null;
            
            // Try to match "Available" followed by date/status
            const availPatterns = [
              /available\s+(?:now|immediately|asap)/i,
              /available\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i, // Available MM/DD/YYYY
              /available\s+([a-z]+\s+\d{1,2},?\s+\d{4})/i, // Available Month DD, YYYY
              /contact\s+for\s+availability/i,
            ];
            
            for (const pattern of availPatterns) {
              const match = text.match(pattern);
              if (match) {
                availabilityDate = parseAvailabilityDate(match[1] || match[0]);
                break;
              }
            }

            // Extract unit number
            const unitNumber = extractUnitNumber(text);

            // Extract photos
            const photos = extractPhotos($, el);

            // Determine unit type label
            let unitType = 'Unknown';
            if (isStudio) unitType = 'Studio';
            else if (bedrooms === 1) unitType = '1B';
            else if (bedrooms === 2) unitType = '2B';
            else if (bedrooms === 3) unitType = '3B';
            else if (bedrooms === 4) unitType = '4B';
            else if (bedrooms === 5) unitType = '5B';

            // Create unique key to avoid duplicates
            const uniqueKey = `${price}-${bedrooms}-${baths}-${sqft}`;
            if (seenUnits.has(uniqueKey)) {
              console.log('[v0] Skipping duplicate unit:', uniqueKey);
              return;
            }
            seenUnits.add(uniqueKey);

            const unit = {
              price,
              unitType,
              beds: bedrooms,
              baths,
              sqft,
              availableDate,
              unitNumber,
              photos: photos.slice(0, 5), // Limit to first 5 photos
            };

            console.log('[v0] Extracted unit:', unit);
            units.push(unit);
          } catch (err) {
            console.warn('[v0] Error parsing unit element:', err.message);
          }
        });

        // Successfully parsed units on this attempt
        if (units.length > 0) {
          console.log(`[v0] Successfully scraped ${units.length} units`);
          return units;
        } else {
          console.warn('[v0] No units found on page, retrying...');
          lastError = 'No units found on page';
          continue;
        }
      } catch (fetchErr) {
        lastError = fetchErr.message;
        console.error(`[v0] Fetch/parse error on attempt ${attempt}:`, fetchErr.message);
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${lastError}`);
        }
      }
    }

    // All retries exhausted
    throw new Error(`All ${maxRetries} retries failed: ${lastError}`);
  } catch (err) {
    console.error('[v0] Apartments.com scraper error:', err.message);
    throw err;
  }
}
