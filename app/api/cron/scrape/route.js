import { scrapeApartmentsBuilding } from '@/lib/scrapers/apartments';
import { getScrapableBuildings } from '@/lib/scrapers/building-map';
import { logScrape, storePricingData, storeUnits } from '@/lib/supabase/pricing';

const PER_BUILDING_TIMEOUT_MS = 50000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function scrapeOneBuilding(building) {
  const units = await scrapeApartmentsBuilding(building.appId);
  if (!units || units.length === 0) {
    throw new Error('Apartments.com returned no units');
  }

  const unitsResult = await storeUnits(building.appId, units);

  // Existing pricing_units path stays as-is for buildings that already use it.
  // storePricingData writes its own success row to scrape_logs.
  if (building.legacyPricingUnits) {
    const stored = await storePricingData(building.appId, units);
    if (!stored) console.warn('[v0] pricing_units write failed for', building.appId);
  } else {
    await logScrape(building.appId, units.length, 'success');
  }

  return { scraped: units.length, ...unitsResult };
}

// One building failing never stops the others; each failure is logged to scrape_logs.
async function executeScraper() {
  const buildings = getScrapableBuildings();
  console.log('[v0] Scraping', buildings.length, 'buildings at', new Date().toISOString());

  const settled = await Promise.allSettled(
    buildings.map(building =>
      withTimeout(scrapeOneBuilding(building), PER_BUILDING_TIMEOUT_MS, `Scrape of ${building.appId}`)
    )
  );

  const results = {};
  for (let i = 0; i < buildings.length; i += 1) {
    const { appId } = buildings[i];
    const outcome = settled[i];

    if (outcome.status === 'fulfilled') {
      results[appId] = { ok: true, ...outcome.value };
      continue;
    }

    const message = outcome.reason?.message || String(outcome.reason);
    console.error('[v0] Scrape failed for', appId, ':', message);
    results[appId] = { ok: false, error: message };
    try {
      await logScrape(appId, 0, `failed: ${message}`);
    } catch (logErr) {
      console.error('[v0] Could not log failure for', appId, ':', logErr.message);
    }
  }

  const okCount = Object.values(results).filter(result => result.ok).length;
  return { success: okCount === buildings.length, succeeded: okCount, total: buildings.length, results };
}

export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await executeScraper();
    return Response.json(result, { status: result.succeeded === 0 && result.total > 0 ? 500 : 200 });
  } catch (err) {
    console.error('[v0] Scrape error:', err.message, 'at', new Date().toISOString());
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET handler for Vercel Cron (6 AM UTC daily). Always 200 so the cron run is acknowledged;
// per-building failures are in the body and in scrape_logs.
export async function GET() {
  try {
    const result = await executeScraper();
    return Response.json(result);
  } catch (err) {
    console.error('[v0] Vercel cron scraper error:', err.message);
    return Response.json({ success: false, error: err.message }, { status: 200 });
  }
}
