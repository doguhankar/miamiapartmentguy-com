import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('[v0] Supabase credentials not configured');
    return null;
  }
  
  return createClient(url, key);
};

interface BuildingImages {
  buildingId: string;
  imageUrls: string[];
}

/**
 * Fetch image URLs for a specific building from Supabase
 * Falls back to hardcoded images if not found in database
 */
export async function getBuildingImages(
  buildingId: string,
  fallbackImages?: string[]
): Promise<string[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return fallbackImages || [];

    const { data, error } = await supabase
      .from('buildings')
      .select('image_urls')
      .eq('id', buildingId)
      .single();

    if (error || !data) {
      console.warn(`[v0] Images not found in Supabase for ${buildingId}, using fallback`);
      return fallbackImages || [];
    }

    // Ensure image_urls is an array
    const imageUrls = Array.isArray(data.image_urls) ? data.image_urls : [];
    return imageUrls.length > 0 ? imageUrls : fallbackImages || [];
  } catch (error) {
    console.error(`[v0] Error fetching images from Supabase:`, error);
    return fallbackImages || [];
  }
}

/**
 * Fetch all building images from Supabase
 */
export async function getAllBuildingImages(): Promise<Map<string, string[]>> {
  try {
    const supabase = getSupabase();
    if (!supabase) return new Map();

    const { data, error } = await supabase
      .from('buildings')
      .select('id, image_urls')
      .not('image_urls', 'is', null);

    if (error || !data) {
      console.warn('[v0] Failed to fetch all building images from Supabase');
      return new Map();
    }

    const imageMap = new Map<string, string[]>();
    data.forEach((building: any) => {
      if (building.image_urls && Array.isArray(building.image_urls)) {
        imageMap.set(building.id, building.image_urls);
      }
    });

    return imageMap;
  } catch (error) {
    console.error('[v0] Error fetching all building images:', error);
    return new Map();
  }
}
