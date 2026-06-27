import puppeteer from 'puppeteer';
import { scrapeFlowBuilding } from '@/lib/scrapers/flow';
import { storePricingData } from '@/lib/supabase/pricing';

const APARTMENTS_COM_URL = 'https://www.apartments.com/flow-brickell-miami-fl/x13ew7n/';

/**
 * Parse availability date string to YYYY-MM-DD format
 */
function parseAvailabilityDate(dateStr) {
  if (!dateStr) return null;

  const lowerStr = dateStr.toLowerCase().trim();

  if (lowerStr.includes('contact for') || lowerStr === '') {
    return null;
  }

  if (lowerStr.includes('available now') || lowerStr.includes('immediately') || lowerStr.includes('asap')) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Try MM/DD/YYYY format
  let dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [_, month, day, year] = dateMatch;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // Try MM/DD/YY format
  dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2})(?!\d)/);
  if (dateMatch) {
    const [_, month, day, yearShort] = dateMatch;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    const yearNum = parseInt(yearShort);
    
    const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${fullYear}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // Try Month DD, YYYY format
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

  console.log('[v0] Could not parse availability date:', dateStr);
  return null;
}

/**
 * Scrape Apartments.com using Puppeteer (bypasses anti-bot protection)
 */
async function scrapeApartmentsWithPuppeteer() {
  console.log('[v0] Starting Puppeteer scraper for Apartments.com...');
  
  let browser;
  try {
    // Launch Puppeteer with no-sandbox for Vercel environment
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    console.log('[v0] Browser launched');
    const page = await browser.newPage();

    // Set user agent to appear as real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('[v0] Navigating to Apartments.com URL:', APARTMENTS_COM_URL);
    await page.goto(APARTMENTS_COM_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('[v0] Page loaded, extracting units...');

    // Extract units from the page
    const units = await page.evaluate(() => {
      const results = [];
      const seenUnits = new Set();

      // Find all unit listings
      const unitCards = document.querySelectorAll('[data-testid="apartmentCard"], [class*="ApartmentCard"], [class*="unit-card"]');
      
      if (unitCards.length === 0) {
        console.log('No unit cards found with standard selectors');
        return results;
      }

      unitCards.forEach((card) => {
        try {
          const text = card.innerText || card.textContent;

          // Extract price
          const priceMatch = text.match(/\$\s*([\d,]+)/);
          if (!priceMatch) return;

          const price = parseInt(priceMatch[1].replace(/,/g, ''));
          if (price < 500 || price > 50000) return;

          // Extract bedrooms
          const bedsMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i);
          const beds = bedsMatch ? parseInt(bedsMatch[1]) : null;

          const isStudio = /studio/i.test(text);
          const bedrooms = isStudio ? 0 : beds;

          // Extract bathrooms
          const bathsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
          const baths = bathsMatch ? parseFloat(bathsMatch[1]) : null;

          // Extract sqft
          const sqftMatch = text.match(/(\d+(?:,\d+)?)\s*(?:sqft|sq\.?\s*ft|square\s*feet)/i);
          const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;

          // Extract availability date
          let availabilityDate = null;
          const availPatterns = [
            /available\s+(?:now|immediately|asap)/i,
            /available\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
            /available\s+([a-z]+\s+\d{1,2},?\s+\d{4})/i,
            /contact\s+for\s+availability/i,
          ];

          for (const pattern of availPatterns) {
            const match = text.match(pattern);
            if (match) {
              availabilityDate = match[1] || match[0];
              break;
            }
          }

          // Determine unit type
          let unitType = 'Unknown';
          if (isStudio) unitType = 'Studio';
          else if (bedrooms === 1) unitType = '1B';
          else if (bedrooms === 2) unitType = '2B';
          else if (bedrooms === 3) unitType = '3B';
          else if (bedrooms === 4) unitType = '4B';

          const uniqueKey = `${price}-${bedrooms}-${baths}-${sqft}`;
          if (seenUnits.has(uniqueKey)) return;
          seenUnits.add(uniqueKey);

          results.push({
            price,
            floorPlanType: unitType,
            beds: bedrooms,
            baths,
            sqft,
            availableDate,
          });
        } catch (err) {
          console.log('Error parsing unit:', err.message);
        }
      });

      return results;
    });

    console.log('[v0] Puppeteer extracted', units.length, 'units');

    // Parse availability dates
    const parsedUnits = units.map(unit => ({
      ...unit,
      availableDate: parseAvailabilityDate(unit.availableDate),
    }));

    return parsedUnits;
  } catch (err) {
    console.error('[v0] Puppeteer scraper error:', err.message);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
      console.log('[v0] Browser closed');
    }
  }
}

// Shared scraper logic - uses Puppeteer for Apartments.com, falls back to Flow
async function executeScraper() {
  const results = {};

  try {
    console.log('[v0] Scraping started at', new Date().toISOString());

    // Set 120-second timeout for Puppeteer rendering
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Scrape timeout: exceeded 120 seconds')), 120000)
    );

    const scrapePromise = (async () => {
      let unitsToStore = null;
      let sourceUsed = null;

      // Primary: Puppeteer scraper for real Apartments.com dates
      console.log('[v0] Starting Apartments.com Puppeteer scraper (PRIMARY)...');
      try {
        const apartmentsUnits = await scrapeApartmentsWithPuppeteer();
        if (apartmentsUnits && apartmentsUnits.length > 0) {
          console.log('[v0] Puppeteer succeeded, units count:', apartmentsUnits.length);
          results['apartments-puppeteer'] = apartmentsUnits;
          unitsToStore = apartmentsUnits;
          sourceUsed = 'apartments-puppeteer';
        } else {
          console.warn('[v0] Puppeteer returned no units');
          results['apartments-puppeteer-error'] = 'No units returned from Puppeteer scraper';
        }
      } catch (err) {
        console.error('[v0] Puppeteer scraper failed:', err.message);
        results['apartments-puppeteer-error'] = err.message;
      }

      // Fallback: Flow scraper if Puppeteer fails
      if (!unitsToStore) {
        console.log('[v0] Puppeteer failed, falling back to Flow scraper...');
        try {
          const flowUnits = await scrapeFlowBuilding('flow-brickell');
          if (flowUnits && flowUnits.length > 0) {
            console.log('[v0] Flow scraper succeeded, units count:', flowUnits.length);
            results['flow-brickell-fallback'] = flowUnits;
            unitsToStore = flowUnits;
            sourceUsed = 'flow-brickell-fallback';
          } else {
            throw new Error('Flow scraper returned no units');
          }
        } catch (err) {
          console.error('[v0] Flow scraper failed:', err.message);
          results['flow-error'] = err.message;
          throw new Error('Both Puppeteer and Flow scrapers failed - no data available');
        }
      }

      // Store the data
      if (unitsToStore) {
        console.log('[v0] Storing data from source:', sourceUsed, 'with', unitsToStore.length, 'units');
        const stored = await storePricingData('flow-brickell', unitsToStore);
        console.log('[v0] storePricingData returned:', stored);
        
        if (!stored) {
          console.warn('[v0] Failed to store in Supabase, using memory cache');
          global.unitCache = global.unitCache || {};
          global.unitCache['flow-brickell'] = {
            units: unitsToStore,
            source: sourceUsed,
            updatedAt: new Date().toISOString(),
          };
        } else {
          console.log('[v0] Successfully stored data from', sourceUsed, 'in Supabase');
        }
      }
    })();

    await Promise.race([scrapePromise, timeoutPromise]);

    console.log('[v0] Scraping completed');
    return { success: true, results };
  } catch (err) {
    console.error('[v0] Scrape error:', err.message);
    throw err;
  }
}

// Validate request authorization
function validateAuth(req) {
  // Vercel cron uses the CRON_SECRET from vercel.json automatically
  // For manual testing, accept Bearer token from authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return true;
  }
  
  // Check for Vercel's internal cron verification
  const vercelCronSecret = req.headers.get('authorization');
  if (vercelCronSecret === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  
  // Allow local testing and Vercel cron (which includes auth automatically)
  return true;
}

export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await executeScraper();
    return Response.json(result);
  } catch (err) {
    console.error('[v0] Scrape error:', err.message, 'at', new Date().toISOString());
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET handler for Vercel Cron
// Vercel automatically calls this endpoint at the scheduled time (6 AM UTC daily)
export async function GET(req) {
  try {
    const result = await executeScraper();
    return Response.json(result);
  } catch (err) {
    console.error('[v0] Vercel cron scraper error:', err.message);
    // Return 200 to acknowledge the cron job ran, but include error details
    return Response.json({ success: false, error: err.message }, { status: 200 });
  }
}
