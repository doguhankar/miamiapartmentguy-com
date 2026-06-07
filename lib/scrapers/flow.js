import * as cheerio from 'cheerio';

const FLOW_BUILDINGS = {
  'flow-brickell': 'https://flow.life/en/properties/miami-brickell/available-homes',
};

export async function scrapeFlowBuilding(buildingId) {
  const baseUrl = FLOW_BUILDINGS[buildingId];

  try {
    console.log('[v0] Scraper starting for building:', buildingId);
    console.log('[v0] Fetching URL:', baseUrl);

    // Fetch the page with a user agent
    const response = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('[v0] HTML fetched, length:', html.length);
    console.log('[v0] First 2000 characters:', html.substring(0, 2000));

    // Parse with Cheerio
    const $ = cheerio.load(html);
    console.log('[v0] HTML loaded into Cheerio');

    const units = [];

    // Find all unit cards/containers
    // Flow typically uses data attributes or specific class patterns
    const unitSelectors = [
      '[data-testid*="unit"]',
      '[class*="unit-card"]',
      '[class*="apartment"]',
      '[class*="floor-plan"]',
      '.plan-card',
      '[data-floorplan]',
    ];

    let foundElements = 0;
    for (const selector of unitSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log('[v0] Found', elements.length, 'elements with selector:', selector);
        foundElements += elements.length;
        
        elements.each((index, element) => {
          try {
            const $el = $(element);
            const text = $el.text() || '';

            console.log('[v0] Processing element', index, '- text preview:', text.substring(0, 100));

            // Extract floor plan type (e.g., S01, A01, B01, etc.)
            let floorPlanType = null;
            const planCodeMatch = text.match(/([A-Z]\d{2})/);
            if (planCodeMatch) {
              floorPlanType = planCodeMatch[1];
            } else {
              // Fallback: look for Studio, 1BR, 2BR patterns
              if (text.includes('Studio')) {
                floorPlanType = 'Studio';
              } else {
                const bedsMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i);
                if (bedsMatch) {
                  floorPlanType = `${bedsMatch[1]}B`;
                }
              }
            }

            // Extract price (e.g., $2,841)
            const priceMatch = text.match(/\$\s*([\d,]+)/);
            if (!priceMatch) {
              console.log('[v0] No price found in element', index);
              return; // Skip if no price
            }
            const price = parseInt(priceMatch[1].replace(/,/g, ''));

            // Extract beds
            const bedsMatch = text.match(/(\d+)\s*(?:bed|br|b\.r|bd)/i);
            const beds = bedsMatch ? parseInt(bedsMatch[1]) : null;

            // Extract baths
            const bathsMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba|b\.a)/i);
            const baths = bathsMatch ? parseFloat(bathsMatch[1]) : null;

            // Extract sqft
            const sqftMatch = text.match(/(\d+,?\d*)\s*(?:sqft|sq\.?\s*ft|sf)/i);
            const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;

            // Extract available count (e.g., "6 available")
            const availableMatch = text.match(/(\d+)\s*(?:available|avail)/i);
            const availableCount = availableMatch ? parseInt(availableMatch[1]) : null;

            // Extract move-in date
            const availableDate = text.includes('Available Now') ? 'Available Now' : 'Contact for details';

            if (floorPlanType && price) {
              const unit = {
                floorPlanType,
                price,
                beds,
                baths,
                sqft,
                availableCount,
                availableDate,
              };
              units.push(unit);
              console.log('[v0] Added unit:', unit);
            }
          } catch (elementErr) {
            console.error('[v0] Error processing element', index, ':', elementErr.message);
          }
        });
      }
    }

    console.log('[v0] Total elements found across all selectors:', foundElements);
    console.log('[v0] Total units extracted:', units.length);

    // If no units found with selector strategy, try parsing the full HTML structure
    if (units.length === 0) {
      console.log('[v0] No units found with selectors, trying alternative parsing...');
      
      // Look for any text containing price patterns
      const pricePattern = /\$\s*([\d,]+)/g;
      let match;
      const prices = [];
      while ((match = pricePattern.exec(html)) !== null) {
        prices.push(parseInt(match[1].replace(/,/g, '')));
      }
      
      console.log('[v0] Found', prices.length, 'price mentions in HTML');
      
      // If we found prices but couldn't extract units, create minimal unit records
      if (prices.length > 0) {
        prices.slice(0, 10).forEach((price, idx) => {
          units.push({
            floorPlanType: `Unit ${idx + 1}`,
            price,
            beds: null,
            baths: null,
            sqft: null,
            availableCount: null,
            availableDate: 'Available Now',
          });
        });
        console.log('[v0] Created', units.length, 'minimal unit records from prices');
      }
    }

    console.log('[v0] Scraping completed successfully. Total units:', units.length);
    return units;
  } catch (err) {
    console.error('[v0] CRITICAL ERROR in scrapeFlowBuilding:', err.message);
    console.error('[v0] Error type:', err.constructor.name);
    console.error('[v0] Error stack:', err.stack);
    throw err;
  }
}
