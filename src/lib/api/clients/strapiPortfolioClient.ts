import { env } from '@/config/env'
import type { PortfolioClient } from '@/lib/api/clients/portfolioClient'
import { resolveStrapiAssetUrl } from '@/lib/strapiAssetUrl'
import type {
  MediaAsset,
  PhotoCategory,
  PortfolioData,
  PortfolioItem,
  PortfolioItemKind,
  Service,
  Testimonial,
  TestimonialLanguage,
} from '@/types/portfolio'

type StrapiRecord = Record<string, unknown> & {
  id?: string | number
  attributes?: Record<string, unknown>
}

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  return value as Record<string, unknown>
}

const asString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback
}

const asNumber = (value: unknown): number | undefined => {
  return typeof value === 'number' ? value : undefined
}

const asBoolean = (value: unknown, fallback = false): boolean => {
  return typeof value === 'boolean' ? value : fallback
}

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

const asPortfolioItemKind = (value: unknown, fallback: PortfolioItemKind): PortfolioItemKind => {
  if (value === 'video' || value === 'photo') {
    return value
  }

  return fallback
}

const asPhotoCategory = (value: unknown): PhotoCategory | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  switch (value) {
    case 'Hotels':
    case 'Hotel':
    case 'Product':
      return 'Hotels'
    case 'Roadtrips':
    case 'Roadtrip':
    case 'Cars':
    case 'Automotive':
      return 'Roadtrips'
    case 'Destinations':
    case 'Destination':
    case 'Travel':
      return 'Destinations'
    case 'Lifestyle':
    case 'Food':
      return 'Lifestyle'
    default:
      return undefined
  }
}

const TESTIMONIAL_LANGUAGES: TestimonialLanguage[] = ['en', 'de', 'it', 'fr', 'es']

const asTestimonialLanguage = (value: unknown): TestimonialLanguage => {
  const normalized = asString(value).trim().toLowerCase()

  return (TESTIMONIAL_LANGUAGES as string[]).includes(normalized)
    ? (normalized as TestimonialLanguage)
    : 'en'
}

const readField = (entity: StrapiRecord, field: string): unknown => {
  if (Object.hasOwn(entity, field)) {
    return entity[field]
  }

  const attributes = entity.attributes

  if (attributes && Object.hasOwn(attributes, field)) {
    return attributes[field]
  }

  return undefined
}

const toCollection = (payload: unknown): StrapiRecord[] => {
  const root = asRecord(payload)
  const data = root?.data

  if (Array.isArray(data)) {
    return data
      .map((entry) => asRecord(entry))
      .filter((entry): entry is StrapiRecord => Boolean(entry))
  }

  const single = asRecord(data)
  return single ? [single] : []
}

const unwrapFirstMediaRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    return unwrapFirstMediaRecord(value[0])
  }

  const record = asRecord(value)

  if (!record) {
    return undefined
  }

  if (Object.hasOwn(record, 'data')) {
    return unwrapFirstMediaRecord(record.data)
  }

  if (Object.hasOwn(record, 'attributes')) {
    return unwrapFirstMediaRecord(record.attributes)
  }

  return record
}

const extractMedia = (value: unknown, fallbackAlt: string): MediaAsset => {
  const media = unwrapFirstMediaRecord(value)
  const rawUrl = asString(media?.url)

  return {
    url: resolveStrapiAssetUrl(rawUrl, env.strapiBaseUrl),
    alt: asString(media?.alternativeText, fallbackAlt),
    width: asNumber(media?.width),
    height: asNumber(media?.height),
  }
}

const asStringId = (value: unknown, fallback: string): string => {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }

  return fallback
}

const normalizeDate = (value: unknown): string => {
  if (typeof value !== 'string') {
    return new Date().toISOString()
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}

const mapPortfolioItems = (payload: unknown): PortfolioItem[] => {
  return toCollection(payload).map((entity, index) => {
    const title = asString(readField(entity, 'title'), `Untitled item ${index + 1}`)
    const id = asStringId(readField(entity, 'id') ?? entity.id, `portfolio-${index + 1}`)
    const category = asString(readField(entity, 'category'), 'Portfolio')
    const fallbackKind: PortfolioItemKind =
      category.toLowerCase() === 'ugc' ? 'video' : 'photo'

    return {
      id,
      kind: asPortfolioItemKind(readField(entity, 'kind'), fallbackKind),
      title,
      category,
      description: asString(readField(entity, 'description'), ''),
      coverImage: extractMedia(
        readField(entity, 'coverImage') ?? readField(entity, 'image'),
        title,
      ),
      tags: asStringArray(readField(entity, 'tags')),
      featured: asBoolean(readField(entity, 'featured')),
      publishedAt: normalizeDate(readField(entity, 'publishedAt')),
      formatType: asString(readField(entity, 'formatType')),
      whatPracticed: asString(readField(entity, 'whatPracticed')),
      goal: asString(readField(entity, 'goal')),
      style: asString(readField(entity, 'style')),
      deliverablesIncluded: asStringArray(readField(entity, 'deliverablesIncluded')),
      photoCategory: asPhotoCategory(readField(entity, 'photoCategory')),
      caption: asString(readField(entity, 'caption')),
    }
  })
}

const mapServices = (payload: unknown): Service[] => {
  return toCollection(payload).map((entity, index) => {
    const title = asString(readField(entity, 'title'), `Service ${index + 1}`)
    const id = asStringId(readField(entity, 'id') ?? entity.id, `service-${index + 1}`)

    return {
      id,
      title,
      description: asString(readField(entity, 'description'), ''),
      deliverables: asStringArray(readField(entity, 'deliverables')),
    }
  })
}

const mapTestimonials = (payload: unknown): Testimonial[] => {
  return toCollection(payload).map((entity, index) => {
    const name = asString(readField(entity, 'name'), `Client ${index + 1}`)
    const id = asStringId(readField(entity, 'id') ?? entity.id, `testimonial-${index + 1}`)

    return {
      id,
      name,
      role: asString(readField(entity, 'role'), ''),
      quote: asString(readField(entity, 'quote'), ''),
      language: asTestimonialLanguage(readField(entity, 'language')),
      quoteEn: asString(readField(entity, 'quoteEn'), '') || undefined,
      avatar: extractMedia(readField(entity, 'avatar'), name),
    }
  })
}

export class StrapiPortfolioClient implements PortfolioClient {
  private readonly baseUrl: string

  constructor(baseUrl = env.strapiBaseUrl) {
    if (!baseUrl) {
      throw new Error('VITE_STRAPI_URL is required when VITE_BACKEND_MODE=strapi')
    }

    this.baseUrl = baseUrl
  }

  private async request(path: string): Promise<unknown> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (env.strapiToken) {
      headers.Authorization = `Bearer ${env.strapiToken}`
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Strapi request failed (${response.status}) for ${path}`)
    }

    return (await response.json()) as unknown
  }

  getPortfolioData = async (): Promise<PortfolioData> => {
    const [itemsPayload, servicesPayload, testimonialsPayload] = await Promise.all([
      this.request('/api/portfolio-items?populate=*'),
      this.request('/api/services?populate=*'),
      this.request('/api/testimonials?populate=*'),
    ])

    return {
      items: mapPortfolioItems(itemsPayload),
      services: mapServices(servicesPayload),
      testimonials: mapTestimonials(testimonialsPayload),
    }
  }
}
