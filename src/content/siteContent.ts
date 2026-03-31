export const navLinks = [
  { href: '#portfolio', label: 'Work' },
  { href: '#services', label: 'Services' },
  { href: '#contact', label: 'Contact' },
]

export const expectationCards = [
  {
    title: 'Fast turnaround',
    description: 'Clear timelines from brief to final delivery.',
  },
  {
    title: 'Travel-ready planning',
    description: 'Shot lists and route planning built around destination goals.',
  },
  {
    title: 'Clear communication',
    description: 'Consistent updates so your team always knows project status.',
  },
  {
    title: 'Brand-safe cinematic edits',
    description: 'Clean, modern edits that still feel authentic and natural.',
  },
]

export const workflowSteps = [
  'Brief',
  'Concept + shotlist',
  'Travel/Film',
  'Edit',
  'Deliverables + revisions',
]

export type BrandVertical = 'Hotels' | 'Tourism Boards' | 'Automotive & Roadtrips'

export type BrandPackage = {
  id: string
  name: string
  vertical: BrandVertical
  price: string
  summary: string
  timeline: string
  budgetHint: string
  deliverables: string[]
}

export const brandVerticals: BrandVertical[] = [
  'Hotels',
  'Tourism Boards',
  'Automotive & Roadtrips',
]

export const budgetRangeOptions = [
  '$400 - $700',
  '$700 - $1,200',
  '$1,200 - $2,000',
  '$2,000+',
]

export const brandPackages: BrandPackage[] = [
  {
    id: 'hotel-stay-starter',
    name: 'Stay Starter',
    vertical: 'Hotels',
    price: '$450',
    summary: 'Starter package for boutique hotels, stays, and rental properties.',
    timeline: '5-7 days after check-in/content day',
    budgetHint: '$400 - $700',
    deliverables: [
      '1 vertical hotel reel (30-45s)',
      '4 edited photo stills',
      '1 hook variation',
      '1 revision round',
    ],
  },
  {
    id: 'hotel-feature-suite',
    name: 'Property Feature Suite',
    vertical: 'Hotels',
    price: '$950',
    summary: 'Expanded hotel package with room, amenities, and experience storytelling.',
    timeline: '7-10 days after content day',
    budgetHint: '$700 - $1,200',
    deliverables: [
      '2 vertical reels (room + amenities)',
      '10 edited photo stills',
      '2 hook options per reel',
      'Caption suggestions',
    ],
  },
  {
    id: 'tourism-destination-teaser',
    name: 'Destination Teaser Set',
    vertical: 'Tourism Boards',
    price: '$700',
    summary: 'Short-form destination storytelling designed for tourism awareness campaigns.',
    timeline: '6-9 days after filming window',
    budgetHint: '$700 - $1,200',
    deliverables: [
      '2 destination reels (15-30s)',
      '8 edited stills',
      '1 itinerary angle variation',
      'Platform-ready exports',
    ],
  },
  {
    id: 'tourism-itinerary-campaign',
    name: 'Itinerary Campaign Pack',
    vertical: 'Tourism Boards',
    price: '$1,350',
    summary: 'Multi-stop destination package for city, regional, or seasonal campaigns.',
    timeline: '8-12 days after final filming day',
    budgetHint: '$1,200 - $2,000',
    deliverables: [
      '3 destination reels',
      '12 edited stills',
      '6 story clips',
      'Hook + caption set',
    ],
  },
  {
    id: 'auto-roadtrip-teaser',
    name: 'Roadtrip Teaser Kit',
    vertical: 'Automotive & Roadtrips',
    price: '$800',
    summary: 'Automotive lifestyle package featuring road moments and scenic routes.',
    timeline: '6-9 days after roadtrip shoot',
    budgetHint: '$700 - $1,200',
    deliverables: [
      '2 roadtrip reels',
      '8 edited stills',
      'POV + in-cabin sequences',
      '1 revision round',
    ],
  },
  {
    id: 'auto-adventure-campaign',
    name: 'Adventure Campaign Suite',
    vertical: 'Automotive & Roadtrips',
    price: '$1,600',
    summary: 'Full roadtrip story package for launches and broader awareness campaigns.',
    timeline: '9-14 days after content shoot',
    budgetHint: '$1,200 - $2,000',
    deliverables: [
      '4 reels (feature + lifestyle angles)',
      '15 edited stills',
      'Short cutdowns for ads',
      'Priority feedback cycle',
    ],
  },
]

export const findBrandPackageById = (id: string): BrandPackage | undefined => {
  return brandPackages.find((pack) => pack.id === id)
}

export type UgcPackage = {
  name: string
  videos: string
  summary: string
  includes: string[]
}

export const ugcPackages: UgcPackage[] = [
  {
    name: 'Stay Starter',
    videos: '1 video',
    summary: 'Starter package for hotel, resort, or rental stay features.',
    includes: ['1 concept', '1 edited reel', '1 revision round', '9:16 delivery'],
  },
  {
    name: 'Journey Growth',
    videos: '3 videos',
    summary: 'Best for destination storytelling and multi-angle travel campaigns.',
    includes: ['3 concepts', '3 edited reels', '2 hook variations', '1 revision per video'],
  },
  {
    name: 'Expedition Campaign',
    videos: '6 videos',
    summary: 'Full campaign bundle for launches, itineraries, or seasonal pushes.',
    includes: ['6 edited reels', 'Hook matrix', 'Caption options', 'Priority scheduling'],
  },
]

export const addOns = [
  'Extra hooks',
  'Extra destination cut',
  'Raw footage',
  'Photo bundle',
  'Second-day coverage',
]

export const creationTypes = [
  'Hotel room + amenity walkthrough',
  'Destination teaser reel',
  'Roadtrip diary sequence',
  'Car lifestyle montage',
  'Hiking trail story',
  'Day-itinerary voiceover reel',
]

export const faqItems = [
  {
    question: 'How fast is turnaround?',
    answer:
      'Most starter projects are delivered within 5-7 business days after filming access is confirmed.',
  },
  {
    question: 'How many revisions are included?',
    answer: 'Each package includes one revision round. Extra revisions can be added.',
  },
  {
    question: 'How do travel and location logistics work?',
    answer:
      'Share location details, access rules, and filming windows early so I can plan an efficient shot list.',
  },
  {
    question: 'How do usage rights work?',
    answer:
      'Usage rights depend on where and how long content runs (organic, paid ads, whitelisting). Ask if unsure.',
  },
  {
    question: 'Do you support whitelisting?',
    answer: 'Yes, whitelisting can be discussed based on campaign goals and timeline.',
  },
]

export const portfolioConceptIdeas = [
  'Hotel check-in to room reveal',
  'Destination morning-to-night montage',
  'Roadtrip POV + scenic stop sequence',
  'Hiking trail diary + voiceover',
  'Car feature lifestyle reel',
  '48-hour destination itinerary',
  'Hotel amenity highlight cut',
  'Sunrise viewpoint teaser',
]
