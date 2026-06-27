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
    console.log('[v0] ===== SUPABASE WRITE START =====');
    console.log('[v0] buildingId:', buildingId);
    console.log('[v0] units array length:', units.length);
    console.log('[v0] units array type:', Array.isArray(units) ? 'array' : typeof units);
    console.log('[v0] Full units array:', JSON.stringify(units, null, 2));
    
    if (!units || units.length === 0) {
      console.warn('[v0] WARNING: Empty units array, skipping write');
      return false;
    }

    const supabase = getSupabaseClient();
    console.log('[v0] Supabase client created');
    console.log('[v0] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('[v0] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

    // Ensure building exists
    console.log('[v0] [STEP 1] Checking if building exists...');
    const { data: building, error: checkError } = await supabase
      .from('buildings')
      .select('id')
      .eq('id', buildingId)
      .single();

    console.log('[v0] [STEP 1 RESPONSE] building:', building);
    console.log('[v0] [STEP 1 RESPONSE] checkError:', checkError);
    console.log('[v0] [STEP 1 RESPONSE] checkError code:', checkError?.code);
    console.log('[v0] [STEP 1 RESPONSE] checkError message:', checkError?.message);

    if (!building && checkError?.code !== 'PGRST116') {
      // If there's an error other than "no rows", return false
      console.error('[v0] [STEP 1 FAILED] Error checking building - not PGRST116');
      console.error('[v0] [STEP 1 FAILED] Full error:', checkError);
      return false;
    }

    if (!building) {
      // Building doesn't exist, create it
      console.log('[v0] [STEP 2] Building does not exist, creating...');
      const buildingData = { id: buildingId, name: buildingId, neighborhood: 'Miami', address: 'TBD' };
      console.log('[v0] [STEP 2] Inserting building:', JSON.stringify(buildingData));
      
      const { data: insertedBuilding, error: insertError } = await supabase
        .from('buildings')
        .insert(buildingData);

      console.log('[v0] [STEP 2 RESPONSE] insertedBuilding:', insertedBuilding);
      console.log('[v0] [STEP 2 RESPONSE] insertError:', insertError);
      console.log('[v0] [STEP 2 RESPONSE] insertError code:', insertError?.code);
      console.log('[v0] [STEP 2 RESPONSE] insertError message:', insertError?.message);

      if (insertError) {
        console.error('[v0] [STEP 2 ERROR] Error creating building:', insertError);
        // Don't fail here, continue with storing units
      } else {
        console.log('[v0] [STEP 2 SUCCESS] Building created');
      }
    } else {
      console.log('[v0] [STEP 2] Building already exists, skipping creation');
    }

    // Delete old units for this building
    console.log('[v0] [STEP 3] Deleting old units for', buildingId);
    const { count: deleteCount, error: deleteError } = await supabase
      .from('pricing_units')
      .delete()
      .eq('building_id', buildingId);

    console.log('[v0] [STEP 3 RESPONSE] deleteCount:', deleteCount);
    console.log('[v0] [STEP 3 RESPONSE] deleteError:', deleteError);
    console.log('[v0] [STEP 3 RESPONSE] deleteError code:', deleteError?.code);
    console.log('[v0] [STEP 3 RESPONSE] deleteError message:', deleteError?.message);

    if (deleteError) {
      console.error('[v0] [STEP 3 ERROR] Error deleting old units:', deleteError);
      // Don't fail here, continue
    } else {
      console.log('[v0] [STEP 3 SUCCESS] Deleted', deleteCount, 'old units');
    }

    // Insert new units
    console.log('[v0] [STEP 4] Preparing units to insert...');
    const unitsToInsert = units.map((unit, idx) => {
      console.log('[v0] [STEP 4] Processing unit', idx, '- input availableDate:', unit.availableDate, 'type:', typeof unit.availableDate);
      const mapped = {
        building_id: buildingId,
        floor_plan_type: unit.floorPlanType,
        beds: unit.beds || null,
        baths: unit.baths || null,
        sqft: unit.sqft || null,
        price: unit.price,
        available_date: unit.availableDate || null,
      };
      console.log('[v0] [STEP 4] Unit', idx, 'mapped available_date:', mapped.available_date);
      if (idx < 3) {
        console.log('[v0] [STEP 4] Full unit', idx, ':', JSON.stringify(mapped));
      }
      return mapped;
    });

    console.log('[v0] [STEP 4] Total units to insert:', unitsToInsert.length);
    console.log('[v0] [STEP 4] Full insert payload:', JSON.stringify(unitsToInsert, null, 2));
    
    console.log('[v0] [STEP 4] Calling insert...');
    const { data: insertedUnits, error: insertUnitsError, count: insertCount } = await supabase
      .from('pricing_units')
      .insert(unitsToInsert);

    console.log('[v0] [STEP 4 RESPONSE] insertedUnits:', insertedUnits);
    console.log('[v0] [STEP 4 RESPONSE] insertCount:', insertCount);
    console.log('[v0] [STEP 4 RESPONSE] insertUnitsError:', insertUnitsError);
    console.log('[v0] [STEP 4 RESPONSE] insertUnitsError code:', insertUnitsError?.code);
    console.log('[v0] [STEP 4 RESPONSE] insertUnitsError message:', insertUnitsError?.message);
    console.log('[v0] [STEP 4 RESPONSE] insertUnitsError details:', insertUnitsError?.details);

    if (insertUnitsError) {
      console.error('[v0] [STEP 4 FAILED] Error inserting units:');
      console.error('[v0] [STEP 4 FAILED] Error message:', insertUnitsError.message);
      console.error('[v0] [STEP 4 FAILED] Error code:', insertUnitsError.code);
      console.error('[v0] [STEP 4 FAILED] Error details:', insertUnitsError.details);
      console.error('[v0] [STEP 4 FAILED] Full error object:', JSON.stringify(insertUnitsError));
      return false;
    }

    console.log('[v0] [STEP 4 SUCCESS] Inserted', insertCount || unitsToInsert.length, 'units');

    // Log the successful scrape
    console.log('[v0] [STEP 5] Logging successful scrape...');
    const logData = {
      building_id: buildingId,
      units_count: units.length,
      status: 'success',
    };
    console.log('[v0] [STEP 5] Log payload:', JSON.stringify(logData));

    const { data: logRecord, error: logError } = await supabase
      .from('scrape_logs')
      .insert(logData);

    console.log('[v0] [STEP 5 RESPONSE] logRecord:', logRecord);
    console.log('[v0] [STEP 5 RESPONSE] logError:', logError);
    console.log('[v0] [STEP 5 RESPONSE] logError code:', logError?.code);
    console.log('[v0] [STEP 5 RESPONSE] logError message:', logError?.message);

    if (logError) {
      console.error('[v0] [STEP 5 ERROR] Error logging scrape:', logError);
      // Don't fail if we can't log, data is already stored
    } else {
      console.log('[v0] [STEP 5 SUCCESS] Scrape logged');
    }

    console.log('[v0] ===== SUPABASE WRITE SUCCESS =====');
    console.log('[v0] Successfully stored', units.length, 'units for', buildingId, 'in Supabase');
    return true;
  } catch (err) {
    console.error('[v0] ===== SUPABASE WRITE CRITICAL ERROR =====');
    console.error('[v0] Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('[v0] Error message:', err instanceof Error ? err.message : String(err));
    console.error('[v0] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    console.error('[v0] Full error:', err);
    return false;
  }
}
