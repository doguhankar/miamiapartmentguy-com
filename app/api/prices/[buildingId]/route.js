import { getPricingData } from '@/lib/supabase/pricing';

export async function GET(req, { params }) {
  const { buildingId } = await params;

  // First try Supabase
  const supabaseData = await getPricingData(buildingId);
  if (supabaseData) {
    return Response.json(supabaseData);
  }

  // Fallback to in-memory cache for backwards compatibility
  const cache = global.unitCache?.[buildingId];
  if (cache) {
    return Response.json({
      buildingId,
      updatedAt: cache.updatedAt,
      units: cache.units,
    });
  }

  return Response.json({ error: 'No data yet. Run /api/cron/scrape first.' }, { status: 404 });
}
