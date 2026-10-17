// Per-building mapping used by the Apartments.com scraper and the units write path.
//   appId          -> units.building_id (our app's building ID)
//   apartmentsKey  -> units.buildingid  (the Apartments.com listing key from the URL)
// The two are different values and are never derived from each other.
// legacyPricingUnits keeps the existing pricing_units write for buildings that already use it.
export const BUILDING_MAP = {
  'flow-brickell': {
    appId: 'flow-brickell',
    apartmentsKey: 'x13ew7n',
    name: 'Flow Brickell',
    url: 'https://www.apartments.com/flow-brickell-miami-fl/x13ew7n/',
    legacyPricingUnits: true,
  },
  '29': {
    appId: '29',
    apartmentsKey: 'ng6he6p',
    name: 'Wynd 27 & Wynd 28',
    url: 'https://www.apartments.com/wynd-27-wynd-28-miami-fl/ng6he6p/',
    legacyPricingUnits: false,
  },
};

export function getBuildingMapping(appId) {
  return BUILDING_MAP[String(appId)] || null;
}

export function getScrapableBuildings() {
  return Object.values(BUILDING_MAP).filter(building => Boolean(building.url));
}
