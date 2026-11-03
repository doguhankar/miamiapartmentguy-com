/**
 * Hand-written neighborhood guide copy for the SEO neighborhood pages.
 * Keyed by neighborhood slug (see slugify in lib/seo-shared.ts).
 * Rent numbers are intentionally NOT hard-coded here: the page renders live
 * pricing from Supabase, so this copy never goes stale on price.
 */

export interface NeighborhoodFaq {
  q: string
  a: string
}

export interface NeighborhoodContent {
  /** Short phrase used in the <title> and meta description, e.g. "near FIU and Biscayne Blvd" */
  hook: string
  /** 2–3 paragraphs of unique intro copy */
  intro: string[]
  /** Quick-scan highlights shown as a list */
  highlights: { label: string; text: string }[]
  /** Who the neighborhood fits best */
  goodFor: string
  /** True when Don has placed renters across the buildings listed for this neighborhood */
  placedRenters?: boolean
  faqs: NeighborhoodFaq[]
}

const LOCATOR_FAQ: NeighborhoodFaq = {
  q: 'Does it cost anything to use a Miami apartment finder?',
  a: 'No. Miami Apartment Guy is free for renters. The building pays the locator fee, so your rent and fees are the same as if you applied on your own. You just get a licensed Miami realtor doing the searching, touring setup and negotiating for you.',
}

export const NEIGHBORHOOD_CONTENT: Record<string, NeighborhoodContent> = {
  'north-miami': {
    hook: 'more space for the money, minutes from the bay',
    intro: [
      'North Miami is where renters go when they want more square footage for their budget without leaving the Biscayne corridor. Most of the apartment buildings here sit along or just off Biscayne Boulevard, so you are a straight shot down US-1 to Midtown and Downtown, and close to I-95 when you need to head north.',
      'The area is quieter and more residential than the urban core. You get newer mid-rise rentals, garden-style communities and a few boutique buildings, often with parking included, which is rare closer to Brickell. FIU\'s Biscayne Bay campus and the Museum of Contemporary Art (MOCA) North Miami are both here, and Oleta River State Park and Aventura are a short drive away.',
      'I track every North Miami building below with live pricing, so you can compare real numbers instead of guessing from stale listings.',
    ],
    highlights: [
      { label: 'Vibe', text: 'Residential, laid-back, local spots along Biscayne Blvd and NE 125th St' },
      { label: 'Getting around', text: 'US-1 / Biscayne Blvd and I-95; driving is the norm here' },
      { label: 'Why renters pick it', text: 'More space and easier parking than the urban core at the same budget' },
      { label: 'Nearby', text: 'FIU Biscayne Bay, MOCA, Oleta River State Park, Aventura' },
    ],
    goodFor: 'Renters who want a newer apartment and more room for their budget, students and staff at FIU Biscayne Bay, and anyone commuting north toward Aventura or Broward.',
    faqs: [
      {
        q: 'Is North Miami a good place to rent an apartment?',
        a: 'For a lot of renters, yes. North Miami gives you more space and easier parking than Brickell or Downtown at a similar budget, with quick access to Biscayne Blvd and I-95. It is a quieter, more residential area, so it fits people who do not need to be in the middle of the nightlife.',
      },
      {
        q: 'How far is North Miami from Downtown Miami?',
        a: 'North Miami sits roughly 10 miles north of Downtown. Depending on traffic, it is usually a 20 to 35 minute drive down Biscayne Blvd or I-95.',
      },
      {
        q: 'What is the difference between North Miami and North Miami Beach?',
        a: 'They are two separate cities. North Miami is west of the bay around Biscayne Blvd and NE 125th St. North Miami Beach is just north of it, closer to Aventura and Oleta River State Park. Despite the name, North Miami Beach is not on the ocean.',
      },
      LOCATOR_FAQ,
    ],
  },

  'north-miami-beach': {
    hook: 'close to Aventura, Oleta River and the beaches',
    intro: [
      'North Miami Beach sits between North Miami and Aventura, so you are minutes from Aventura Mall, Oleta River State Park and the beaches in Sunny Isles, without paying beachfront prices. Despite the name, the city itself is not on the ocean, which is exactly why rents here tend to be friendlier.',
      'The rental stock is a mix of newer amenity buildings and older, well-kept communities. Many include parking and in-unit laundry, and you are close to the Golden Glades and I-95 if you commute to Broward or into Miami.',
      'Every North Miami Beach building below is tracked with live pricing and current move-in deals, so you can see what is actually available right now.',
    ],
    highlights: [
      { label: 'Vibe', text: 'Suburban-feeling, diverse, lots of local restaurants and shops' },
      { label: 'Getting around', text: 'Biscayne Blvd, Ives Dairy Rd and quick I-95 access; driving is the norm' },
      { label: 'Why renters pick it', text: 'Near the beach and Aventura without beachfront rents' },
      { label: 'Nearby', text: 'Aventura Mall, Oleta River State Park, Sunny Isles Beach' },
    ],
    goodFor: 'Renters who want to be near the beach and Aventura on a more reasonable budget, and commuters splitting time between Miami-Dade and Broward.',
    faqs: [
      {
        q: 'Is North Miami Beach on the beach?',
        a: 'No. The city of North Miami Beach is on the mainland, west of the Intracoastal. Sunny Isles Beach and Haulover are a short drive east, which is why many renters choose North Miami Beach: beach access without beachfront pricing.',
      },
      {
        q: 'Is North Miami Beach close to Aventura?',
        a: 'Yes. North Miami Beach borders Aventura, and Aventura Mall is usually a 5 to 10 minute drive from most buildings here.',
      },
      {
        q: 'How do I find apartments in North Miami Beach with move-in specials?',
        a: 'The buildings listed on this page show current deals when a leasing office is running one. Text me your budget and move-in date and I will send the North Miami Beach buildings with the best real monthly cost after concessions.',
      },
      LOCATOR_FAQ,
    ],
  },

  'miami-beach': {
    hook: 'South Beach, Mid-Beach and North Beach rentals',
    intro: [
      'Renting in Miami Beach means living on the barrier island between Biscayne Bay and the Atlantic. South Beach puts you near Lincoln Road, Ocean Drive and the busiest nightlife, Mid-Beach is calmer with more residential condos, and North Beach is the most relaxed and usually the best value on the island.',
      'Most Miami Beach rentals are condos owned by individual landlords, not big apartment complexes, which is why they rarely show up together on the big listing sites. That is where a locator helps: I can pull options from owners and buildings that are not advertising widely.',
      'The buildings below are the Miami Beach properties I track with live pricing. If you do not see the right fit, text me. I can search condo rentals across the island for you.',
    ],
    highlights: [
      { label: 'Vibe', text: 'Beach lifestyle; busy in South Beach, quieter in Mid and North Beach' },
      { label: 'Getting around', text: 'Walkable, bikeable, free city trolleys; causeways connect to the mainland' },
      { label: 'Why renters pick it', text: 'Ocean access, walkability and the classic Miami Beach lifestyle' },
      { label: 'Heads up', text: 'Much of the inventory is condo rentals, which have association approval steps' },
    ],
    goodFor: 'Renters who want to walk to the beach, people who work on the island, and anyone who values lifestyle over square footage.',
    faqs: [
      {
        q: 'Is it hard to find an apartment in Miami Beach?',
        a: 'It can be. Much of Miami Beach is condo rentals owned by individual landlords, and many require condo association approval, which adds time. A locator helps by finding owner listings and telling you up front which buildings have long approval processes.',
      },
      {
        q: 'What is the difference between South Beach, Mid-Beach and North Beach?',
        a: 'South Beach is the busiest area, with Lincoln Road, Ocean Drive and the nightlife. Mid-Beach is quieter and more residential. North Beach is the most laid-back part of the island and usually offers the best value.',
      },
      {
        q: 'Do Miami Beach rentals require condo association approval?',
        a: 'Many do. Condo-owned units often need association approval, which can include an application fee, a background check and a waiting period. I will flag which options need it so it does not surprise you.',
      },
      LOCATOR_FAQ,
    ],
  },

  midtown: {
    hook: 'walkable, central, next to Wynwood and the Design District',
    intro: [
      'Midtown Miami is one of the most central places to rent in the city. You are between Wynwood to the south and the Design District to the north, with Edgewater and the bay a few blocks east. The Shops at Midtown put groceries and everyday errands within walking distance, which is rare in Miami.',
      'The rental stock is mostly modern mid- and high-rise buildings with full amenity packages: pools, gyms, co-working lounges and garage parking. It is a popular landing spot for people moving to Miami who want to be walkable to restaurants and nightlife without paying Brickell prices.',
      'I have placed renters across the Midtown buildings below, so I know the leasing teams, the real fees and which buildings run the best move-in deals.',
    ],
    highlights: [
      { label: 'Vibe', text: 'Young, social and walkable, with Wynwood and the Design District next door' },
      { label: 'Getting around', text: 'Walkable for daily errands; quick access to I-195, I-95 and Biscayne Blvd' },
      { label: 'Why renters pick it', text: 'Central location, modern buildings and walkable errands' },
      { label: 'Nearby', text: 'Wynwood Walls, Design District, Edgewater, Margaret Pace Park' },
    ],
    goodFor: 'People new to Miami, young professionals, and anyone who wants walkability and a central location without Brickell pricing.',
    placedRenters: true,
    faqs: [
      {
        q: 'Is Midtown Miami a good place to live?',
        a: 'Yes, especially if you want walkability. Midtown has modern amenity buildings, groceries and shops within walking distance, and Wynwood and the Design District right next door. It is one of the most central neighborhoods in Miami.',
      },
      {
        q: 'Is Midtown Miami cheaper than Brickell?',
        a: 'Often, yes. Comparable new buildings in Midtown frequently rent for less than Brickell, and move-in concessions are common. Check the live pricing on the buildings above for current numbers.',
      },
      {
        q: 'What is the difference between Midtown and Wynwood?',
        a: 'They are neighbors. Wynwood is the arts and nightlife district with murals, galleries and breweries. Midtown is just north and feels more residential, with the Shops at Midtown and larger apartment buildings.',
      },
      LOCATOR_FAQ,
    ],
  },

  wynwood: {
    hook: 'arts district living with new construction rentals',
    intro: [
      'Wynwood is Miami\'s arts district, known for the Wynwood Walls, street murals, galleries, breweries and some of the city\'s best restaurants and nightlife. Over the last few years, a wave of new boutique and mid-rise apartment buildings has turned it into a real place to live, not just a place to visit.',
      'Most Wynwood rentals are new construction with modern finishes, rooftop amenities and smaller, efficient floor plans. The location is central: Midtown and the Design District are just north, Edgewater and the bay are a few minutes east, and Downtown is a short drive south.',
      'I have placed renters across the Wynwood buildings below. I know which ones are quiet, which ones run real deals, and which ones get loud on weekends.',
    ],
    highlights: [
      { label: 'Vibe', text: 'Creative, lively and walkable; busiest on weekend nights' },
      { label: 'Getting around', text: 'Walkable and bikeable; quick access to I-95, I-195 and Downtown' },
      { label: 'Why renters pick it', text: 'New buildings, nightlife and restaurants at your door' },
      { label: 'Heads up', text: 'Weekend noise varies a lot by block. Ask me which buildings stay quiet' },
    ],
    goodFor: 'Creatives, young professionals and anyone who wants to live where the restaurants, nightlife and art are.',
    placedRenters: true,
    faqs: [
      {
        q: 'Is Wynwood a good place to live?',
        a: 'If you want energy, food and nightlife at your door, yes. Wynwood has a growing number of new apartment buildings and is very central. Noise can be a factor on weekend nights, so building and block choice matters.',
      },
      {
        q: 'Is Wynwood loud at night?',
        a: 'Some blocks are, especially near the bars and venues on Friday and Saturday nights. Other buildings are tucked on quieter streets. I have placed renters in these buildings, so I can tell you which ones stay quiet.',
      },
      {
        q: 'Are there new apartments in Wynwood?',
        a: 'Yes. Most Wynwood rentals are new construction from the last several years, with modern finishes and amenities like rooftop pools and co-working spaces. New buildings often open with move-in concessions.',
      },
      LOCATOR_FAQ,
    ],
  },

  downtown: {
    hook: 'high-rise living with the free Metromover and Brightline',
    intro: [
      'Downtown Miami is high-rise living at the center of everything. The free Metromover loops through Downtown and into Brickell, Metrorail and Brightline both stop here, and you are walking distance to Bayfront Park, Bayside, the Kaseya Center and the Adrienne Arsht Center.',
      'Downtown has some of the largest concentration of new rental towers in Miami, which means more competition between buildings and more move-in concessions for renters. Many towers have bay views, resort-style pools and full amenity floors.',
      'I have placed renters across the Downtown buildings below, so I can tell you the real monthly cost after fees and specials, not just the advertised rent.',
    ],
    highlights: [
      { label: 'Vibe', text: 'Urban, high-rise, busy on weekdays and event nights' },
      { label: 'Getting around', text: 'Free Metromover, Metrorail and Brightline; one of the few places you can skip a car' },
      { label: 'Why renters pick it', text: 'Transit, bay views and lots of towers competing with move-in deals' },
      { label: 'Nearby', text: 'Brickell, Bayfront Park, Kaseya Center, Arsht Center, Edgewater' },
    ],
    goodFor: 'Professionals working Downtown or in Brickell, renters who want to live car-light, and anyone who wants a high-rise with a view.',
    placedRenters: true,
    faqs: [
      {
        q: 'Can you live in Downtown Miami without a car?',
        a: 'More easily than almost anywhere else in Miami. The free Metromover connects Downtown, Brickell and the Omni area, Metrorail runs to the airport and south, and Brightline connects to Fort Lauderdale and beyond.',
      },
      {
        q: 'Are there move-in specials in Downtown Miami apartments?',
        a: 'Often, yes. Downtown has a lot of new towers competing for renters, so concessions like free months are common. The buildings above show current deals when they are running one.',
      },
      {
        q: 'Is Downtown Miami cheaper than Brickell?',
        a: 'Comparable towers in Downtown are often priced a bit below Brickell, and concessions can widen the gap. Compare the live pricing above against the Brickell page to see the current difference.',
      },
      LOCATOR_FAQ,
    ],
  },

  edgewater: {
    hook: 'bayfront high-rises between Downtown and Midtown',
    intro: [
      'Edgewater runs along Biscayne Bay between Downtown and Midtown, and it is one of the best places in Miami to get a bay view at a reasonable price. Most rentals are newer high-rise towers, many with water views, large pools and full amenity decks.',
      'It is quieter than Brickell and Wynwood but still central. Margaret Pace Park sits on the water, Midtown and Wynwood are a few minutes west, and Downtown is just south. Biscayne Blvd runs right through it, and the Venetian Causeway gets you to Miami Beach.',
      'I have placed renters across the Edgewater buildings below, so I know the leasing teams and which towers are running the best deals right now.',
    ],
    highlights: [
      { label: 'Vibe', text: 'Bayfront, residential and calm, with the city a few minutes away' },
      { label: 'Getting around', text: 'Biscayne Blvd, quick access to I-195 and the Venetian Causeway to Miami Beach' },
      { label: 'Why renters pick it', text: 'Bay views and newer towers, usually for less than Brickell' },
      { label: 'Nearby', text: 'Margaret Pace Park, Midtown, Wynwood, Downtown, Miami Beach' },
    ],
    goodFor: 'Renters who want a water view and a newer tower, people who want to be central but not in the nightlife, and dog owners who want a park nearby.',
    placedRenters: true,
    faqs: [
      {
        q: 'Is Edgewater Miami a good place to live?',
        a: 'Yes. Edgewater has newer bayfront towers, a calmer feel than Brickell or Wynwood, and a central location between Downtown, Midtown and Miami Beach.',
      },
      {
        q: 'Do Edgewater apartments have bay views?',
        a: 'Many do. Most towers east of Biscayne Blvd face Biscayne Bay. View units usually cost more, so tell me your budget and I will tell you which buildings get you a view for the least.',
      },
      {
        q: 'Is Edgewater cheaper than Brickell?',
        a: 'Comparable towers in Edgewater are often priced below Brickell, especially with move-in concessions. Check the live pricing above for current numbers.',
      },
      LOCATOR_FAQ,
    ],
  },
}

export function getNeighborhoodContent(slug: string): NeighborhoodContent | null {
  return NEIGHBORHOOD_CONTENT[slug] ?? null
}

/** Neighborhoods featured in homepage internal links, in display order. */
export const FEATURED_NEIGHBORHOOD_SLUGS = [
  'downtown',
  'edgewater',
  'midtown',
  'wynwood',
  'miami-beach',
  'north-miami',
  'north-miami-beach',
  'brickell',
]
