import { env } from '@/config/env'
import { resolveStrapiAssetUrl } from '@/lib/strapiAssetUrl'
import type { MediaAsset, Testimonial, TestimonialLanguage } from '@/types/portfolio'

const SUPPORTED_LANGUAGES: TestimonialLanguage[] = ['en', 'de', 'it', 'fr', 'es']

const normalizeLanguage = (value: unknown): TestimonialLanguage => {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return (SUPPORTED_LANGUAGES as string[]).includes(raw)
    ? (raw as TestimonialLanguage)
    : 'en'
}

const LOCAL_STORAGE_FEEDBACK_KEY = 'ugc-feedback-submissions'

type FeedbackPayload = {
  name: string
  role: string
  quote: string
}

type TestimonialInput = {
  id?: unknown
  name?: unknown
  role?: unknown
  quote?: unknown
  language?: unknown
  quoteEn?: unknown
  avatar?: MediaAsset
}

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  return value as Record<string, unknown>
}

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined

const asStringId = (value: unknown, fallback: string): string => {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }

  return fallback
}

const readField = (entity: Record<string, unknown>, field: string): unknown => {
  if (Object.hasOwn(entity, field)) {
    return entity[field]
  }

  const attributes = asRecord(entity.attributes)

  if (attributes && Object.hasOwn(attributes, field)) {
    return attributes[field]
  }

  return undefined
}

const toCollection = (payload: unknown): Record<string, unknown>[] => {
  const root = asRecord(payload)
  const data = root?.data

  if (Array.isArray(data)) {
    return data.map((entry) => asRecord(entry)).filter((entry): entry is Record<string, unknown> => Boolean(entry))
  }

  if (Array.isArray(payload)) {
    return payload
      .map((entry) => asRecord(entry))
      .filter((entry): entry is Record<string, unknown> => Boolean(entry))
  }

  const single = asRecord(data)
  if (single) {
    return [single]
  }

  return []
}

const unwrapMediaRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    return unwrapMediaRecord(value[0])
  }

  const record = asRecord(value)

  if (!record) {
    return undefined
  }

  if (Object.hasOwn(record, 'data')) {
    return unwrapMediaRecord(record.data)
  }

  if (Object.hasOwn(record, 'attributes')) {
    return unwrapMediaRecord(record.attributes)
  }

  return record
}

const extractAvatar = (value: unknown, fallbackAlt: string): MediaAsset | undefined => {
  const media = unwrapMediaRecord(value)
  const rawUrl = asString(media?.url)

  if (!rawUrl) {
    return undefined
  }

  return {
    url: resolveStrapiAssetUrl(rawUrl, env.strapiBaseUrl),
    alt: asString(media?.alternativeText) || fallbackAlt,
    width: asNumber(media?.width),
    height: asNumber(media?.height),
  }
}

const normalizeTestimonial = (
  input: TestimonialInput,
  index: number,
): Testimonial | null => {
  const name = asString(input.name)
  const quote = asString(input.quote)

  if (!name || !quote) {
    return null
  }

  const quoteEn = asString(input.quoteEn)

  return {
    id: asStringId(input.id, `testimonial-${index + 1}`),
    name,
    role: asString(input.role),
    quote,
    language: normalizeLanguage(input.language),
    quoteEn: quoteEn || undefined,
    avatar: input.avatar,
  }
}

const mapStrapiTestimonials = (payload: unknown): Testimonial[] => {
  return toCollection(payload)
    .map((entity, index) => {
      const fallbackName = `Client ${index + 1}`
      const normalized = normalizeTestimonial(
        {
          id: asStringId(readField(entity, 'id'), `testimonial-${index + 1}`),
          name: asString(readField(entity, 'name')) || fallbackName,
          role: asString(readField(entity, 'role')),
          quote: asString(readField(entity, 'quote')),
          language: readField(entity, 'language'),
          quoteEn: readField(entity, 'quoteEn'),
          avatar: extractAvatar(readField(entity, 'avatar'), fallbackName),
        },
        index,
      )

      return normalized
    })
    .filter((entry): entry is Testimonial => Boolean(entry))
}

const mapCustomTestimonials = (payload: unknown): Testimonial[] => {
  return toCollection(payload)
    .map((entity, index) => {
      const normalized = normalizeTestimonial(
        {
          id: asStringId(entity.id, `testimonial-${index + 1}`),
          name: asString(entity.name),
          role: asString(entity.role),
          quote: asString(entity.quote),
          language: entity.language,
          quoteEn: entity.quoteEn,
          avatar: undefined,
        },
        index,
      )

      return normalized
    })
    .filter((entry): entry is Testimonial => Boolean(entry))
}

const readStoredMockFeedback = (): Testimonial[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_FEEDBACK_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((entry, index) => {
        const record = asRecord(entry)

        if (!record) {
          return null
        }

        return normalizeTestimonial(
          {
            id: asString(record.id),
            name: asString(record.name),
            role: asString(record.role),
            quote: asString(record.quote),
            language: record.language,
            quoteEn: record.quoteEn,
            avatar: undefined,
          },
          index,
        )
      })
      .filter((entry): entry is Testimonial => Boolean(entry))
  } catch {
    return []
  }
}

const storeMockFeedback = (entry: Testimonial): void => {
  if (typeof window === 'undefined') {
    return
  }

  const existing = readStoredMockFeedback()
  const next = [entry, ...existing]

  window.localStorage.setItem(LOCAL_STORAGE_FEEDBACK_KEY, JSON.stringify(next.slice(0, 20)))
}

const getBaseUrl = (value: string): string => value.replace(/\/+$/, '')

const parseApiErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as
      | {
          error?: { message?: string }
          message?: string
        }
      | undefined

    if (payload?.error?.message) {
      return payload.error.message
    }

    if (payload?.message) {
      return payload.message
    }
  } catch {
    // Ignore parsing errors and return fallback below.
  }

  return `Request failed (${response.status})`
}

const getReadHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (env.strapiToken) {
    headers.Authorization = `Bearer ${env.strapiToken}`
  }

  return headers
}

const getWriteHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = env.feedbackSubmitToken || env.strapiToken

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const getFeedbackSubmitUrl = (): string => {
  if (env.feedbackSubmitUrl) {
    return env.feedbackSubmitUrl
  }

  if (env.backendMode === 'strapi') {
    const baseUrl = getBaseUrl(env.strapiBaseUrl)
    return baseUrl ? `${baseUrl}/api/testimonial-feedback/submit` : ''
  }

  if (env.backendMode === 'custom') {
    const baseUrl = getBaseUrl(env.customApiBaseUrl)
    return baseUrl ? `${baseUrl}/testimonials` : ''
  }

  return ''
}

const toFeedbackPayload = (input: FeedbackPayload): FeedbackPayload => {
  return {
    name: input.name.trim(),
    role: input.role.trim(),
    quote: input.quote.trim(),
  }
}

export const getFeedbackFormPath = (): string => {
  const raw = env.feedbackFormPath.trim()

  if (!raw) {
    return '/feedback'
  }

  return raw.startsWith('/') ? raw : `/${raw}`
}

export const getAbsoluteFeedbackFormUrl = (): string => {
  const formPath = getFeedbackFormPath()

  if (typeof window === 'undefined') {
    return formPath
  }

  return `${window.location.origin}${formPath}`
}

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  if (env.backendMode === 'mock') {
    return readStoredMockFeedback()
  }

  if (env.backendMode === 'strapi') {
    const baseUrl = getBaseUrl(env.strapiBaseUrl)

    if (!baseUrl) {
      throw new Error('VITE_STRAPI_URL is required in strapi mode.')
    }

    const response = await fetch(`${baseUrl}/api/testimonial-feedback/public`, {
      headers: getReadHeaders(),
    })

    if (!response.ok) {
      throw new Error(await parseApiErrorMessage(response))
    }

    const payload = (await response.json()) as unknown
    return mapStrapiTestimonials(payload)
  }

  const baseUrl = getBaseUrl(env.customApiBaseUrl)

  if (!baseUrl) {
    throw new Error('VITE_CUSTOM_API_URL is required in custom mode.')
  }

  const response = await fetch(`${baseUrl}/testimonials`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response))
  }

  const payload = (await response.json()) as unknown
  return mapCustomTestimonials(payload)
}

export const submitTestimonial = async (input: FeedbackPayload): Promise<void> => {
  const payload = toFeedbackPayload(input)

  if (!payload.name || !payload.quote) {
    throw new Error('Name and feedback are required.')
  }

  if (payload.quote.length > 1200) {
    throw new Error('Feedback is too long. Please keep it under 1200 characters.')
  }

  if (env.backendMode === 'mock') {
    storeMockFeedback({
      id: `mock-feedback-${Date.now()}`,
      name: payload.name,
      role: payload.role,
      quote: payload.quote,
      language: 'en',
    })
    return
  }

  const endpoint = getFeedbackSubmitUrl()

  if (!endpoint) {
    throw new Error('Feedback endpoint is not configured. Set VITE_FEEDBACK_SUBMIT_URL.')
  }

  const body =
    env.backendMode === 'strapi'
      ? { data: payload }
      : payload

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: env.backendMode === 'strapi' ? getWriteHeaders() : { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response))
  }
}
