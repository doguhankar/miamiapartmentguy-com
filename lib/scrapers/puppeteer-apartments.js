import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const APARTMENTS_COM_URL = 'https://www.apartments.com/flow-brickell-miami-fl/x13ew7n/';

/**
 * Parse availability date string to YYYY-MM-DD format
 */
function parseAvailabilityDate(dateStr) {
  if (!dateStr) return null;

  const lowerStr = dateStr.toLowerCase().trim();

  if (lowerStr.includes('contact for') || lowerStr === '') {
    return null;
  }

  if (lowerStr.includes('available now') || lowerStr.includes('immediately') || lowerStr.includes('asap')) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Try MM/DD/YYYY format
  let dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [_, month, day, year] = dateMatch;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // Try MM/DD/YY format
  dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2})(?!\d)/);
  if (dateMatch) {
    const [_, month, day, yearShort] = dateMatch;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    const yearNum = parseInt(yearShort);
    
    const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${fullYear}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // Try Month DD, YYYY format
  dateMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (dateMatch) {
    const monthMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const month = monthMap[dateMatch[1].toLowerCase().slice(0, 3)];
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3];
    
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  console.log('[v0] Could not parse availability date:', dateStr);
  return null;
}

/**
 * Get realistic User-Agent strings
 */
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.1 Safari/605.1.15',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Scrape Apartments.com using Puppeteer with anti-detection
 */
export async function scrapeApartmentsWithPuppeteer() {
  console.log('[v0] Starting Puppeteer scraper for Apartments.com...');
  console.log('[v0] Target URL:', APARTMENTS_COM_URL);

  let browser;
  const isVercel = !!process.env.VERCEL;

  try {
    console.log('[v0] Environment: ', isVercel ? 'Vercel' : 'Local');

    // Configure browser launch based on environment
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-resources',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-sync',
      '--disable-translate',
      '--disable-spell-check-provider',
      '--disable-component-extensions-with-background-pages',
      '--disable-component-update',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-backgrounding-occluded-windows',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-hang-monitor',
    ];

    let launchConfig;

    if (isVercel) {
      launchConfig = {
        args: [...launchArgs, ...chromium.args],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };
    } else {
      // Local: Try to find Chrome/Chromium executable
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      ];

      let executablePath = null;
      for (const path of possiblePaths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(path)) {
            executablePath = path;
            console.log('[v0] Found Chrome at:', executablePath);
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      launchConfig = {
        headless: 'new',
        args: launchArgs,
        ...(executablePath && { executablePath }),
      };
    }

    console.log('[v0] Launching browser...');
    browser = await puppeteer.launch(launchConfig);

    console.log('[v0] Browser launched, creating page...');
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set realistic headers
    const userAgent = getRandomUserAgent();
    console.log('[v0] Using User-Agent:', userAgent);

    await page.setUserAgent(userAgent);

    // Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
    });

    // Disable headless detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      window.chrome = {
        runtime: {},
      };
    });

    console.log('[v0] Navigating to:', APARTMENTS_COM_URL);
    await page.goto(APARTMENTS_COM_URL, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });

    console.log('[v0] Page loaded, extracting units...');

    const pageSignals = await page.evaluate(() => ({
      title: document.title,
      body: (document.body?.innerText || '').slice(0, 12000),
    }));
    if (/access denied|verify you are human|captcha|unusual traffic|robot check|challenge/i.test(`${pageSignals.title}\n${pageSignals.body}`)) {
      throw new Error('Apartments.com challenge or access-denied page detected');
    }

    // Wait for unit listings to load
    await page.waitForSelector('[data-testid="apartmentCard"], [class*="ApartmentCard"], [class*="unit"], .js-apartment-result', {
      timeout: 15000,
    }).catch(() => {
      console.log('[v0] Warning: unit selector not found, proceeding anyway...');
    });

    // Extract units using page.evaluate
    const units = await page.evaluate(() => {
      const results = [];
      const seenUnits = new Set();

      // Find all unit cards - try multiple selectors
      let unitElements = document.querySelectorAll('[data-testid="apartmentCard"]');
      if (unitElements.length === 0) {
        unitElements = document.querySelectorAll('[class*="ApartmentCard"]');
      }
      if (unitElements.length === 0) {
        unitElements = document.querySelectorAll('[class*="unit-card"]');
      }
      if (unitElements.length === 0) {
        unitElements = document.querySelectorAll('.js-apartment-result');
      }
      if (unitElements.length === 0) {
        unitElements = document.querySelectorAll('[role="article"]');
      }

      console.log('Found', unitElements.length, 'unit cards');

      unitElements.forEach((card) => {
        try {
          const text = card.innerText || card.textContent || '';

          // Extract price
          const priceMatch = text.match(/\$\s*([\d,]+)/);
          if (!priceMatch) return;

          const price = parseInt(priceMatch[1].replace(/,/g, ''));
          if (price < 500 || price > 50000) return;

          // Extract bedrooms
          const isStudio = /studio/i.test(text);
          let beds = 0;
          if (!isStudio) {
            const bedsMatch = text.match(/(\d+)\s*(?:bed|br|bd|bedroom)/i);
            beds = bedsMatch ? parseInt(bedsMatch[1]) : null;
          }

          // Extract bathrooms
          const bathsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom|bth)/i);
          const baths = bathsMatch ? parseFloat(bathsMatch[1]) : null;

          // Extract sqft
          const sqftMatch = text.match(/(\d+(?:,\d+)?)\s*(?:sqft|sq\.?\s*ft|sq ft|square feet|sf)/i);
          const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;

          // Extract availability date
          let availabilityDate = null;
          const availPatterns = [
            /available\s+(?:now|immediately|asap)/i,
            /available\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
            /available\s+([a-z]+\s+\d{1,2},?\s+\d{4})/i,
            /move\s+in\s+(?:now|immediately)/i,
            /ready\s+now/i,
          ];

          for (const pattern of availPatterns) {
            const match = text.match(pattern);
            if (match) {
              availabilityDate = match[1] || match[0];
              break;
            }
          }

          // Determine unit type
          let unitType = 'Unknown';
          if (isStudio) unitType = 'Studio';
          else if (beds === 1) unitType = '1B';
          else if (beds === 2) unitType = '2B';
          else if (beds === 3) unitType = '3B';
          else if (beds === 4) unitType = '4B';
          else if (beds === 5) unitType = '5B';

          // Avoid duplicates
          const uniqueKey = `${price}-${beds}-${baths}-${sqft}`;
          if (seenUnits.has(uniqueKey)) return;
          seenUnits.add(uniqueKey);

          results.push({
            price,
            unitType,
            beds,
            baths,
            sqft,
            availableDate,
          });
        } catch (err) {
          console.log('Error parsing unit:', err.message);
        }
      });

      return results;
    });

    console.log('[v0] Extracted', units.length, 'units from page');

    if (units.length === 0) {
      throw new Error('No units found on Apartments.com page');
    }

    // Parse availability dates
    const parsedUnits = units.map((unit) => ({
      ...unit,
      availableDate: parseAvailabilityDate(unit.availableDate),
    }));

    console.log('[v0] Parsed dates for', parsedUnits.length, 'units');
    return parsedUnits;
  } catch (err) {
    console.error('[v0] Puppeteer scraper error:', err.message);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
      console.log('[v0] Browser closed');
    }
  }
}
