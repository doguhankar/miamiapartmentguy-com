import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from('pricing_units')
      .select('building_id, floor_plan_type, beds, baths, sqft, price, available_date');

    if (error) throw error;

    const cache: Record<string, any> = {};
    
    data.forEach((row: any) => {
      if (!cache[row.building_id]) {
        cache[row.building_id] = {};
      }
      cache[row.building_id][row.floor_plan_type] = {
        price: row.price,
        beds: row.beds,
        baths: row.baths,
        sqft: row.sqft,
        available_date: row.available_date,
      };
    });

    (globalThis as any).pricingCache = cache;

    return Response.json({
      success: true,
      buildingsCached: Object.keys(cache).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
