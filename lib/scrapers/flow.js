import puppeteer from 'puppeteer';

const FLOW_BUILDINGS = {
  'flow-brickell': 'https://flow.life/en/properties/miami-brickell/available-homes',
};

export async function scrapeFlowBuilding(buildingId) {
  const baseUrl = FLOW_BUILDINGS[buildingId];
  let browser;

  try {
    console.log('[v0] Scraper starting for building:', buildingId);
    console.log('[v0] Environment: Node.js', process.version);
    console.log('[v0] Launching Puppeteer browser...');
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      console.log('[v0] Puppeteer browser launched successfully');
    } catch (launchErr) {
      console.error('[v0] CRITICAL: Puppeteer launch failed:', launchErr.message);
      console.error('[v0] Error code:', launchErr.code);
      console.error('[v0] Error stack:', launchErr.stack);
      throw launchErr;
    }

    console.log('[v0] Opening page:', baseUrl);
    const page = await browser.newPage();
    console.log('[v0] Page opened');
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    console.log('[v0] Viewport and user agent set');

    // Navigate to page and wait for content
    console.log('[v0] Navigating to page...');
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log('[v0] Page navigation completed successfully');
    } catch (navErr) {
      console.error('[v0] Navigation error:', navErr.message);
      throw navErr;
    }

    // Log rendered HTML to see the actual structure
    const renderedHtml = await page.content();
    console.log('[v0] Rendered HTML (first 3000 characters):');
    console.log(renderedHtml.substring(0, 3000));
    console.log('[v0] ---');

    // Wait for floor plan elements to load
    console.log('[v0] Waiting for floor plan data to load...');
    await page.waitForSelector('button, a, [class*="plan"], [class*="unit"], [class*="price"]', { timeout: 10000 }).catch(() => {
      console.log('[v0] Selector timeout - page may still have content');
    });

    // Extract floor plan data using page evaluation
    console.log('[v0] Extracting floor plan data from rendered page...');
    const units = await page.evaluate(() => {
      const extractedUnits = [];
      
      // Try multiple selector strategies to find floor plan data
      const candidates = [
        // Strategy 1: Look for price mentions in text
        ...Array.from(document.querySelectorAll('button, div, a')).filter(el => el.textContent.includes('$')),
        // Strategy 2: Look for common floor plan containers
        ...Array.from(document.querySelectorAll('[class*="card"], [class*="plan"], [class*="unit"], [class*="apartment"]')),
      ];

      // Remove duplicates
      const seen = new Set();
      const uniqueCandidates = candidates.filter(el => {
        const key = el.textContent.substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      for (const el of uniqueCandidates) {
        const text = el.textContent || '';
        
        // Look for price pattern: $2,841 or similar
        const priceMatch = text.match(/\$[\d,]+/);
        if (!priceMatch) continue;

        const price = parseInt(priceMatch[0].replace(/[$,]/g, ''));

        // Look for bedroom info
        const bedsMatch = text.match(/(\d+)\s*(?:bed|br|b\.r|bd)/i);
        const beds = bedsMatch ? parseInt(bedsMatch[1]) : null;

        // Look for bathroom info
        const bathsMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba|b\.a)/i);
        const baths = bathsMatch ? parseFloat(bathsMatch[1]) : null;

        // Look for sqft info
        const sqftMatch = text.match(/(\d+,?\d*)\s*(?:sqft|sq\.?\s*ft|sf)/i);
        const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;

        // Try to extract floor plan type (Studio, 1BR, etc)
        let floorPlanType = null;
        if (bedsMatch && bathsMatch) {
          floorPlanType = `${beds}B/${baths}Ba`;
        } else if (text.includes('Studio')) {
          floorPlanType = 'Studio';
        } else if (bedsMatch) {
          floorPlanType = `${beds}BR`;
        }

        if (price && (floorPlanType || beds)) {
          extractedUnits.push({
            floorPlanType: floorPlanType || 'TBD',
            price,
            beds,
            baths,
            sqft,
            availableDate: 'Available Now',
          });
        }
      }

      return extractedUnits;
    });

    console.log('[v0] Extracted', units.length, 'floor plans');
    console.log('[v0] Closing browser...');
    await browser.close();
    console.log('[v0] Browser closed successfully');

    return units;
  } catch (err) {
    console.error('[v0] CRITICAL ERROR in scrapeFlowBuilding:', err.message);
    console.error('[v0] Error type:', err.constructor.name);
    console.error('[v0] Error stack:', err.stack);
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error('[v0] Error closing browser:', closeErr.message);
      }
    }
    throw err;
  }
}
