#!/usr/bin/env node

/**
 * Manual scraper runner
 * Executes the Apartments.com scraper for Flow Brickell immediately
 * with improved availability date extraction
 */

import { scrapeApartmentsBuilding } from './lib/scrapers/apartments.js';
import { storePricingData } from './lib/supabase/pricing.js';

async function runScraper() {
  console.log('[v0] ========================================');
  console.log('[v0] MANUAL SCRAPER TRIGGER');
  console.log('[v0] Started at:', new Date().toISOString());
  console.log('[v0] ========================================');
  console.log('[v0]');

  try {
    // Run Apartments.com scraper for Flow Brickell
    console.log('[v0] Step 1: Starting Apartments.com scraper for Flow Brickell...');
    const startTime = Date.now();
    
    const units = await scrapeApartmentsBuilding('flow-brickell');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('[v0] ✓ Apartments.com scraper completed in', duration, 'seconds');
    console.log('[v0] ✓ Units scraped:', units?.length || 0);
    console.log('[v0]');

    if (units && units.length > 0) {
      console.log('[v0] Unit Sample (first unit):');
      console.log('[v0]', JSON.stringify(units[0], null, 2));
      console.log('[v0]');

      // Show availability date breakdown
      console.log('[v0] Availability Date Breakdown:');
      const withDates = units.filter(u => u.availableDate);
      const withoutDates = units.filter(u => !u.availableDate);
      console.log('[v0]   - Units with dates:', withDates.length);
      console.log('[v0]   - Units without dates:', withoutDates.length);
      
      if (withDates.length > 0) {
        console.log('[v0]   - Sample dates:', withDates.slice(0, 3).map(u => u.availableDate).join(', '));
      }
      console.log('[v0]');

      // Store in Supabase
      console.log('[v0] Step 2: Storing data in Supabase...');
      try {
        const stored = await storePricingData('flow-brickell', units);
        if (stored) {
          console.log('[v0] ✓ Successfully stored', units.length, 'units in Supabase');
        } else {
          console.log('[v0] ⚠ storePricingData returned false - check Supabase connection');
        }
      } catch (err) {
        console.error('[v0] ✗ Supabase storage error:', err.message);
      }
    } else {
      console.log('[v0] ⚠ No units returned from scraper (possible blocking or mock data)');
    }

    console.log('[v0]');
    console.log('[v0] ========================================');
    console.log('[v0] SCRAPER COMPLETED');
    console.log('[v0] Finished at:', new Date().toISOString());
    console.log('[v0] ========================================');
    process.exit(0);

  } catch (error) {
    console.error('[v0] ✗ SCRAPER ERROR:', error.message);
    console.error('[v0] Stack:', error.stack);
    console.log('[v0]');
    console.log('[v0] ========================================');
    console.log('[v0] SCRAPER FAILED');
    console.log('[v0] ========================================');
    process.exit(1);
  }
}

runScraper();
