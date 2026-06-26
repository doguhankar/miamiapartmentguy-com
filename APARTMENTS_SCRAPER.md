# Apartments.com Scraper - Phase 1

## Overview
Built a Node.js/Cheerio scraper for extracting apartment unit data from Apartments.com. This is Phase 1 - testing on Flow Brickell only.

## Status: Ready for Testing (Mock Data Mode)

### What's Been Implemented

#### 1. Scraper Module (`lib/scrapers/apartments.js`)
- **Parses unit listings** with multiple selector strategies (fallback-capable)
- **Extracts data fields**:
  - Price (integer, sanitized)
  - Unit type (Studio, 1B, 2B, 3B, etc.)
  - Bedrooms (integer, handles studio as 0)
  - Bathrooms (float)
  - Square footage (integer)
  - Availability date (parsed to YYYY-MM-DD)
  - Unit number (if available)
  - Photos (array of image URLs)
- **Duplicate detection** using price+beds+baths+sqft as unique key
- **Error handling** with detailed logging

#### 2. Data Format
Each unit is structured as:
```javascript
{
  price: 2500,                    // Monthly rent (integer)
  unitType: "Studio",             // Display label
  beds: 0,                        // Bedrooms (0 for studio)
  baths: 1,                       // Bathrooms (float)
  sqft: 550,                      // Square footage
  availableDate: "2026-06-26",    // YYYY-MM-DD or null
  unitNumber: "1505",             // Unit ID if available
  photos: []                      // Image URLs
}
```

#### 3. Integration Points
- **Cron Route** (`app/api/cron/scrape/route.js`): Calls scraper and stores data in Supabase
- **Pricing Utility** (`lib/supabase/pricing.js`): Stores/retrieves units from DB
- **API Endpoint** (`app/api/prices/[buildingId]/route.js`): Returns units to frontend
- **UI Component** (`components/building-detail-view.tsx`): Displays units with availability dates

#### 4. Phase 1 Testing Mode
- **Current Status**: Apartments.com returns HTTP 403 (anti-bot protection)
- **Workaround**: Scraper returns mock test data (4 sample units) to test the full pipeline
- **Fallback**: In production mode, will throw error; in dev mode, returns mock data

### Running Phase 1 Tests

#### Option 1: Direct Scraper Test
```bash
node test-apartments-scraper.mjs
```
Output shows 4 mock units with all required fields.

#### Option 2: Full Pipeline Test (via Cron)
```bash
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer test-token"
```
This:
1. Calls scraper for mock units
2. Stores in Supabase `pricing_units` table
3. Updates scrape_logs with status
4. Returns success response

#### Option 3: Query Stored Data
```bash
curl http://localhost:3000/api/prices/flow-brickell
```
Returns all units stored for Flow Brickell (from both Flow.life and Apartments.com scrapers).

### Known Limitations

#### Apartments.com Anti-Bot Protection
- Site returns **403 Forbidden** to direct fetch requests
- Common workarounds (all require trade-offs):
  1. **Puppeteer/Playwright**: Full browser automation, slower, uses more resources
  2. **Proxy rotation**: Use rotating residential proxies, adds cost/latency
  3. **API gateway**: Use third-party scraping service (ScrapingBee, etc.)
  4. **User requests**: Use manual data entry or connect to Apartments API if available

#### Current Selectors
The scraper tries multiple selector strategies:
- `[data-testid="apartmentCard"]`
- `[class*="ApartmentCard"]`
- `[class*="unit-card"]`
- Generic fallback (price + bed/bath/sqft pattern)

These may need adjustment if Apartments.com HTML structure changes.

### Database Schema
Units are stored in `pricing_units` table:
- `building_id`: TEXT (references buildings table)
- `floor_plan_type`: TEXT (unitType - "Studio", "1B", etc.)
- `beds`: INTEGER
- `baths`: DECIMAL
- `sqft`: INTEGER
- `price`: INTEGER (monthly rent)
- `available_date`: TEXT (YYYY-MM-DD or null)
- `photos`: Not currently stored (can add JSONB column if needed)

### UI Integration
BuildingDetailView displays availability dates from scraped data:
- Shows `unit.availableDate` from API response
- Falls back to "Available now" if null
- Badge format: "Available 2026-07-15" or "Available now"

### Next Steps for Production

1. **Resolve Anti-Bot Protection** (Choose one):
   - Implement Puppeteer for JavaScript rendering
   - Set up rotating proxy solution
   - Integrate with scraping service API

2. **Scale to Multiple Buildings**:
   - Create mapping of building IDs to Apartments.com URLs
   - Update cron to iterate through all 108 buildings
   - Implement rate limiting and delays between requests

3. **Add Photo Storage**:
   - Add `photos JSONB` column to pricing_units
   - Store extracted image URLs in database
   - Display in photo grid on front-end

4. **Validation & Deduplication**:
   - Add cross-scraper deduplication (Flow.life vs Apartments.com)
   - Validate data quality (price ranges, photo counts)
   - Track data freshness per building

5. **Error Handling**:
   - Implement retry logic with exponential backoff
   - Store detailed error logs per building
   - Alert on scraper failures

### Testing Checklist
- [x] Scraper module created and tested
- [x] Mock data pipeline works
- [x] Cron endpoint ready
- [x] Database schema supports all fields
- [x] API returns availability dates
- [x] UI displays availability dates
- [ ] Real Apartments.com data extraction (blocked by anti-bot)
- [ ] Multi-building iteration
- [ ] Production deployment

### Files Modified
- `lib/scrapers/apartments.js` - New scraper module
- `app/api/cron/scrape/route.js` - Added Apartments.com call
- `components/building-detail-view.tsx` - Updated to show dynamic availability dates

### Reverting to Production
If you need to disable mock data:
1. Remove the 403 mock data block from `lib/scrapers/apartments.js`
2. Or set `NODE_ENV=production` to throw error on blocked requests
