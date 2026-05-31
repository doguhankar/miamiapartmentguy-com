'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { ImageCarousel } from '@/components/image-carousel';

const BUILDINGS = [
  { id: 1, name: 'Flow Brickell', neighborhood: 'Brickell', address: '275 SW 6th St, Miami, FL 33130', lat: 25.7684, lng: -80.1990, priceMin: 2790, priceTier: '$$', tagline: 'Vibrant community, social hub, always buzzing', concession: '1 month free on select units', units: ['Studio', '1B', '2B', '3B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [30, 60, 90], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f8-PjSUbS6yTrIBusqZ0XXyuU8h1qerGT.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f7-e8tHKaMeidxoV13PJgZNveLuE6ScPy.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f1-sC9oG9eD9DGGUwRRPP93yLIPgssB8r.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f3-Bw25PrMJlv7UYJ3bt5D5fmbz94yAMb.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f4-9VsnFpU86vEqyTuNQKYutuLUnX5dEi.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f5-XWNn2OspXHwINOXtaNPYMrIUhleUvP.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f6-OjhZIKj1vv611WQHgFm26OfY157Ijw.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f2-ICadR5CSOFH7p9F3OQtpdBs2CH5RlD.webp'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,790', application: '$75', admin: '$150', parking: '$150/car', misc: 'Pet fee: $35/mo' } },
  { id: 2, name: 'Modera Riverside', neighborhood: 'Brickell', address: '300 SW 2nd Ave, Miami, FL 33130', lat: 25.7561, lng: -80.1954, priceMin: 2500, priceTier: '$$', tagline: 'Affordable high rise, quiet, Brickell vibes without the price tag', concession: '50% off first 60 days', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [30, 60], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m10-eFibmVGaoLcW7F9yCC8Q0iDbnok5RQ.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m2-zljnlgeiWfRh7efeAOWUdv7n9CBRg8.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m1-N8n1gv8rO34iHYqY2A9ThD4bCBBCzS.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m3-P1DrJebzT4LXbuhgUfyEK4QfQbQaCP.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m4-5yw1QrHhTa6B3CsxKYhub7Jcd4t4bf.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m5-xn4hF7DSM3eovfOZ6Ye7TTXYVGzAoH.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m6-ha2rtnFYwLSD7UvP42a2mzkpntezAl.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m7-rrZzGBE3l6dBWHjRyvcwyOQILIa1Ia.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m8-4HBSHHVaB1e40ghxXO2pKUCZdfKyC9.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m9-TlKdeoYwon7uWYwzuhrVghOXxeGl6i.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m11-vjN4FXlPNBGbWxQE9r7L0htW8DKWG5.webp'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: '$2,500', application: '$50', admin: '$100', parking: '$125/car', misc: 'Renters insurance required' } },
  { id: 3, name: 'Maizon', neighborhood: 'Brickell', address: '221 SW 12th St, Miami, FL 33130', lat: 25.7528, lng: -80.1958, priceMin: 2235, priceTier: '$', tagline: 'Modern living, walkable Brickell, accessible pricing', concession: '$500 move-in credit', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m7-jNaoQBZPgAJqewPoOFl1BQiCZi739k.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m1-OwMP8bOjwr28fKxPS2EvFerp4FObKU.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m2-VUZhXREXzNUnHLCBAYPlqf9rO8SbVb.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m3-VziIF3AXZaRjdkc5pVJu6Z4XxOBIOR.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m4-L5dcGBNxHNCp94mLqHuCWQcjSPLVQU.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m5-hSp80fmga9b4S2TD6Oq2dIjx13iwKa.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m6-zULNSdqRYyjTot5WJrOKRD1VMfqdKb.webp'], amenities: ['Pool', 'Gym', 'Lounge'], fees: { deposit: '$2,235', application: '$60', admin: '$120', parking: '$140/car', misc: 'None' } },
  { id: 4, name: 'Solitair', neighborhood: 'Brickell', address: '86 SW 8th St, Miami, FL 33130', lat: 25.7662, lng: -80.1946, priceMin: 2654, priceTier: '$$', tagline: 'Heart of Brickell, skyline views, luxury finishes', concession: 'Free first month + parking', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [30, 60, 90], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s1-Cq8HWNBmCuDUjzUnemNQ0LSL3oAyf9.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s2-4FM6V9NJD00X1xWKnCvf5ICeRKZu6N.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s3-8YSpCa6oqLwQQpE4d66WSS49eLmYD2.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s4-8RiBxRFqfXyIBwKqkTMPV9KDpiLHr4.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s5-TPlih6Zwm5nAHcfTwn3I6xVrWXBf2F.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s6-xKXhykKd0cAB30Xh8EolJ7rx8FxQNd.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s7-27mIhAPC9FgphoPVeL1Qzl4q4Y7fTY.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s8-iGBISVwmfzNzCcAcxupX6P4GkzE26C.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s9-eIA6KFaI9JDatCpAQMa2TgFDV83XRE.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s10-ko4gZiBjUNLyg6V1dUlv9bxZ2hxJDn.webp'], amenities: ['Pool', 'Gym', 'Bar Lounge', 'Billiards'], fees: { deposit: '$2,654', application: '$75', admin: '$150', parking: 'Free', misc: 'Concierge fee: $25/mo' } },
  { id: 5, name: 'Miro Brickell', neighborhood: 'Brickell', address: '255 SW 11th St, Miami, FL 33130', lat: 25.7626, lng: -80.1943, priceMin: 2425, priceTier: '$', tagline: 'Sleek modern, Brickell central, rooftop living', concession: '1 month free on leases 12+ months', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m1-EVGO5Tnuoa56uiQIXOy3hT9IcOEYUu.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m2-wuD1Aeh4mN9nF9xbbDQ9k11TChxsYv.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m3-sr2A1V5niMZrWtGbAGTPd4aEoAZ04b.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m4-yPkGymDnP7mXYalAEVLFJl96rkE5Dd.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m5-HQ3lSjEHqYmY2W1uW1lzXlDIMkmuR4.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m6-fXxRDyBBn2yz8AZfXae7zyNuucFTcQ.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m7-1Cq4dznXhyuUt4lrRIolmg1tLneTZ5.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m8-fOgzc4WvWx8sykWi2lDdU5S47FYXOS.webp'], amenities: ['Pool', 'Gym', 'Dog Wash', 'Yoga Studio'], fees: { deposit: '$2,425', application: '$65', admin: '$130', parking: '$135/car', misc: 'Pet fee: $50/mo' } },
  { id: 6, name: 'Brickell First', neighborhood: 'Brickell', address: '110 SW 12th St, Miami, FL 33130', lat: 25.7622, lng: -80.1958, priceMin: 3045, priceTier: '$$', tagline: 'Affordable quality, prime location, reliable community', concession: '2 months free on 12-month lease', units: ['1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [30, 60], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b1-O2FpSvYfF1LHICzaZvBrxtxAVbC0KC.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b2-Sm2CtHzLgcPrW6MLXcv1fLHW6XmFVy.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b3-FS8ZnMT2YPNi5qZSOx7QHMmLHMtS14.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b4-7wDXGyndKR7qe0aqfh75kJ95l3oyW5.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b5-sQnJdKQA02URpuWgrGmGoqVwHJ7Z1A.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b6-bi6UZdvOoBebqO5jvsLT1iD8BTFsGE.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b7-ZIUarO5HNZYHISSVJoiPFa1476TW8h.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b8-teMZtibo9B29cVGnS1G3p2pcxs8IFj.webp'], amenities: ['Pool', 'Spa', 'Gym', 'Concierge', 'Valet'], fees: { deposit: '$3,045', application: '$100', admin: '$200', parking: '$175/car', misc: 'Valet required: $60/mo' } },
  { id: 7, name: 'CMPND', neighborhood: 'Downtown', address: '55 NE 2nd St, Miami, FL 33132', lat: 25.7751, lng: -80.1924, priceMin: 1950, priceTier: '$', tagline: "Miami's newest highrise, all-glass corner units, two-story amenities", concession: 'Two months free on select units', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60, 90], images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Pet-Friendly', 'Coworking'], fees: { deposit: '$1,950', application: '$50', admin: '$100', parking: '$120/car', misc: 'None' } },
  { id: 8, name: 'Miami World Tower', neighborhood: 'Downtown', address: '710 NE 1st Ave, Miami, FL 33132', lat: 25.7765, lng: -80.1933, priceMin: 2410, priceTier: '$$', tagline: 'All-glass downtown, vibrant location, panoramic views', concession: 'Up to two months free on select apartments', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,410', application: '$75', admin: '$150', parking: '$160/car', misc: 'Concierge fee: $30/mo' } },
  { id: 9, name: 'Muze at Met', neighborhood: 'Downtown', address: '340 SE 3rd St, Miami, FL 33131', lat: 25.7679, lng: -80.1892, priceMin: 2627, priceTier: '$$', tagline: 'Quiet luxury, city views, spacious layouts', concession: '1.5 months free on 1Bs, 1 month on 2/3 beds', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,627', application: '$80', admin: '$160', parking: '$165/car', misc: 'Pet fee: $40/mo' } },
  { id: 10, name: 'Flow Miami World', neighborhood: 'Downtown', address: '698 NE 1st Ave, Miami, FL 33132', lat: 25.7763, lng: -80.1931, priceMin: 2223, priceTier: '$$', tagline: 'Vibrant community, social hub, always buzzing', concession: '3 months free on all apartments', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,223', application: '$70', admin: '$140', parking: '$145/car', misc: 'None' } },
  { id: 11, name: 'Monarc at Met', neighborhood: 'Downtown', address: '201 SE 2nd Ave, Miami, FL 33131', lat: 25.7667, lng: -80.1883, priceMin: 2692, priceTier: '$$', tagline: 'Quiet luxury on a budget, city views, accessible', concession: 'No current concessions', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,692', application: '$85', admin: '$170', parking: '$170/car', misc: 'Concierge fee: $35/mo' } },
  { id: 12, name: 'Parkline', neighborhood: 'Downtown', address: '100 NW 6th St, Miami, FL 33136', lat: 25.7781, lng: -80.1997, priceMin: 2120, priceTier: '$', tagline: 'Direct Brightline access, bright units, skyline views', concession: 'Up to 3 months free', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,120', application: '$60', admin: '$120', parking: '$130/car', misc: 'None' } },
  // Edgewater
  { id: 13, name: '2000 Biscayne', neighborhood: 'Edgewater', address: '2000 Biscayne Blvd, Miami, FL 33137', lat: 25.7890, lng: -80.1870, priceMin: 2800, priceTier: '$$', tagline: 'Waterfront views, modern luxury, Biscayne Bay access', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 14, name: 'Modera Edgewater', neighborhood: 'Edgewater', address: '2801 NE 1st Ave, Miami, FL 33137', lat: 25.7920, lng: -80.1890, priceMin: 2300, priceTier: '$', tagline: 'Modern affordability, bay views, quiet residential', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 15, name: 'Blu 27 Edgewater', neighborhood: 'Edgewater', address: '2700 NE 2nd Ave, Miami, FL 33137', lat: 25.7910, lng: -80.1880, priceMin: 2500, priceTier: '$$', tagline: 'Contemporary design, blue-tinted glass, premium amenities', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 16, name: 'Metro Edgewater', neighborhood: 'Edgewater', address: '2600 NE 2nd Ave, Miami, FL 33137', lat: 25.7905, lng: -80.1885, priceMin: 2200, priceTier: '$', tagline: 'Urban living, transit-friendly, walkable neighborhood', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 17, name: 'The Hamilton', neighborhood: 'Edgewater', address: '2400 Biscayne Blvd, Miami, FL 33137', lat: 25.7895, lng: -80.1865, priceMin: 2900, priceTier: '$$', tagline: 'Waterfront elegance, luxury finishes, bay proximity', concession: 'TBD', units: ['1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  // Midtown
  { id: 18, name: 'AMLI Midtown 29', neighborhood: 'Midtown', address: '2901 NE 1st Ave, Miami, FL 33137', lat: 25.7940, lng: -80.1910, priceMin: 2400, priceTier: '$$', tagline: 'Modern midtown, transit hub, urban living', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 19, name: 'AMLI Midtown Miami', neighborhood: 'Midtown', address: '3101 NE 1st Ave, Miami, FL 33137', lat: 25.7955, lng: -80.1910, priceMin: 2500, priceTier: '$$', tagline: 'Sleek apartments, walkable midtown, city vibes', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 20, name: 'Eve at The District', neighborhood: 'Midtown', address: '3000 NE 2nd Ave, Miami, FL 33137', lat: 25.7950, lng: -80.1900, priceMin: 2350, priceTier: '$$', tagline: 'Tech-forward living, midtown energy, community spaces', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Coworking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 21, name: 'Midtown Five', neighborhood: 'Midtown', address: '3201 NE 1st Ave, Miami, FL 33137', lat: 25.7960, lng: -80.1905, priceMin: 2600, priceTier: '$$', tagline: 'Five-star amenities, premium midtown, cosmopolitan lifestyle', concession: 'TBD', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop', 'Concierge'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 22, name: 'Gio Midtown', neighborhood: 'Midtown', address: '3131 NE 1st Ave, Miami, FL 33137', lat: 25.7958, lng: -80.1908, priceMin: 2450, priceTier: '$$', tagline: 'Contemporary design, midtown central, rooftop culture', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 23, name: 'Cortland Midtown Miami', neighborhood: 'Midtown', address: '3250 NE 1st Ave, Miami, FL 33137', lat: 25.7965, lng: -80.1912, priceMin: 2300, priceTier: '$', tagline: 'Quality living, midtown location, reliable community', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  // Wynwood
  { id: 24, name: 'Joule House', neighborhood: 'Wynwood', address: '2520 NW 2nd Ave, Miami, FL 33127', lat: 25.7980, lng: -80.1990, priceMin: 2200, priceTier: '$', tagline: 'Artsy Wynwood, design-forward, creative hub', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 25, name: 'Amara Wynwood', neighborhood: 'Wynwood', address: '2601 NW 2nd Ave, Miami, FL 33127', lat: 25.7985, lng: -80.1995, priceMin: 2350, priceTier: '$$', tagline: 'Modern Wynwood, art district living, cultural vibes', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 26, name: 'Wynwood Plaza Residences', neighborhood: 'Wynwood', address: '95 NW 29th St, Miami, FL 33127', lat: 25.8000, lng: -80.1985, priceMin: 2500, priceTier: '$$', tagline: 'Wynwood center, walkable galleries, artistic community', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 27, name: 'Flow Wynwood', neighborhood: 'Wynwood', address: '2751 NW 1st Ave, Miami, FL 33127', lat: 25.7995, lng: -80.1975, priceMin: 2400, priceTier: '$$', tagline: 'Vibrant Wynwood, social energy, art scene access', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 28, name: 'The Highley House', neighborhood: 'Wynwood', address: '2700 NW 2nd Ave, Miami, FL 33127', lat: 25.7990, lng: -80.1998, priceMin: 2550, priceTier: '$$', tagline: 'Trendy Wynwood, premium finishes, gallery district', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 29, name: 'Wynd 27 & Wynd 28', neighborhood: 'Wynwood', address: '2775 NW 2nd Ave, Miami, FL 33127', lat: 25.7992, lng: -80.2000, priceMin: 2600, priceTier: '$$', tagline: 'Twin towers, Wynwood landmark, modern luxury', concession: 'TBD', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 30, name: '29 WYN', neighborhood: 'Wynwood', address: '2900 NW 2nd Ave, Miami, FL 33127', lat: 25.8005, lng: -80.2002, priceMin: 2300, priceTier: '$', tagline: 'Wynwood heart, street art views, creative neighborhood', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 31, name: 'AMLI Wynwood', neighborhood: 'Wynwood', address: '2601 NW 1st Ave, Miami, FL 33127', lat: 25.7988, lng: -80.1980, priceMin: 2450, priceTier: '$$', tagline: 'Modern Wynwood, walkable galleries, artsy living', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 32, name: 'The Dorsey', neighborhood: 'Wynwood', address: '2500 Biscayne Blvd, Miami, FL 33137', lat: 25.7975, lng: -80.1970, priceMin: 2100, priceTier: '$', tagline: 'Vintage Wynwood vibes, hip location, neighborhood character', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 33, name: 'Artem', neighborhood: 'Wynwood', address: '2710 NW 1st Ave, Miami, FL 33127', lat: 25.7998, lng: -80.1978, priceMin: 2350, priceTier: '$$', tagline: 'Minimalist design, Wynwood cool, contemporary living', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 34, name: 'Strata Wynwood', neighborhood: 'Wynwood', address: '2650 NW 2nd Ave, Miami, FL 33127', lat: 25.7987, lng: -80.1997, priceMin: 2400, priceTier: '$$', tagline: 'Layered living, Wynwood center, urban design', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 35, name: 'Wynwood 25', neighborhood: 'Wynwood', address: '2501 NW 2nd Ave, Miami, FL 33127', lat: 25.7978, lng: -80.1992, priceMin: 2150, priceTier: '$', tagline: 'Mid-rise Wynwood, walkable district, accessible pricing', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 37, name: 'Manor Biscayne', neighborhood: 'North Miami', address: '1600 Biscayne Blvd, Miami, FL 33132', lat: 25.7848, lng: -80.1877, priceMin: 2450, priceTier: '$$', tagline: 'Waterfront Biscayne Bay views, modern amenities', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 38, name: 'Aura North Miami Beach', neighborhood: 'North Miami Beach', address: '17100 Collins Ave, Sunny Isles Beach, FL 33160', lat: 25.9301, lng: -80.1198, priceMin: 2850, priceTier: '$$', tagline: 'Luxury beachfront living, world-class resort amenities', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 39, name: 'Biscayne Shores', neighborhood: 'North Miami', address: '2001 Biscayne Blvd, Miami, FL 33132', lat: 25.7893, lng: -80.1865, priceMin: 2200, priceTier: '$', tagline: 'Bay-adjacent living, contemporary design, walkable', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 40, name: 'The Gardens', neighborhood: 'North Miami', address: '12000 Biscayne Blvd, North Miami, FL 33161', lat: 25.8816, lng: -80.1670, priceMin: 1950, priceTier: '$', tagline: 'Tropical oasis, family-friendly, nature-inspired', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 41, name: 'Soleste Nomi Beach', neighborhood: 'North Miami Beach', address: '17001 Collins Ave, Sunny Isles Beach, FL 33160', lat: 25.9289, lng: -80.1202, priceMin: 3100, priceTier: '$$$', tagline: 'Beach luxury, contemporary design, premium finishes', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 42, name: 'Villa Laguna', neighborhood: 'North Miami', address: '10900 Biscayne Blvd, North Miami, FL 33161', lat: 25.8797, lng: -80.1685, priceMin: 2100, priceTier: '$$', tagline: 'Lagoon-view living, serene surroundings, modern comfort', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 43, name: 'Biscayne 112', neighborhood: 'Downtown', address: '1121 Biscayne Blvd, Miami, FL 33132', lat: 25.7778, lng: -80.1901, priceMin: 2350, priceTier: '$$', tagline: 'Urban downtown, cultural district, vibrant energy', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 44, name: 'The Shoreline at Sole Mia', neighborhood: 'North Miami Beach', address: '16800 Collins Ave, Sunny Isles Beach, FL 33160', lat: 25.9280, lng: -80.1206, priceMin: 2950, priceTier: '$$', tagline: 'Beachfront tranquility, resort-style living, ocean views', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 45, name: 'Blu Aventura', neighborhood: 'Aventura', address: '20955 Biscayne Blvd, Aventura, FL 33180', lat: 25.9601, lng: -80.1312, priceMin: 2650, priceTier: '$$', tagline: 'Modern waterfront living, luxury finishes, community-focused', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 46, name: 'Arvella', neighborhood: 'Aventura', address: '20555 Biscayne Blvd, Aventura, FL 33180', lat: 25.9571, lng: -80.1325, priceMin: 2400, priceTier: '$$', tagline: 'Contemporary design, accessible luxury, well-appointed', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 47, name: 'Modera Aventura', neighborhood: 'Aventura', address: '20900 NE 30th Ave, Aventura, FL 33180', lat: 25.9608, lng: -80.1342, priceMin: 2750, priceTier: '$$', tagline: 'Sophisticated living, premium amenities, urban convenience', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 48, name: 'Avida Aventura', neighborhood: 'Aventura', address: '20701 NE 28th Ave, Aventura, FL 33180', lat: 25.9588, lng: -80.1358, priceMin: 2550, priceTier: '$$', tagline: 'Vibrant community, thoughtful design, modern lifestyle', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  // Miami Design District
  { id: 36, name: 'The Boulevard', neighborhood: 'Miami Design District', address: '4000 NE 2nd Ave, Miami, FL 33137', lat: 25.8130, lng: -80.1920, priceMin: 3200, priceTier: '$$$', tagline: 'Design district flagship, luxury retail walkable, upscale living', concession: 'TBD', units: ['1B', '2B', '3B'], incomeReq: '3x', creditReq: '>700', guarantor: false, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Valet', 'Rooftop'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
];

const NEIGHBORHOODS = ['Brickell', 'Downtown', 'Edgewater', 'Midtown', 'Wynwood', 'Miami Design District', 'North Miami', 'North Miami Beach', 'Aventura'];

const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button className="w-5 h-5 rounded-full border border-gray-400 text-gray-600 text-xs flex items-center justify-center hover:border-gray-600" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>i</button>
      {show && <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50">A co-signer on your lease who guarantees payment if you can't pay rent.</div>}
    </div>
  );
};

const FeesDropdown = ({ fees }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition font-semibold text-gray-900">
        <span>Fees & Policies</span>
        <span className={`transition transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
      </button>
      {isOpen && (
        <div className="p-4 space-y-3 border-t">
          <div className="flex justify-between"><span className="text-gray-600">Deposit</span><span className="font-semibold">{fees.deposit}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Application Fee</span><span className="font-semibold">{fees.application}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Admin Fee</span><span className="font-semibold">{fees.admin}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Parking (per car)</span><span className="font-semibold">{fees.parking}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Misc Monthly Fees</span><span className="font-semibold">{fees.misc}</span></div>
        </div>
      )}
    </div>
  );
};

const TalkTodonModal = ({ building, onClose }) => {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({ income: '', credit: '', moveInDate: '', firstName: '', phone: '' });
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const income = parseInt(formData.income);
    const credit = parseInt(formData.credit);
    const incomeMultiplier = parseInt(building.incomeReq);
    const creditReq = parseInt(building.creditReq);
    let status = 'qualify';
    if (income < incomeMultiplier * 1500) status = 'not-fit';
    else if (income < incomeMultiplier * 2000) status = 'close';
    if (credit < creditReq) status = 'not-fit';
    setResult(status);
    setStep('results');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log('Lead:', { ...formData, building: building.name, status: result });
    setStep('contact');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {step === 'form' && (
          <>
            <h2 className="text-2xl font-bold mb-6">{building.name}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Income</label>
                <input type="number" required value={formData.income} onChange={(e) => setFormData({ ...formData, income: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g., 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credit Score</label>
                <input type="number" required value={formData.credit} onChange={(e) => setFormData({ ...formData, credit: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g., 680" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Move-In Date</label>
                <input type="date" required value={formData.moveInDate} onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Get My Results</button>
            </form>
            <button onClick={onClose} className="mt-4 w-full text-gray-600 py-2 hover:text-gray-900">Close</button>
          </>
        )}
        {step === 'results' && (
          <>
            <div className="text-center mb-6">
              {result === 'qualify' && <><div className="text-5xl mb-3">✓</div><h2 className="text-3xl font-bold text-green-600">You Qualify!</h2></>}
              {result === 'close' && <><div className="text-5xl mb-3">⚠</div><h2 className="text-3xl font-bold text-yellow-600">You're Close</h2></>}
              {result === 'not-fit' && <><div className="text-5xl mb-3">✗</div><h2 className="text-3xl font-bold text-red-600">Not a Fit</h2></>}
            </div>
            <button onClick={() => setStep('contact')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-3">Continue</button>
            <button onClick={onClose} className="w-full text-gray-600 py-2 hover:text-gray-900">Back</button>
          </>
        )}
        {step === 'contact' && !result && (
          <>
            <h2 className="text-2xl font-bold mb-2">One more thing...</h2>
            <p className="text-gray-600 mb-6">Don will reach out directly with personalized options.</p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="First Name" />
              <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Phone" />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Submit</button>
            </form>
          </>
        )}
        {step === 'contact' && result && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✓</div>
            <h3 className="text-xl font-bold mb-2">Thanks!</h3>
            <p className="text-gray-600 mb-6">Don will reach out soon.</p>
            <button onClick={onClose} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">Back to Buildings</button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapComponent = ({ expandedNeighborhoods, selectedBuilding, onPinClick }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      const linkEl = document.createElement('link');
      linkEl.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);

      if (window.mapboxgl && mapContainer.current && !map.current) {
        window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-80.188, 25.765],
          zoom: 13,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !window.mapboxgl) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    BUILDINGS.forEach((building) => {
      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.backgroundColor = selectedBuilding?.id === building.id ? '#FF8C00' : '#3B82F6';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.transition = 'all 0.2s';
      el.onclick = () => {
        setSelectedBuilding(building);
        setIsBottomSheetExpanded(true);
      };

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
  }, [selectedBuilding]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default function MiamiApp() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState(['Brickell', 'Downtown']);
  const [bottomSheetSnapPoint, setBottomSheetSnapPoint] = useState(1);
  const bottomSheetRef = useRef(null);
  const touchStartY = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [infoBuilding, setInfoBuilding] = useState(null);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const SNAP_POINTS = {
    0: 'h-5 md:h-0',      // COLLAPSED: 20px (drag handle)
    1: 'h-56 md:h-auto',  // DEFAULT: 220px (one building card)
    2: 'h-[75vh] md:auto' // EXPANDED: 75% screen (scrollable)
  };

  const toggleNeighborhood = (neighborhood) => {
    setExpandedNeighborhoods(prev =>
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  };

  const filteredBuildings = BUILDINGS.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFilteredNeighborhoodBuildings = (neighborhood) => {
    return filteredBuildings.filter(b => b.neighborhood === neighborhood);
  };

  const openWhatsApp = (building) => {
    const message = encodeURIComponent(`Hi! I'm interested in ${building.name} at ${building.address}. Can you tell me more?`);
    window.open(`https://wa.me/1234567890?text=${message}`, '_blank');
  };

  const openSMS = () => {
    const message = encodeURIComponent('Hey, this is Don\'s direct cell! You can text me about any building you\'ve been eyeing. I can help out with virtual tours, pricing, and neighborhood info.');
    window.location.href = `sms:+14077657306?body=${message}`;
  };

  const handlePinSubmit = () => {
    if (pinInput === '1234') {
      setIsAgentMode(true);
      setShowPinModal(false);
      setPinInput('');
    } else {
      alert('Incorrect PIN');
      setPinInput('');
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      const linkEl = document.createElement('link');
      linkEl.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);

      if (window.mapboxgl && mapContainer.current && !map.current) {
        window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-80.188, 25.76],
          zoom: 11,
        });

        map.current.on('load', () => {
          addPins();
        });

        map.current.on('style.load', () => {
          addPins();
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleBottomSheetDrag = (e) => {
    if (e.type === 'touchstart') {
      touchStartY.current = e.touches[0].clientY;
    } else if (e.type === 'touchend' && touchStartY.current) {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchEndY - touchStartY.current;
      
      if (diff > 30) {
        // Swipe down
        if (bottomSheetSnapPoint > 0) {
          setBottomSheetSnapPoint(bottomSheetSnapPoint - 1);
        }
      } else if (diff < -30) {
        // Swipe up
        if (bottomSheetSnapPoint < 2) {
          setBottomSheetSnapPoint(bottomSheetSnapPoint + 1);
        }
      }
      touchStartY.current = 0;
    }
  };

  const addPins = () => {
    if (!map.current || !window.mapboxgl) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    BUILDINGS.forEach((building) => {
      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.backgroundColor = selectedBuilding?.id === building.id ? '#FF8C00' : '#3B82F6';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.transition = 'all 0.2s';
      el.onclick = () => {
        setSelectedBuilding(building);
        setIsBottomSheetExpanded(true);
      };

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (map.current) {
      addPins();
    }
  }, [selectedBuilding]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white md:hidden border-b-[0.5px] border-gray-300">
        <div className="grid grid-cols-3 items-center px-4 py-3.5">
          {/* Logo Column - Left */}
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-[#185FA5] rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">M</span>
            </div>
          </div>
          
          {/* Text Column - Center */}
          <div className="flex justify-center">
            <h1 className="text-base font-medium text-[#1a1a1a] tracking-tighter whitespace-nowrap">
              Miami Apartment Guy
              <sup className="text-xs font-normal align-top ml-0.5 relative" style={{top: '2px'}}>™</sup>
            </h1>
          </div>
          
          {/* Hamburger Column - Right */}
          <div className="flex justify-end">
            <button onClick={() => {}} className="p-0 hover:opacity-70 transition">
              <Menu className="w-5.5 h-5.5 text-[#1a1a1a]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col w-full h-full bg-white min-h-screen pt-16">
        <div className={`flex-1 relative w-full h-full overflow-hidden transition-opacity ${bottomSheetSnapPoint === 2 ? 'pointer-events-none opacity-50' : 'pointer-events-auto'}`}>
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-3 items-center pointer-events-none">
            <input type="text" placeholder="Look up a building..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-3 rounded-full bg-white border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 pointer-events-auto" />
            <button onClick={() => isAgentMode ? setIsAgentMode(false) : setShowPinModal(true)} className={`w-12 h-12 ${isAgentMode ? 'bg-green-600' : 'bg-gray-600'} text-white rounded-full flex items-center justify-center shadow-md hover:opacity-80 pointer-events-auto text-lg`}>{isAgentMode ? '$' : '?'}</button>
          </div>
        </div>

        <div ref={bottomSheetRef} onTouchStart={handleBottomSheetDrag} onTouchEnd={handleBottomSheetDrag} className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-40 transition-all duration-300 overflow-hidden flex flex-col cursor-grab active:cursor-grabbing ${SNAP_POINTS[bottomSheetSnapPoint]}`}>
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 flex-shrink-0"></div>
          
          {bottomSheetSnapPoint === 0 && <div className="flex-1"></div>}
          
          {bottomSheetSnapPoint === 1 && !selectedBuilding && filteredBuildings.length > 0 && (
            <div className="px-4 pt-2 overflow-hidden">
              <h2 className="text-xs font-semibold text-gray-500 mb-1 truncate">Browse Neighborhoods</h2>
              <div className="space-y-1 overflow-hidden">
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <img src={filteredBuildings[0].images[0]} alt={filteredBuildings[0].name} className="w-full h-36 object-cover" />
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{filteredBuildings[0].name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{filteredBuildings[0].neighborhood}</span>
                    </div>
                    <p className="text-xs text-gray-600">{filteredBuildings[0].tagline || `$${filteredBuildings[0].priceMin}+/mo`}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {bottomSheetSnapPoint === 1 && selectedBuilding && (
            <div className="px-4 pt-2 overflow-hidden">
              <div className="space-y-1 overflow-hidden">
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <img src={selectedBuilding.images[0]} alt={selectedBuilding.name} className="w-full h-36 object-cover" />
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{selectedBuilding.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{selectedBuilding.neighborhood}</span>
                    </div>
                    <p className="text-xs text-gray-600">{selectedBuilding.tagline || `$${selectedBuilding.priceMin}+/mo`}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bottomSheetSnapPoint === 2 && (
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {!selectedBuilding ? (
                <div className="pt-2">
                  <h2 className="text-lg font-semibold mb-4">{searchQuery ? 'Search Results' : 'Neighborhoods'}</h2>
                  {searchQuery ? (
                    <div className="space-y-2">
                      {filteredBuildings.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No buildings found</p>
                      ) : (
                        filteredBuildings.map((building) => (
                          <div key={building.id} className="p-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
                            <img src={building.images[0]} alt={building.name} className="w-full h-40 object-cover rounded-md mb-3" />
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm">{building.name}</h3>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{building.neighborhood}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{building.tagline || `$${building.priceMin}+/mo`}</p>
                            <p className="text-xs text-gray-500 mb-2">{building.units.join(' | ')}</p>
                            {isAgentMode && <p className="text-xs text-green-600 font-semibold mb-2">Commission: 50% of 1 month</p>}
                            <div className="flex gap-2 mt-2">
                                <button onClick={(e) => { e.stopPropagation(); openSMS(); }} className="md:hidden flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600">Text Don</button>
                              <button onClick={(e) => { e.stopPropagation(); setInfoBuilding(building); }} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600">Info</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {NEIGHBORHOODS.map((neighborhood) => {
                      const buildings = getFilteredNeighborhoodBuildings(neighborhood);
                      const isExpanded = expandedNeighborhoods.includes(neighborhood);
                      if (buildings.length === 0) return null;
                      return (
                        <div key={neighborhood}>
                          <button onClick={() => toggleNeighborhood(neighborhood)} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                            <span className="font-semibold text-gray-900 text-sm">{neighborhood} ({buildings.length})</span>
                            <span className={`text-gray-600 transition transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-2 mb-3">
                              {buildings.map((building) => (
                                <div key={building.id} className="p-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
                                  <img src={building.images[0]} alt={building.name} className="w-full h-40 object-cover rounded-md mb-3" />
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{building.name}</h3>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{building.neighborhood}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">{building.tagline || `$${building.priceMin}+/mo`}</p>
                                  <p className="text-xs text-gray-500 mb-2">{building.units.join(' | ')}</p>
                                  {isAgentMode && <p className="text-xs text-green-600 font-semibold mb-2">Commission: 50% of 1 month</p>}
                                  <div className="flex gap-2 mt-2">
                              <button onClick={(e) => { e.stopPropagation(); openSMS(); }} className="md:hidden flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600">Text Don</button>
                                    <button onClick={(e) => { e.stopPropagation(); setInfoBuilding(building); }} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600">Info</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  <button onClick={() => setSelectedBuilding(null)} className="text-blue-600 hover:text-blue-700 text-sm mb-3 font-semibold">← Back</button>
                  <ImageCarousel images={selectedBuilding.images} />
                  <h1 className="text-2xl font-bold mt-4 mb-2">{selectedBuilding.name}</h1>
                  <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium mb-4">{selectedBuilding.neighborhood}</div>
                  <p className="text-gray-600 text-sm mb-6">📍 {selectedBuilding.address}</p>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">{selectedBuilding.tagline || `$${selectedBuilding.priceMin}+/mo`}</p></div>
                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg"><p className="text-sm font-semibold text-blue-900">Current Offer</p><p className="text-lg font-bold text-blue-600">{selectedBuilding.concession}</p></div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Income Requirement</p><p className="font-semibold text-gray-900">{selectedBuilding.incomeReq}</p></div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Credit Requirement</p><p className="font-semibold text-gray-900">{selectedBuilding.creditReq}</p></div>
                  <div className="mb-4"><p className="text-sm font-semibold text-gray-900 mb-2">Bedrooms</p><div className="flex gap-2 flex-wrap">{selectedBuilding.units.map((unit) => (<span key={unit} className="text-xs bg-gray-100 px-3 py-1 rounded">{unit}</span>))}</div></div>
                  <div className="mb-4"><p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p><div className="flex flex-wrap gap-2">{selectedBuilding.amenities.map((a) => (<span key={a} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">{a}</span>))}</div></div>
                  
                  <div className="mb-4">
                    <FeesDropdown fees={selectedBuilding.fees} />
                  </div>
                  
                  <button onClick={() => setShowModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-4">Talk to Don</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1">
        <div className="flex-1 relative">
          <MapComponent expandedNeighborhoods={expandedNeighborhoods} selectedBuilding={selectedBuilding} onPinClick={setSelectedBuilding} />
        </div>

        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {!selectedBuilding ? (
            <div className="p-6">
              <input type="text" placeholder="Look up a building..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{searchQuery ? 'Search Results' : 'Neighborhoods'}</h2>
                <button onClick={() => isAgentMode ? setIsAgentMode(false) : setShowPinModal(true)} className={`px-3 py-1 rounded-lg text-sm font-medium ${isAgentMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{isAgentMode ? 'Agent Mode' : 'Agent?'}</button>
              </div>
              <div className="space-y-2">
                {NEIGHBORHOODS.map((neighborhood) => {
                  const buildings = getFilteredNeighborhoodBuildings(neighborhood);
                  const isExpanded = expandedNeighborhoods.includes(neighborhood);
                  if (buildings.length === 0) return null;
                  return (
                    <div key={neighborhood}>
                      <button
                        onClick={() => toggleNeighborhood(neighborhood)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                      >
                        <span className="font-semibold text-gray-900">{neighborhood} ({buildings.length})</span>
                        <span className={`text-gray-600 transition transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-2 space-y-2">
                          {buildings.map((building) => (
                            <div key={building.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                              <h3 className="font-semibold text-gray-900">{building.name}</h3>
                              <p className="text-sm text-gray-700">{building.tagline || `$${building.priceMin}+`}</p>
                              <p className="text-xs text-gray-500 mt-1">{building.units.join(' | ')}</p>
                              {isAgentMode && <p className="text-xs text-green-600 font-semibold mt-1">Commission: 50% of 1 month</p>}
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => openSMS()} className="md:hidden flex-1 bg-green-500 text-white py-1.5 rounded text-xs font-semibold hover:bg-green-600">Text Don</button>
                                <button onClick={() => setInfoBuilding(building)} className="flex-1 bg-blue-500 text-white py-1.5 rounded text-xs font-semibold hover:bg-blue-600">Info</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <button onClick={() => setSelectedBuilding(null)} className="text-blue-600 hover:text-blue-700 text-sm mb-4">← Back</button>
              <ImageCarousel images={selectedBuilding.images} />
              <h1 className="text-2xl font-bold mt-4 mb-2">{selectedBuilding.name}</h1>
              <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium mb-4">{selectedBuilding.neighborhood}</div>
              <p className="text-gray-600 text-sm mb-6">�� {selectedBuilding.address}</p>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{selectedBuilding.tagline || `$${selectedBuilding.priceMin}+/mo`}</p>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">Current Offer</p>
                <p className="text-lg font-bold text-blue-600">{selectedBuilding.concession}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Income Requirement</p>
                <p className="font-semibold text-gray-900">{selectedBuilding.incomeReq}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Credit Requirement</p>
                <p className="font-semibold text-gray-900">{selectedBuilding.creditReq}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600">Works w/ Guarantors</p>
                  <Tooltip />
                </div>
                <p className="font-semibold text-gray-900">{selectedBuilding.guarantor ? 'Yes' : 'No'}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Hold Days</p>
                <p className="font-semibold text-gray-900">{selectedBuilding.holdDays.join(', ')} days</p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-2">Bedrooms</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedBuilding.units.map((unit) => (
                    <span key={unit} className="text-xs bg-gray-100 px-3 py-1 rounded">{unit}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBuilding.amenities.map((a) => (
                    <span key={a} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">{a}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <FeesDropdown fees={selectedBuilding.fees} />
              </div>

              <button onClick={() => setShowModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Talk to Don</button>
            </div>
          )}
        </div>
      </div>

      {showModal && <TalkTodonModal building={selectedBuilding} onClose={() => setShowModal(false)} />}
      
      {/* Info Popup Modal */}
      {infoBuilding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{infoBuilding.name}</h2>
              <button onClick={() => setInfoBuilding(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">X</button>
            </div>
            <div className="p-4">
              <ImageCarousel images={infoBuilding.images} />
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">{infoBuilding.neighborhood}</p>
                <p className="text-sm text-gray-600 mt-1">{infoBuilding.address}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Starting at</p>
                <p className="text-2xl font-bold text-gray-900">${infoBuilding.priceMin}+/mo</p>
              </div>
              
              {isAgentMode && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Agent Commission</p>
                  <p className="text-lg font-bold text-green-700">50% of 1 month rent</p>
                </div>
              )}
              
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <p className="text-xs text-orange-600 font-medium">Current Offer</p>
                <p className="text-sm font-semibold text-orange-700">{infoBuilding.concession}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Unit Types</p>
                <div className="flex gap-2 flex-wrap">
                  {infoBuilding.units.map((unit) => (
                    <span key={unit} className="text-xs bg-gray-100 px-3 py-1 rounded-full">{unit}</span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {infoBuilding.amenities.map((a) => (
                    <span key={a} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Income Req</p>
                  <p className="font-semibold text-gray-900">{infoBuilding.incomeReq}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Credit Req</p>
                  <p className="font-semibold text-gray-900">{infoBuilding.creditReq}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Guarantor</p>
                  <p className="font-semibold text-gray-900">{infoBuilding.guarantor ? 'Accepted' : 'Not Accepted'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Hold Period</p>
                  <p className="font-semibold text-gray-900">{infoBuilding.holdDays.join('/')} days</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Fees</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Deposit</span><span className="font-medium">{infoBuilding.fees.deposit}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Application</span><span className="font-medium">{infoBuilding.fees.application}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Admin Fee</span><span className="font-medium">{infoBuilding.fees.admin}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Parking</span><span className="font-medium">{infoBuilding.fees.parking}</span></div>
                  {infoBuilding.fees.misc !== 'None' && infoBuilding.fees.misc !== 'TBD' && (
                    <div className="flex justify-between"><span className="text-gray-600">Other</span><span className="font-medium">{infoBuilding.fees.misc}</span></div>
                  )}
                </div>
              </div>
              
              <button onClick={() => { openWhatsApp(infoBuilding); }} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 mt-4">Text About This Building</button>
            </div>
          </div>
        </div>
      )}
      
      {/* PIN Modal for Agent Mode */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Enter Agent PIN</h2>
            <input 
              type="password" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)} 
              placeholder="Enter PIN" 
              className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={4}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowPinModal(false); setPinInput(''); }} className="flex-1 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handlePinSubmit} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
