import { createClient } from '@supabase/supabase-js';

let initialized = false;

// Create Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

// Initialize tables if they don't exist
export async function initializeSchema() {
  if (initialized) return;

  try {
    const supabase = getSupabaseClient();
    
    // Try to query the tables to see if they exist
    // If they don't exist, we'll get an error but that's okay for now
    // Tables should be created manually via Supabase dashboard or CLI
    console.log('[v0] Supabase schema initialization - tables will be created via Supabase dashboard');
    initialized = true;
  } catch (err) {
    console.error('[v0] Schema initialization error:', err);
  }
}

// Get building pricing data from Supabase
export async function getPricingData(buildingId) {
  try {
    const supabase = getSupabaseClient();

    // Get all units for the building
    const { data: units, error: unitsError } = await supabase
      .from('pricing_units')
      .select('*')
      .eq('building_id', buildingId)
      .order('price', { ascending: true });

    if (unitsError) {
      // If table doesn't exist, return null to fall back to cache
      if (unitsError.message.includes('does not exist')) {
        console.log('[v0] pricing_units table does not exist yet');
        return null;
      }
      console.error('[v0] Supabase query error:', unitsError);
      return null;
    }

    if (!units || units.length === 0) {
      return null;
    }

    // Get the most recent scrape log to get the update timestamp
    const { data: logs, error: logsError } = await supabase
      .from('scrape_logs')
      .select('scraped_at')
      .eq('building_id', buildingId)
      .eq('status', 'success')
      .order('scraped_at', { ascending: false })
      .limit(1);

    const updatedAt = logs && logs.length > 0 ? logs[0].scraped_at : new Date().toISOString();

    console.log('[v0] Fetched', units.length, 'units from Supabase for', buildingId);

    return {
      buildingId,
      updatedAt,
      units: units.map(unit => ({
        floorPlanType: unit.floor_plan_type,
        beds: unit.beds,
        baths: unit.baths,
        sqft: unit.sqft,
        price: unit.price,
        availableDate: unit.available_date,
      })),
    };
  } catch (err) {
    console.error('[v0] Error fetching pricing data from Supabase:', err);
    return null;
  }
}

// Store pricing data in Supabase
export async function storePricingData(buildingId, units) {
  try {
    const supabase = getSupabaseClient();

    console.log('[v0] Attempting to store', units.length, 'units for', buildingId, 'in Supabase');

    // Ensure building exists
    const { data: building, error: checkError } = await supabase
      .from('buildings')
      .select('id')
      .eq('id', buildingId)
      .single();

    if (!building && checkError?.code !== 'PGRST116') {
      // If there's an error other than "no rows", return false
      console.error('[v0] Error checking building:', checkError);
      return false;
    }

    if (!building) {
      // Building doesn't exist, create it
      console.log('[v0] Creating building:', buildingId);
      const { error: insertError } = await supabase
        .from('buildings')
        .insert({ id: buildingId, name: buildingId, neighborhood: 'Miami', address: 'TBD' });

      if (insertError) {
        console.error('[v0] Error creating building:', insertError);
        // Don't fail here, continue with storing units
      }
    }

    // Delete old units for this building
    console.log('[v0] Deleting old units for', buildingId);
    const { error: deleteError } = await supabase
      .from('pricing_units')
      .delete()
      .eq('building_id', buildingId);

    if (deleteError) {
      console.error('[v0] Error deleting old units:', deleteError);
    }

    // Insert new units
    const unitsToInsert = units.map(unit => ({
      building_id: buildingId,
      floor_plan_type: unit.floorPlanType,
      beds: unit.beds || null,
      baths: unit.baths || null,
      sqft: unit.sqft || null,
      price: unit.price,
      available_date: unit.availableDate || null,
    }));

    console.log('[v0] Inserting', unitsToInsert.length, 'new units into Supabase');
    const { error: insertUnitsError } = await supabase
      .from('pricing_units')
      .insert(unitsToInsert);

    if (insertUnitsError) {
      console.error('[v0] Error inserting units:', insertUnitsError);
      return false;
    }

    // Log the successful scrape
    const { error: logError } = await supabase
      .from('scrape_logs')
      .insert({
        building_id: buildingId,
        units_count: units.length,
        status: 'success',
      });

    if (logError) {
      console.error('[v0] Error logging scrape:', logError);
      // Don't fail if we can't log, data is already stored
    }

    console.log('[v0] Successfully stored', units.length, 'units for', buildingId, 'in Supabase');
    return true;
  } catch (err) {
    console.error('[v0] Error storing pricing data in Supabase:', err);
    return false;
  }
}
