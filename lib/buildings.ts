export interface Building {
  id: string
  name: string
  neighborhood: string
  lat: number
  lng: number
  address: string
  priceMin: number
  priceMax: number
  priceTier: string
  units: string[]
  incomeReq: string
  creditReq: string
  guarantor: boolean
  holdDays: number[]
  image: string
  amenities: string[]
}

export const buildings: Building[] = [
  {
    id: "flow-brickell",
    name: "Flow Brickell",
    neighborhood: "Brickell",
    lat: 25.758,
    lng: -80.1933,
    address: "275 SW 6th St, Miami, FL 33130",
    priceMin: 2790,
    priceMax: 18086,
    priceTier: "$$",
    units: ["Studio", "1B", "2B", "3B"],
    incomeReq: "2.5x",
    creditReq: ">650",
    guarantor: true,
    holdDays: [30, 60, 90],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    amenities: ["Pool", "Gym", "Concierge", "Parking"],
  },
  {
    id: "modera-riverside",
    name: "Modera Riverside",
    neighborhood: "Brickell",
    lat: 25.7576,
    lng: -80.1949,
    address: "300 SW 2nd Ave, Miami, FL 33130",
    priceMin: 2500,
    priceMax: 15000,
    priceTier: "$$",
    units: ["Studio", "1B", "2B"],
    incomeReq: "2.5x",
    creditReq: ">650",
    guarantor: true,
    holdDays: [30, 60],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    amenities: ["Pool", "Gym", "Parking"],
  },
  {
    id: "maizon",
    name: "Maizon",
    neighborhood: "Brickell",
    lat: 25.7554,
    lng: -80.1944,
    address: "221 SW 12th St, Miami, FL 33130",
    priceMin: 2235,
    priceMax: 5000,
    priceTier: "$",
    units: ["Studio", "1B", "2B"],
    incomeReq: "2.5x",
    creditReq: ">650",
    guarantor: true,
    holdDays: [14, 30, 60],
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    amenities: ["Pool", "Gym", "Lounge"],
  },
  {
    id: "solitair",
    name: "Solitair",
    neighborhood: "Brickell",
    lat: 25.7585,
    lng: -80.1936,
    address: "86 SW 8th St, Miami, FL 33130",
    priceMin: 2654,
    priceMax: 12000,
    priceTier: "$$",
    units: ["Studio", "1B", "2B", "3B"],
    incomeReq: "3x",
    creditReq: ">650",
    guarantor: false,
    holdDays: [30, 60, 90],
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    amenities: ["Pool", "Gym", "Bar Lounge"],
  },
  {
    id: "miro-brickell",
    name: "Miro Brickell",
    neighborhood: "Brickell",
    lat: 25.756,
    lng: -80.192,
    address: "255 SW 11th St, Miami, FL 33130",
    priceMin: 2425,
    priceMax: 6500,
    priceTier: "$",
    units: ["Studio", "1B", "2B"],
    incomeReq: "2.5x",
    creditReq: ">650",
    guarantor: true,
    holdDays: [14, 30, 60],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    amenities: ["Pool", "Gym", "Dog Wash"],
  },
  {
    id: "brickell-first",
    name: "Brickell First",
    neighborhood: "Brickell",
    lat: 25.7555,
    lng: -80.1945,
    address: "110 SW 12th St, Miami, FL 33130",
    priceMin: 3045,
    priceMax: 7500,
    priceTier: "$$",
    units: ["1B", "2B", "3B"],
    incomeReq: "3x",
    creditReq: ">650",
    guarantor: false,
    holdDays: [30, 60],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    amenities: ["Pool", "Spa", "Gym", "Concierge"],
  },
  {
    id: "cmpnd",
    name: "CMPND",
    neighborhood: "Downtown",
    lat: 25.765,
    lng: -80.1866,
    address: "55 NE 2nd St, Miami, FL 33132",
    priceMin: 2478,
    priceMax: 5500,
    priceTier: "$",
    units: ["Studio", "1B", "2B"],
    incomeReq: "2.5x",
    creditReq: ">600",
    guarantor: true,
    holdDays: [14, 30, 60],
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    amenities: ["Pool", "Gym", "Pet-Friendly"],
  },
]

export const neighborhoodColors: Record<string, string> = {
  Brickell: "bg-blue-100 text-blue-700",
  Downtown: "bg-emerald-100 text-emerald-700",
}
