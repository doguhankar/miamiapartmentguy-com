import { scrapeFlowBuilding } from '@/lib/scrapers/flow';

export async function POST(req, res) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {};

  try {
    const flowBrickellUnits = await scrapeFlowBuilding('flow-brickell');
    results['flow-brickell'] = flowBrickellUnits;

    // Store in global cache for now (swap for Supabase later)
    global.unitCache = global.unitCache || {};
    global.unitCache['flow-brickell'] = {
      units: flowBrickellUnits,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Scrape error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ success: true, results });
}
