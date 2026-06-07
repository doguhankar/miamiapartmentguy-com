import * as cheerio from 'cheerio';

const FLOW_BUILDINGS = {
  'flow-brickell': 'https://flow.life/en/properties/miami-brickell/available-homes',
};

export async function scrapeFlowBuilding(buildingId) {
  const baseUrl = FLOW_BUILDINGS[buildingId];
  
  try {
    const res = await fetch(baseUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const units = [];

    // Parse each floor plan card directly from the main page
    $('[data-test="floor-plan-card"], .floor-plan-card').each((_, el) => {
      try {
        const floorPlanType = $(el).find('[data-test="floor-plan-type"], .floor-plan-name, h3').first().text().trim();
        
        // Extract price - look for $ followed by numbers and commas
        const priceText = $(el).find('[data-test="price"], .price').first().text();
        const priceMatch = priceText.match(/\$([0-9,]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

        // Extract beds, baths, sqft from info sections
        const beds = $(el).find('[data-test="beds"], .beds').first().text().match(/\d+/)?.[0] || null;
        const baths = $(el).find('[data-test="baths"], .baths').first().text().match(/\d+\.?\d*/)?.[0] || null;
        const sqft = $(el).find('[data-test="sqft"], .sqft').first().text().match(/\d+,?\d*/)?.[0]?.replace(/,/g, '') || null;

        // Extract available date
        const availableDateText = $(el).find('[data-test="available-date"], .available-date').first().text().trim();
        const availableDate = availableDateText || 'Available Now';

        if (floorPlanType && price) {
          units.push({
            floorPlanType,
            price,
            beds: beds ? parseInt(beds) : null,
            baths: baths ? parseFloat(baths) : null,
            sqft: sqft ? parseInt(sqft) : null,
            availableDate,
          });
        }
      } catch (err) {
        console.error('[v0] Error parsing floor plan card:', err.message);
      }
    });

    return units;
  } catch (err) {
    console.error('[v0] Error scraping Flow building:', err.message);
    throw err;
  }
}
