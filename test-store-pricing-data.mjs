import { storePricingData } from './lib/supabase/pricing.js';

// Mock unit data from Flow scraper
const mockUnits = [
  {
    floorPlanType: 'Studio',
    price: 2841,
    beds: 0,
    baths: 1,
    sqft: 508,
    availableDate: '2026-06-27',
  },
  {
    floorPlanType: '1 Bed',
    price: 3559,
    beds: 1,
    baths: 1.5,
    sqft: 670,
    availableDate: '2026-06-27',
  },
  {
    floorPlanType: '2 Bed',
    price: 4835,
    beds: 2,
    baths: 2,
    sqft: 1008,
    availableDate: '2026-07-15',
  },
];

console.log('[v0] Test: Checking what data structure is being passed to storePricingData');
console.log('[v0] Mock units:', JSON.stringify(mockUnits, null, 2));
console.log('[v0] First unit availableDate:', mockUnits[0].availableDate);
console.log('[v0] Unit 3 availableDate:', mockUnits[2].availableDate);
