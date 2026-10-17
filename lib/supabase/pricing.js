import { createClient } from '@supabase/supabase-js';
import { getBuildingMapping } from '@/lib/scrapers/building-map';

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

const EMPTY_CONCESSION = { moveInCredit: null, monthsFree: null, concessionText: null };

function hasConcession(concession) {
  return Boolean(concession && (concession.concessionText || concession.moveInCredit || concession.monthsFree));
}

// A unit keeps its own offer only when the page gave it one. Otherwise it inherits the
// building-level offer. One unit's offer is never copied onto another unit.
export function resolveUnitConcession(unit) {
  if (hasConcession(unit.unitConcession)) return unit.unitConcession;
  if (hasConcession(unit.buildingConcession)) return unit.buildingConcession;
  return EMPTY_CONCESSION;
}

// Record one scrape attempt. The real status (success, or the failure reason) is stored as given;
// if the column rejects a long reason, retry with a plain 'failed' so the attempt is still recorded.
export async function logScrape(appId, unitsCount, status, { client } = {}) {
  const supabase = client || getSupabaseClient();
  const row = { building_id: String(appId), units_count: unitsCount, status: String(status).slice(0, 200) };
  const { error } = await supabase.from('scrape_logs').insert(row);
  if (!error) return true;
  console.error('[v0] scrape_logs insert failed:', error.message);
  const retry = await supabase.from('scrape_logs').insert({ ...row, status: 'failed' });
  return !retry.error;
}

// Upsert scraped units into public.units on (buildingid, unitnumber).
// Never deletes: a unit missing from a scrape is left alone.
// building_id (app ID) and buildingid (Apartments.com key) both come from the per-building mapping.
export async function storeUnits(appId, units, { client } = {}) {
  const mapping = getBuildingMapping(appId);
  if (!mapping) throw new Error(`No building mapping for: ${appId}`);

  const supabase = client || getSupabaseClient();
  const byUnitNumber = new Map();
  let skipped = 0;

  for (const unit of units || []) {
    const unitNumber = unit.unitNumber ? String(unit.unitNumber) : null;
    if (!unitNumber || unit.price == null) {
      skipped += 1;
      continue;
    }
    byUnitNumber.set(unitNumber, unit);
  }

  if (byUnitNumber.size === 0) return { inserted: 0, updated: 0, skipped };

  const { data: existingRows, error: existingError } = await supabase
    .from('units')
    .select('unitnumber, unittype, photos, floor_plan_image, floor_plan_code, plan_name')
    .eq('buildingid', mapping.apartmentsKey)
    .in('unitnumber', [...byUnitNumber.keys()]);
  if (existingError) throw existingError;

  const existing = new Map((existingRows || []).map(row => [row.unitnumber, row]));
  const now = new Date().toISOString();

  const rows = [...byUnitNumber.entries()].map(([unitNumber, unit]) => {
    const current = existing.get(unitNumber);
    const concession = resolveUnitConcession(unit);
    const photos = Array.isArray(unit.photos) && unit.photos.length > 0 ? unit.photos : current?.photos ?? null;
    const unitType = unit.unitType && unit.unitType !== 'Unknown' ? unit.unitType : current?.unittype ?? null;

    return {
      building_id: mapping.appId,
      buildingid: mapping.apartmentsKey,
      buildingname: mapping.name,
      unitnumber: unitNumber,
      unittype: unitType,
      price: unit.price,
      beds: unit.beds ?? null,
      baths: unit.baths ?? null,
      sqft: unit.sqft ?? null,
      availabilitydate: unit.availableDate || null,
      photos,
      floor_plan_code: unit.floorPlanCode || current?.floor_plan_code || null,
      plan_name: unit.planName || current?.plan_name || null,
      floor_plan_image: unit.floorPlanImage || current?.floor_plan_image || null,
      move_in_credit: concession.moveInCredit || null,
      months_free: concession.monthsFree || null,
      concession_text: concession.concessionText || null,
      lastupdated: now,
    };
  });

  const { error } = await supabase.from('units').upsert(rows, { onConflict: 'buildingid,unitnumber' });
  if (error) throw error;

  const updated = rows.filter(row => existing.has(row.unitnumber)).length;
  return { inserted: rows.length - updated, updated, skipped };
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
      const mapped = {
        building_id: buildingId,
        floor_plan_type: unit.floorPlanType,
        beds: unit.beds || null,
        baths: unit.baths || null,
        sqft: unit.sqft || null,
        price: unit.price,
        available_date: unit.availableDate || null,
      };
      if (idx < 2) {
        console.log('[v0] [STEP 4] Unit', idx, ':', JSON.stringify(mapped));
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
