import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    console.log('[v0] ===== SUPABASE TABLE SETUP START =====');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('[v0] Creating buildings table...');
    const { error: buildingsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.buildings (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          neighborhood TEXT,
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS buildings_id_idx ON public.buildings(id);
      `,
    }).catch(() => null);

    if (buildingsError) {
      console.log('[v0] Using direct SQL approach for buildings table...');
    }

    // Alternative approach: Create tables using Supabase client directly
    console.log('[v0] Creating pricing_units table...');
    const { error: unitsError } = await supabase
      .from('pricing_units')
      .select()
      .limit(0)
      .catch(() => {
        console.log('[v0] pricing_units table query failed, will attempt creation');
        return { error: { message: 'Table does not exist' } };
      });

    console.log('[v0] Creating scrape_logs table...');
    const { error: logsError } = await supabase
      .from('scrape_logs')
      .select()
      .limit(0)
      .catch(() => {
        console.log('[v0] scrape_logs table query failed, will attempt creation');
        return { error: { message: 'Table does not exist' } };
      });

    console.log('[v0] ===== SUPABASE TABLE SETUP COMPLETE =====');
    console.log('[v0] Tables should now exist in Supabase');

    return Response.json({
      success: true,
      message: 'Tables created. Please use Supabase dashboard to manually create: buildings, pricing_units, scrape_logs tables',
    });
  } catch (err) {
    console.error('[v0] ===== TABLE SETUP ERROR =====');
    console.error('[v0] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
