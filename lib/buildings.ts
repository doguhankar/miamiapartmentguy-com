export interface Building {
  id: string
  name: string
  neighborhood: string
  lat: number
  lng: number
  address: string
  incomeRequirement: number
  creditRequirement: number
  moveInSpecial: string
  amenities: string[]
  units: {
    type: string
    priceRange: string
  }[]
  image: string
}

export const buildings: Building[] = [
  {
    id: "edison",
    name: "The Edison",
    neighborhood: "Wynwood",
    lat: 25.8019,
    lng: -80.1935,
    address: "2501 N Miami Ave, Miami, FL 33127",
    incomeRequirement: 2400,
    creditRequirement: 650,
    moveInSpecial: "First month free",
    amenities: ["Rooftop pool", "Fitness center", "Co-working space", "Pet-friendly"],
    units: [
      { type: "Studio", priceRange: "$1,200-$1,400" },
      { type: "1BR", priceRange: "$1,600-$1,900" },
      { type: "2BR", priceRange: "$2,000-$2,400" },
    ],
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
  },
  {
    id: "midtown-lofts",
    name: "Midtown Lofts",
    neighborhood: "Midtown",
    lat: 25.8097,
    lng: -80.1906,
    address: "3550 N Miami Ave, Miami, FL 33127",
    incomeRequirement: 2800,
    creditRequirement: 680,
    moveInSpecial: "Waived application fee",
    amenities: ["Modern gym", "Lounge", "Parking", "High ceilings"],
    units: [
      { type: "Studio", priceRange: "$1,400-$1,600" },
      { type: "1BR", priceRange: "$1,800-$2,100" },
      { type: "2BR", priceRange: "$2,400-$2,800" },
    ],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
  },
  {
    id: "brickell-rise",
    name: "Brickell Rise",
    neighborhood: "Brickell",
    lat: 25.7622,
    lng: -80.1898,
    address: "1040 Brickell Ave, Miami, FL 33131",
    incomeRequirement: 3500,
    creditRequirement: 700,
    moveInSpecial: "Reduced parking fees, 1st year",
    amenities: ["Concierge", "Pool deck", "Business center", "Doorman"],
    units: [
      { type: "1BR", priceRange: "$1,800-$2,200" },
      { type: "2BR", priceRange: "$2,500-$3,000" },
      { type: "3BR", priceRange: "$3,500+" },
    ],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
  },
  {
    id: "downtown-hub",
    name: "Downtown Hub",
    neighborhood: "Downtown",
    lat: 25.7659,
    lng: -80.1888,
    address: "200 S Biscayne Blvd, Miami, FL 33131",
    incomeRequirement: 2600,
    creditRequirement: 670,
    moveInSpecial: "1 month free on 12-month lease",
    amenities: ["Gym", "Rooftop terrace", "Conference room", "Bay views"],
    units: [
      { type: "Studio", priceRange: "$1,300-$1,500" },
      { type: "1BR", priceRange: "$1,700-$2,000" },
      { type: "2BR", priceRange: "$2,200-$2,600" },
    ],
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
  },
  {
    id: "edgewater-towers",
    name: "Edgewater Towers",
    neighborhood: "Edgewater",
    lat: 25.8211,
    lng: -80.1881,
    address: "1900 N Bayshore Dr, Miami, FL 33137",
    incomeRequirement: 3200,
    creditRequirement: 690,
    moveInSpecial: "Valet parking included, 6 months",
    amenities: ["Waterfront", "Infinity pool", "Spa", "Valet parking"],
    units: [
      { type: "1BR", priceRange: "$1,600-$2,000" },
      { type: "2BR", priceRange: "$2,200-$2,700" },
      { type: "3BR", priceRange: "$3,200+" },
    ],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
  },
]

export const neighborhoodColors: Record<string, string> = {
  Wynwood: "bg-rose-100 text-rose-700",
  Midtown: "bg-amber-100 text-amber-700",
  Brickell: "bg-sky-100 text-sky-700",
  Downtown: "bg-emerald-100 text-emerald-700",
  Edgewater: "bg-violet-100 text-violet-700",
}
