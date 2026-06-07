import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create buildings table if it doesn't exist
    console.log('[v0] Creating buildings table...');
    const { error: buildingsError } = await supabase.rpc('execute_sql', {
      sql: `CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        neighborhood TEXT NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
    });

    if (buildingsError && !buildingsError.message.includes('already exists')) {
      console.error('[v0] Buildings table error:', buildingsError);
    }

    // Create pricing_units table if it doesn't exist
    console.log('[v0] Creating pricing_units table...');
    const { error: unitsError } = await supabase.rpc('execute_sql', {
      sql: `CREATE TABLE IF NOT EXISTS pricing_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        building_id TEXT NOT NULL REFERENCES buildings(id),
        floor_plan_type TEXT NOT NULL,
        beds INTEGER,
        baths DECIMAL,
        sqft INTEGER,
        price INTEGER NOT NULL,
        available_date TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
    });

    if (unitsError && !unitsError.message.includes('already exists')) {
      console.error('[v0] Units table error:', unitsError);
    }

    // Create scrape_logs table if it doesn't exist
    console.log('[v0] Creating scrape_logs table...');
    const { error: logsError } = await supabase.rpc('execute_sql', {
      sql: `CREATE TABLE IF NOT EXISTS scrape_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        building_id TEXT NOT NULL,
        units_count INTEGER,
        status TEXT NOT NULL,
        error_message TEXT,
        scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
    });

    if (logsError && !logsError.message.includes('already exists')) {
      console.error('[v0] Logs table error:', logsError);
    }

    // Create indexes
    console.log('[v0] Creating indexes...');
    const { error: indexError } = await supabase.rpc('execute_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_pricing_units_building_id ON pricing_units(building_id);
            CREATE INDEX IF NOT EXISTS idx_scrape_logs_building_id ON scrape_logs(building_id);
            CREATE INDEX IF NOT EXISTS idx_scrape_logs_scraped_at ON scrape_logs(scraped_at DESC)`,
    });

    if (indexError && !indexError.message.includes('already exists')) {
      console.error('[v0] Index error:', indexError);
    }

    console.log('[v0] Supabase schema initialized successfully!');
    return Response.json({ success: true, message: 'Schema initialized' });
  } catch (err) {
    console.error('[v0] Schema setup error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
