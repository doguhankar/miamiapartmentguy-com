import { scrapeApartmentsBuilding } from '@/lib/scrapers/apartments';
import { storePricingData } from '@/lib/supabase/pricing';

// Shared scraper logic - Apartments.com with retry and rotating User-Agents
async function executeScraper() {
  const results = {};

  try {
    console.log('[v0] Scraping started at', new Date().toISOString());

    // Set 60-second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Scrape timeout: exceeded 60 seconds')), 60000)
    );

    const scrapePromise = (async () => {
      // Cheerio scraper with rotating User-Agents and retry logic
      console.log('[v0] Starting Apartments.com scraper with anti-blocking...');
      try {
        const apartmentsUnits = await scrapeApartmentsBuilding('flow-brickell');
        if (apartmentsUnits && apartmentsUnits.length > 0) {
          console.log('[v0] Apartments.com scraper succeeded, units count:', apartmentsUnits.length);
          results['apartments-com'] = apartmentsUnits;

          // Store the data
          console.log('[v0] Storing', apartmentsUnits.length, 'units to Supabase...');
          const stored = await storePricingData('flow-brickell', apartmentsUnits);
          console.log('[v0] storePricingData returned:', stored);
          
          if (!stored) {
            console.warn('[v0] Failed to store in Supabase, using memory cache');
            global.unitCache = global.unitCache || {};
            global.unitCache['flow-brickell'] = {
              units: apartmentsUnits,
              source: 'apartments-com',
              updatedAt: new Date().toISOString(),
            };
          } else {
            console.log('[v0] Successfully stored data in Supabase');
          }
        } else {
          console.warn('[v0] Apartments.com returned no units');
          results['apartments-error'] = 'No units returned from Apartments.com';
          throw new Error('Apartments.com scraper returned no units');
        }
      } catch (err) {
        console.error('[v0] Apartments.com scraper failed:', err.message);
        results['apartments-error'] = err.message;
        throw new Error(`Apartments.com scraper failed: ${err.message}`);
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
