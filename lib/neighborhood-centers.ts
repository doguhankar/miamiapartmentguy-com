// Neighborhood centroids - calculated from building coordinates
// Used for Mapbox flyTo calls in neighborhood/filter interactions

export const neighborhoodCenters = {
  "Allapattah": { lat: 25.7849, lng: -80.2208, zoom: 13, buildingCount: 3 },
  "Aventura": { lat: 25.9592, lng: -80.1334, zoom: 13, buildingCount: 4 },
  "Brickell": { lat: 25.7614, lng: -80.1925, zoom: 13, buildingCount: 6 },
  "Coconut Grove": { lat: 25.7332, lng: -80.2487, zoom: 13, buildingCount: 12 },
  "Dania Beach": { lat: 26.0507, lng: -80.1434, zoom: 13, buildingCount: 4 },
  "Doral": { lat: 25.8148, lng: -80.3403, zoom: 13, buildingCount: 12 },
  "Downtown": { lat: 25.7741, lng: -80.1909, zoom: 13, buildingCount: 7 },
  "Edgewater": { lat: 25.7904, lng: -80.1878, zoom: 13, buildingCount: 5 },
  "Hollywood": { lat: 26.0179, lng: -80.1536, zoom: 13, buildingCount: 8 },
  "Las Olas": { lat: 26.1169, lng: -80.1445, zoom: 13, buildingCount: 14 },
  "Little Havana": { lat: 25.7748, lng: -80.2112, zoom: 13, buildingCount: 7 },
  "Miami Design District": { lat: 25.813, lng: -80.192, zoom: 15, buildingCount: 1 },
  "Midtown": { lat: 25.7955, lng: -80.1907, zoom: 13, buildingCount: 6 },
  "North Miami": { lat: 25.8339, lng: -80.1774, zoom: 12, buildingCount: 4 },
  "North Miami Beach": { lat: 25.929, lng: -80.1202, zoom: 13, buildingCount: 3 },
  "Wynwood": { lat: 25.7989, lng: -80.1989, zoom: 13, buildingCount: 12 }
} as const;

export type Neighborhood = keyof typeof neighborhoodCenters;
