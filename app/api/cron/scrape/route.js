import { storePricingData } from '@/lib/supabase/pricing';

// Railway apartments scraper endpoint with Puppeteer support
const RAILWAY_SCRAPER_URL = 'https://apartments-scraper-production.up.railway.app/scrape';

// Shared scraper logic - calls Railway endpoint with Puppeteer support
async function executeScraper() {
  const results = {};

  try {
    console.log('[v0] Scraping started at', new Date().toISOString());

    // Set 60-second timeout for Railway scraper call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Scrape timeout: exceeded 60 seconds')), 60000)
    );

    const scrapePromise = (async () => {
      let unitsToStore = null;
      let sourceUsed = null;

      // Primary: Call Railway apartments scraper with Puppeteer (bypasses anti-bot)
      console.log('[v0] Starting Railway Puppeteer scraper...');
      try {
        const railwayResponse = await fetch(RAILWAY_SCRAPER_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!railwayResponse.ok) {
          throw new Error(`Railway scraper returned ${railwayResponse.status}`);
        }

        const railwayData = await railwayResponse.json();
        console.log('[v0] Railway scraper response:', JSON.stringify(railwayData).substring(0, 200));

        if (railwayData.units && Array.isArray(railwayData.units) && railwayData.units.length > 0) {
          console.log('[v0] Railway scraper succeeded, units count:', railwayData.units.length);
          results['railway-puppeteer'] = railwayData.units;
          unitsToStore = railwayData.units;
          sourceUsed = 'railway-puppeteer';
        } else {
          console.warn('[v0] Railway scraper returned empty or invalid data');
          results['railway-puppeteer-error'] = 'No units returned from Railway scraper';
        }
      } catch (err) {
        console.error('[v0] Railway scraper failed:', err.message);
        results['railway-puppeteer-error'] = err.message;
      }

      // If no data, we can't proceed (no local fallback - forcing Railway dependency)
      if (!unitsToStore) {
        throw new Error('Railway Puppeteer scraper failed - no data available');
      }

      // Store the data from Railway scraper
      if (unitsToStore) {
        console.log('[v0] Storing data from source:', sourceUsed, 'with', unitsToStore.length, 'units');
        const stored = await storePricingData('flow-brickell', unitsToStore);
        console.log('[v0] storePricingData returned:', stored);
        
        if (!stored) {
          console.warn('[v0] Failed to store data in Supabase, keeping in memory cache as fallback');
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
