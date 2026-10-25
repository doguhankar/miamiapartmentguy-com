import { buildings, type Building } from '@/lib/buildings'

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function relatedBuildings(building: Building, pool: Building[] = buildings, limit = 6): Building[] {
  return pool
    .filter((other) => other.id !== building.id && other.neighborhood === building.neighborhood)
    .sort((a, b) => distanceKm(building, a) - distanceKm(building, b))
    .slice(0, limit)
}

export interface NeighborhoodGroup {
  name: string
  slug: string
  buildings: Building[]
}

export function groupByNeighborhood(list: Building[]): NeighborhoodGroup[] {
  const map = new Map<string, Building[]>()
  for (const building of list) {
    map.set(building.neighborhood, [...(map.get(building.neighborhood) ?? []), building])
  }
  return [...map.entries()]
    .map(([name, group]) => ({ name, slug: slugify(name), buildings: group }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
