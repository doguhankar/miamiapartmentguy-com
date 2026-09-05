// Shared unit shape + per-unit filter-matching helpers used by both the map
// experience (to decide which buildings/markers are visible) and building
// cards (to decide which specific unit's price/availability to surface when
// filters are active). Keeping these in one place avoids the matching logic
// silently drifting between the two call sites.

export type AvailableUnit = {
  floorPlanType?: string;
  beds?: string | number;
  price?: number;
  sqft?: number;
  square_feet?: number;
  availableDate?: string | null;
  available_date?: string | null;
  baths?: number | string;
};

export type PricingInventory = Record<string, { units: AvailableUnit[] }>;

export const unitMatchesSize = (unit: AvailableUnit, size: string) => {
  const label = `${unit.floorPlanType ?? ''} ${unit.beds ?? ''}`.toLowerCase();
  if (size === 'Studio') return label.includes('studio') || /(^|\D)0(\D|$)/.test(label);
  if (size === '1BR') return label.includes('1br') || label.includes('1 bedroom') || /(^|\D)1(\D|$)/.test(label);
  if (size === '2BR') return label.includes('2br') || label.includes('2 bedroom') || /(^|\D)2(\D|$)/.test(label);
  if (size === '3BR') return label.includes('3br') || label.includes('3 bedroom') || /(^|\D)3(\D|$)/.test(label);
  return true;
};

// The Bedroom Size filter (map-filter-card.tsx) emits '+'-suffixed minimums:
// 'Studio+', '1+', '2+', '3+', '4+'. Each means "this many bedrooms or more".
export const BEDROOM_MIN_BY_FILTER: Record<string, number> = {
  'Studio+': 0,
  '1+': 1,
  '2+': 2,
  '3+': 3,
  '4+': 4,
};

// Resolve a unit's bedroom count from whichever field actually has it: the
// numeric/stringified `beds` column from pricing_units, falling back to
// parsing the floor-plan label text when `beds` isn't present or numeric.
export const getUnitBedCount = (unit: AvailableUnit): number | null => {
  if (typeof unit.beds === 'number' && Number.isFinite(unit.beds)) return unit.beds;
  if (typeof unit.beds === 'string') {
    const trimmed = unit.beds.trim();
    if (/^studio$/i.test(trimmed)) return 0;
    const numeric = Number.parseFloat(trimmed);
    if (Number.isFinite(numeric)) return numeric;
  }
  const label = `${unit.floorPlanType ?? ''} ${unit.beds ?? ''}`.toLowerCase();
  if (label.includes('studio')) return 0;
  const labelMatch = label.match(/(\d+)\s*(br|bed|bedroom)/);
  if (labelMatch) return Number(labelMatch[1]);
  return null;
};

export const unitMatchesBedroomFilter = (unit: AvailableUnit, filter: string) => {
  const min = BEDROOM_MIN_BY_FILTER[filter];
  if (min === undefined) return true;
  const beds = getUnitBedCount(unit);
  // Unknown bed count: don't let a data gap silently exclude the unit.
  if (beds === null) return true;
  return beds >= min;
};

export const unitMatchesBathroomFilter = (unit: AvailableUnit, filter: string) => {
  const minimum = Number.parseFloat(filter.replace('+', ''));
  const baths = typeof unit.baths === 'number' ? unit.baths : Number.parseFloat(String(unit.baths ?? ''));
  return Number.isFinite(baths) && baths >= minimum;
};

// requestedDate is a 'YYYY-MM-DD' move-in date the visitor wants to move in
// by. A unit matches if it will be ready on or before that date.
export const unitAvailableByDate = (unit: AvailableUnit, requestedDate: string) => {
  const rawDate = unit.availableDate ?? unit.available_date;
  if (!rawDate) return true;
  return rawDate.slice(0, 10) <= requestedDate;
};
