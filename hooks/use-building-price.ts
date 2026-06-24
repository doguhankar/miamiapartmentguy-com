import { useState, useEffect } from 'react'

interface PricingData {
  buildingId: string
  units: Array<{ price: number }>
  updatedAt: string
}

// Mapping from numeric IDs used in app/page.tsx to API endpoint names
const ID_TO_API_ENDPOINT: Record<string | number, string> = {
  '1': 'flow-brickell',
  1: 'flow-brickell',
}

export function useBuildingPrice(buildingIdOrName: string | number, fallbackPrice: number) {
  const [price, setPrice] = useState(fallbackPrice)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!buildingIdOrName && buildingIdOrName !== 0) {
      setLoading(false)
      return
    }

    const fetchPrice = async () => {
      try {
        setLoading(true)
        
        // Map numeric/string IDs to API endpoint names
        const apiEndpoint = ID_TO_API_ENDPOINT[buildingIdOrName] || String(buildingIdOrName)
        
        const res = await fetch(`/api/prices/${apiEndpoint}?t=${Date.now()}`)
        
        if (res.ok) {
          const data: PricingData = await res.json()
          if (data.units && data.units.length > 0) {
            const minPrice = Math.min(...data.units.map(u => u.price))
            console.log(`[v0] Fetched price for ${apiEndpoint}: $${minPrice} (fallback was $${fallbackPrice})`)
            setPrice(minPrice)
          } else {
            console.log(`[v0] No units returned for ${apiEndpoint}, using fallback $${fallbackPrice}`)
            setPrice(fallbackPrice)
          }
        } else {
          console.log(`[v0] API error for ${apiEndpoint} (status ${res.status}), using fallback $${fallbackPrice}`)
          setPrice(fallbackPrice)
        }
      } catch (err) {
        console.error(`[v0] Error fetching price for ${buildingIdOrName}:`, err)
        setPrice(fallbackPrice)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [buildingIdOrName, fallbackPrice])

  return { price, loading }
}
