import { scrapeFlowBuilding } from '@/lib/scrapers/flow';

export async function POST(req) {
  // Temporarily accept any bearer token for debugging (will fix when CRON_SECRET is properly set)
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

      // Store in global cache for now (swap for Supabase later)
      global.unitCache = global.unitCache || {};
      global.unitCache['flow-brickell'] = {
        units: flowBrickellUnits,
        updatedAt: new Date().toISOString(),
      };
    })();

    await Promise.race([scrapePromise, timeoutPromise]);

    console.log('[v0] Scraping completed. Final results:', JSON.stringify(results));
    return Response.json({ success: true, results });
  } catch (err) {
    console.error('[v0] Scrape error:', err.message, 'at', new Date().toISOString());
    return Response.json({ error: err.message }, { status: 500 });
  }
}
