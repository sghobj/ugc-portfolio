export type MediaAsset = {
  url: string
  alt: string
  width?: number
  height?: number
}

export type PortfolioItemKind = 'video' | 'photo'

export type PhotoCategory = 'Hotels' | 'Roadtrips' | 'Destinations' | 'Lifestyle'

export type PortfolioItem = {
  id: string
  kind: PortfolioItemKind
  title: string
  category: string
  description: string
  coverImage: MediaAsset
  tags: string[]
  featured: boolean
  publishedAt: string
  formatType?: string
  whatPracticed?: string
  goal?: string
  style?: string
  deliverablesIncluded?: string[]
  photoCategory?: PhotoCategory
  caption?: string
}

export type Service = {
  id: string
  title: string
  description: string
  deliverables: string[]
}

export type Testimonial = {
  id: string
  name: string
  role: string
  quote: string
  avatar?: MediaAsset
}

export type PortfolioData = {
  items: PortfolioItem[]
  services: Service[]
  testimonials: Testimonial[]
}
