export function buildingAlt(name: string, neighborhood?: string | null): string {
  return neighborhood ? `${name} — ${neighborhood} apartment photo` : `${name} — apartment photo`
}
