import * as cheerio from 'cheerio';

const FLOW_BUILDINGS = {
  'flow-brickell': 'https://flow.life/en/properties/miami-brickell/available-homes',
};

export async function scrapeFlowBuilding(buildingId) {
  const baseUrl = FLOW_BUILDINGS[buildingId];
  
  const res = await fetch(baseUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const floorPlanLinks = [];
  $('a[href*="/available-homes/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/fid/')) {
      floorPlanLinks.push(`https://flow.life${href}`);
    }
  });

  const units = [];
  for (const url of floorPlanLinks) {
    const unitData = await scrapeFlowUnit(url);
    units.push(...unitData);
  }

  return units;
}

async function scrapeFlowUnit(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const floorPlanType = $('h1').first().text().trim();

  const priceMatch = html.match(/\$([0-9,]+)\s*\/\s*month/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

  const beds = $('img[alt*="Beds"]').parent().text().trim();
  const baths = $('img[alt*="Baths"]').parent().text().trim();
  const sqft = $('img[alt*="Measurement"]').parent().text().trim();

  const images = [];
  $('img[src*="imgix"], img[src*="rentcafe"]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) images.push(src);
  });

  const unitRows = [];
  const netEffectiveMatch = html.match(/Net Effective Rent:\s*\$([0-9,]+)/);
  const netEffective = netEffectiveMatch ? parseInt(netEffectiveMatch[1].replace(/,/g, '')) : null;

  const availableMatches = [...html.matchAll(/Unit.*?(\d{3,4}).*?\$([0-9,]+).*?(Available Now|[A-Z][a-z]+ \d{2}, \d{4})/gs)];
  
  for (const match of availableMatches) {
    unitRows.push({
      unitNumber: match[1],
      price,
      netEffective,
      availableDate: match[3],
      floorPlanType,
      beds,
      baths,
      sqft,
      images: images.slice(0, 5),
      sourceUrl: url,
    });
  }

  if (unitRows.length === 0 && price) {
    unitRows.push({
      unitNumber: null,
      price,
      netEffective,
      availableDate: 'See website',
      floorPlanType,
      beds,
      baths,
      sqft,
      images: images.slice(0, 5),
      sourceUrl: url,
    });
  }

  return unitRows;
}
