import { scrapeFlowBuilding } from '@/lib/scrapers/flow';
import { scrapeApartmentsBuilding } from '@/lib/scrapers/apartments';
import { storePricingData } from '@/lib/supabase/pricing';

// Shared scraper logic
async function executeScraper() {
  const results = {};

  try {
    console.log('[v0] Scraping started at', new Date().toISOString());

    // Set 30-second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Scrape timeout: exceeded 30 seconds')), 30000)
    );

    const scrapePromise = (async () => {
      console.log('[v0] Starting Flow Brickell scrape...');
      const flowBrickellUnits = await scrapeFlowBuilding('flow-brickell');
      console.log('[v0] Flow Brickell scraped successfully, units count:', flowBrickellUnits?.length || 0);
      results['flow-brickell'] = flowBrickellUnits;

      // Store in Supabase instead of global cache
      console.log('[v0] Calling storePricingData with:', flowBrickellUnits.length, 'units');
      const stored = await storePricingData('flow-brickell', flowBrickellUnits);
      console.log('[v0] storePricingData returned:', stored);
      
      if (!stored) {
        console.warn('[v0] Failed to store data in Supabase, keeping in memory cache as fallback');
        global.unitCache = global.unitCache || {};
        global.unitCache['flow-brickell'] = {
          units: flowBrickellUnits,
          updatedAt: new Date().toISOString(),
        };
      } else {
        console.log('[v0] Successfully stored in Supabase, NOT using in-memory cache');
      }

      // Phase 1: Test Apartments.com scraper for Flow Brickell
      console.log('[v0] Starting Apartments.com scraper for Flow Brickell...');
      try {
        const apartmentsUnits = await scrapeApartmentsBuilding('flow-brickell');
        console.log('[v0] Apartments.com scraped successfully, units count:', apartmentsUnits?.length || 0);
        results['flow-brickell-apartments'] = apartmentsUnits;

        // Store Apartments.com data separately for now (Phase 1)
        console.log('[v0] Storing Apartments.com data...');
        const apartmentsStored = await storePricingData('flow-brickell', apartmentsUnits);
        console.log('[v0] Apartments.com data stored:', apartmentsStored);
      } catch (err) {
        console.error('[v0] Apartments.com scraper error:', err.message);
        results['flow-brickell-apartments-error'] = err.message;
      }
    })();

    await Promise.race([scrapePromise, timeoutPromise]);

    console.log('[v0] Scraping completed. Final results:', JSON.stringify(results));
    return { success: true, results };
  } catch (err) {
    console.error('[v0] Scrape error:', err.message, 'at', new Date().toISOString());
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
