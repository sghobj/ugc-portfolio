export const navLinks = [
  { href: '/#portfolio', label: 'Work' },
  { href: '/#services', label: 'Services' },
  { href: '/#contact', label: 'Contact' },
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
  'Approx. $500 - $900',
  'Approx. $900 - $1,500',
  'Approx. $1,500 - $2,500',
  'Custom scope',
]

export const brandPackages: BrandPackage[] = [
  {
    id: 'hotel-stay-starter',
    name: 'Stay Content',
    vertical: 'Hotels',
    price: 'From $500',
    summary: 'Flexible stay-based content for hotels, resorts, and boutique properties. Final scope depends on property level, stay length, access, and usage needs.',
    timeline: 'Approx. 5-10 days after the stay',
    budgetHint: 'Approx. $500 - $1,500+',
    deliverables: [
      'Usually 1-2 vertical reels',
      'Approx. 5-15 edited photo selects',
      'Usage and deliverables tailored to the property',
      'Final quote after brief and stay details',
    ],
  },
  {
    id: 'hotel-feature-suite',
    name: 'Content Day',
    vertical: 'Hotels',
    price: 'From $900',
    summary: 'A focused content visit for properties that want polished photo and video assets without a full overnight stay.',
    timeline: 'Approx. 7-12 days after content day',
    budgetHint: 'Approx. $900 - $2,000+',
    deliverables: [
      'Usually 2-3 vertical reels',
      'Approx. 10-25 edited photo selects',
      'Coverage can include rooms, dining, spa, amenities, or experience moments',
      'Final quote based on access, hours, and usage rights',
    ],
  },
  {
    id: 'tourism-destination-teaser',
    name: 'Destination Teaser Set',
    vertical: 'Tourism Boards',
    price: 'From $900',
    summary: 'Short-form destination storytelling for tourism campaigns, hotels, and experience-led brands.',
    timeline: '6-9 days after filming window',
    budgetHint: 'Approx. $900 - $1,800+',
    deliverables: [
      'Usually 2 destination reels',
      'Approx. 8-18 edited stills',
      'Story angle or itinerary concept',
      'Platform-ready exports',
    ],
  },
  {
    id: 'tourism-itinerary-campaign',
    name: 'Itinerary Campaign Pack',
    vertical: 'Tourism Boards',
    price: 'Custom',
    summary: 'Multi-stop destination content for city, regional, or seasonal campaigns with broader campaign usage.',
    timeline: '8-12 days after final filming day',
    budgetHint: 'Approx. $1,500 - $3,000+',
    deliverables: [
      'Usually 3-5 destination reels',
      'Approx. 15-35 edited stills',
      'Optional story clips or cutdowns',
      'Final scope based on campaign goals and usage',
    ],
  },
  {
    id: 'auto-roadtrip-teaser',
    name: 'Roadtrip Teaser Kit',
    vertical: 'Automotive & Roadtrips',
    price: 'From $900',
    summary: 'Automotive lifestyle package featuring road moments and scenic routes.',
    timeline: '6-9 days after roadtrip shoot',
    budgetHint: 'Approx. $900 - $1,800+',
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
    price: 'Custom',
    summary: 'Full roadtrip story package for launches and broader awareness campaigns.',
    timeline: '9-14 days after content shoot',
    budgetHint: 'Approx. $1,500 - $3,500+',
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
    name: 'Stay Content',
    videos: 'Approx. 1-2 videos',
    summary: 'Flexible hotel, resort, or rental stay content. Scope depends on property level, stay length, access, and usage.',
    includes: ['Concept direction', 'Edited vertical reel(s)', 'Optional photo selects', 'Final quote after brief'],
  },
  {
    name: 'Journey Growth',
    videos: 'Approx. 2-4 videos',
    summary: 'Best for destination storytelling, hotel experiences, and multi-angle travel campaigns.',
    includes: ['Campaign concept', 'Edited reels', 'Photo selects if needed', 'Usage tailored to campaign goals'],
  },
  {
    name: 'Expedition Campaign',
    videos: 'Custom bundle',
    summary: 'Full campaign bundle for launches, itineraries, seasonal pushes, or premium hotel campaigns.',
    includes: ['Multiple edited reels', 'Photo bundle options', 'Hook/caption direction', 'Custom usage and timeline'],
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
