import useSWR from 'swr'

export type BuildingFee = { type: string; amount: number }

type FeesResponse = {
  fees: Record<string, { moveInFees: BuildingFee[]; monthlyCharges: BuildingFee[] }>
}

const EMPTY: BuildingFee[] = []

const fetchFees = (url: string): Promise<FeesResponse> =>
  fetch(url).then((res) => (res.ok ? res.json() : { fees: {} }))

export function useBuildingFees(buildingId: string) {
  const { data } = useSWR<FeesResponse>('/api/building-fees', fetchFees)
  const entry = data?.fees?.[buildingId]

  return {
    loaded: data !== undefined,
    moveInFees: entry?.moveInFees ?? EMPTY,
    monthlyCharges: entry?.monthlyCharges ?? EMPTY,
  }
}
