export async function GET(req, { params }) {
  const { buildingId } = params;

  const cache = global.unitCache?.[buildingId];

  if (!cache) {
    return Response.json({ error: 'No data yet. Run /api/cron/scrape first.' }, { status: 404 });
  }

  return Response.json({
    buildingId,
    updatedAt: cache.updatedAt,
    units: cache.units,
  });
}
