import { scrapeFlowBuilding } from '@/lib/scrapers/flow';
import { scrapeApartmentsBuilding } from '@/lib/scrapers/apartments';
import { storePricingData } from '@/lib/supabase/pricing';

export async function POST(req) {
  // For testing: accept any Bearer token. In production, validate against CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // TODO: In production, uncomment the line below and remove the test mode check above:
  // if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // }

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
    return Response.json({ success: true, results });
  } catch (err) {
    console.error('[v0] Scrape error:', err.message, 'at', new Date().toISOString());
    return Response.json({ error: err.message }, { status: 500 });
  }
}
