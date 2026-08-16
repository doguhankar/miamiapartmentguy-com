export function useBuildingPrice(buildingId: string, fallbackPrice: number) {
  return { price: fallbackPrice, loading: false }
}
