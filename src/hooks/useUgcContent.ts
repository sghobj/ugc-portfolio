import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { env } from '@/config/env'
import { resolveStrapiAssetUrl } from '@/lib/strapiAssetUrl'
import { UGC_QUERY } from '@/queries/ugcQuery'

type UgcTextBlock = {
  sectionName?: string | null
  title?: string | null
  text?: string | null
}

type UgcServiceEntry = {
  id?: string | number | null
  iconName?: string | null
  serviceDetails?: string | null
}

type UgcServicesBlock = {
  sectionName?: string | null
  title?: string | null
  service?: UgcServiceEntry[] | null
}

type UgcMediaAsset = {
  url?: string | null
  alternativeText?: string | null
  width?: number | null
  height?: number | null
  mime?: string | null
  provider?: string | null
  embedUrl?: string | null
  playbackUrl?: string | null
  thumbnailUrl?: string | null
  focalPointX?: number | null
  focalPointY?: number | null
}

type UgcTagEntry = {
  name?: string | null
}

type UgcWorkMediaEntry = {
  id?: string | number | null
  kind?: string | null
  title?: string | null
  description?: string | null
  hook?: string | null
  goal?: string | null
  style?: string | null
  instagramUrl?: string | null
  sortOrder?: number | null
  isCollaboration?: boolean | null
  metricViews?: number | null
  metricLikes?: number | null
  metricShares?: number | null
  metricSaves?: number | null
  categories?: UgcTagEntry[] | null
  media?: UgcMediaAsset | null
}

type UgcWorkBlock = UgcTextBlock & {
  media?: UgcWorkMediaEntry[] | null
}

type UgcTestimonialEntry = {
  name?: string | null
  role?: string | null
  quote?: string | null
}

type UgcCollectionEntry = {
  id?: string | number | null
  name?: string | null
  description?: string | null
  story?: string | null
  isCollaboration?: boolean | null
  client?: string | null
  clientLogo?: string | null
  location?: string | null
  deliverables?: string | null
  testimonial?: UgcTestimonialEntry | null
  insights?: UgcTagEntry[] | null
  media?: UgcWorkMediaEntry[] | null
}

type UgcBrandEntry = {
  id?: string | number | null
  name?: string | null
  logo?: string | null
  website?: string | null
  location?: string | null
  category?: string | null
  relatedCollectionSlug?: string | null
  relatedCollectionName?: string | null
}

type UgcPayload = {
  aboutMe?: UgcTextBlock | null
  hero?: {
    title?: string | null
    name?: string | null
    text?: string | null
  } | null
  myServices?: UgcServicesBlock | null
  myWork?: UgcWorkBlock | null
  brands?: UgcBrandEntry[] | null
  collections?: UgcCollectionEntry[] | null
  highlights?: UgcWorkMediaEntry[] | null
  videos?: UgcWorkMediaEntry[] | null
  showMetrics?: boolean | null
  performance?: {
    periodLabel?: string | null
    views?: number | null
    reached?: number | null
    nonFollowerPct?: number | null
    interactions?: number | null
    followers?: number | null
    note?: string | null
  } | null
}

type UgcQueryData = {
  ugc?: UgcPayload | null
}

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined

const asMediaKind = (value: unknown): 'photo' | 'video' | '' => {
  if (value === 'photo' || value === 'video') {
    return value
  }

  return ''
}

const asProvider = (value: unknown): 'cloudinary' | 'bunny' | '' => {
  if (value === 'cloudinary' || value === 'bunny') {
    return value
  }

  return ''
}

const inferMediaKind = (
  kind: 'photo' | 'video' | '',
  mime: string,
): 'photo' | 'video' | '' => {
  if (kind) {
    return kind
  }

  if (mime.startsWith('video/')) {
    return 'video'
  }

  if (mime.startsWith('image/')) {
    return 'photo'
  }

  return ''
}

export type UgcHeroContent = {
  title: string
  name: string
  text: string
}

export type UgcSectionContent = {
  sectionName: string
  title: string
  text: string
}

export type UgcServiceContent = {
  id: string
  iconName: string
  serviceDetails: string
}

export type UgcServicesContent = {
  sectionName: string
  title: string
  service: UgcServiceContent[]
}

export type UgcWorkMediaContent = {
  id: string
  kind: 'photo' | 'video' | ''
  title: string
  description: string
  hook: string
  goal: string
  style: string
  instagramUrl: string
  imageUrl: string
  sourceUrl: string
  provider: 'cloudinary' | 'bunny' | ''
  embedUrl: string
  playbackUrl: string
  thumbnailUrl: string
  imageAlt: string
  width?: number
  height?: number
  focalPointX?: number
  focalPointY?: number
  mime: string
  isCollaboration: boolean
  metricViews: number | null
  metricLikes: number | null
  metricShares: number | null
  metricSaves: number | null
  categories: string[]
}

export type UgcWorkContent = {
  sectionName: string
  title: string
  text: string
  media: UgcWorkMediaContent[]
}

export type UgcCaseStudyTestimonial = {
  name: string
  role: string
  quote: string
}

export type UgcShowcaseCollectionContent = {
  id: string
  name: string
  description: string
  story: string
  isCollaboration: boolean
  client: string
  clientLogo: string
  location: string
  deliverables: string
  testimonial: UgcCaseStudyTestimonial | null
  insights: string[]
  media: UgcWorkMediaContent[]
}

export type UgcShowcaseContent = {
  collections: UgcShowcaseCollectionContent[]
  highlights: UgcWorkMediaContent[]
  videos: UgcWorkMediaContent[]
}

export type UgcBrandContent = {
  id: string
  name: string
  logoUrl: string
  website: string
  location: string
  category: string
  relatedCollectionSlug: string
  relatedCollectionName: string
}

export type UgcPerformance = {
  periodLabel: string
  views: number | null
  reached: number | null
  nonFollowerPct: number | null
  interactions: number | null
  followers: number | null
  note: string
}

export type UgcContent = {
  aboutMe: UgcSectionContent
  hero: UgcHeroContent
  myServices: UgcServicesContent
  myWork: UgcWorkContent
  brands: UgcBrandContent[]
  showcase: UgcShowcaseContent
  showMetrics: boolean
  performance: UgcPerformance
}

type UseUgcContentResult = {
  content: UgcContent
  isLoading: boolean
  error: string | null
}

const emptyContent: UgcContent = {
  aboutMe: {
    sectionName: '',
    title: '',
    text: '',
  },
  hero: {
    title: '',
    name: '',
    text: '',
  },
  myServices: {
    sectionName: '',
    title: '',
    service: [],
  },
  myWork: {
    sectionName: '',
    title: '',
    text: '',
    media: [],
  },
  brands: [],
  showcase: {
    collections: [],
    highlights: [],
    videos: [],
  },
  showMetrics: false,
  performance: {
    periodLabel: '',
    views: null,
    reached: null,
    nonFollowerPct: null,
    interactions: null,
    followers: null,
    note: '',
  },
}

const normalizeWorkMedia = (
  entries: UgcWorkMediaEntry[] | null | undefined,
  idPrefix: string,
): UgcWorkMediaContent[] => {
  return (
    entries
      ?.slice()
      .sort((a, b) => {
        const orderA = asNumber(a?.sortOrder) ?? Number.MAX_SAFE_INTEGER
        const orderB = asNumber(b?.sortOrder) ?? Number.MAX_SAFE_INTEGER

        if (orderA !== orderB) {
          return orderA - orderB
        }

        return 0
      })
      ?.map((entry, index) => {
        const title = asString(entry?.title)
        const description = asString(entry?.description)
        const sourceUrl = resolveStrapiAssetUrl(asString(entry?.media?.url), env.strapiBaseUrl)
        const embedUrl = resolveStrapiAssetUrl(asString(entry?.media?.embedUrl), env.strapiBaseUrl)
        const playbackUrl = resolveStrapiAssetUrl(
          asString(entry?.media?.playbackUrl),
          env.strapiBaseUrl,
        )
        const thumbnailUrl = resolveStrapiAssetUrl(
          asString(entry?.media?.thumbnailUrl),
          env.strapiBaseUrl,
        )
        const mime = asString(entry?.media?.mime).toLowerCase()
        const kind = asMediaKind(entry?.kind)
        const inferredKind = inferMediaKind(kind, mime)
        const imageUrl =
          inferredKind === 'video'
            ? thumbnailUrl || sourceUrl || playbackUrl || embedUrl
            : sourceUrl || thumbnailUrl

        return {
          id: entry?.id != null ? String(entry.id) : `${idPrefix}-${index + 1}`,
          kind: inferredKind,
          title,
          description,
          hook: asString(entry?.hook),
          goal: asString(entry?.goal),
          style: asString(entry?.style),
          instagramUrl: asString(entry?.instagramUrl),
          imageUrl,
          sourceUrl,
          provider: asProvider(entry?.media?.provider),
          embedUrl,
          playbackUrl,
          thumbnailUrl,
          imageAlt: asString(entry?.media?.alternativeText) || title || 'Portfolio media',
          width: asNumber(entry?.media?.width),
          height: asNumber(entry?.media?.height),
          focalPointX: asNumber(entry?.media?.focalPointX),
          focalPointY: asNumber(entry?.media?.focalPointY),
          mime,
          isCollaboration: entry?.isCollaboration === true,
          metricViews: asNumber(entry?.metricViews) ?? null,
          metricLikes: asNumber(entry?.metricLikes) ?? null,
          metricShares: asNumber(entry?.metricShares) ?? null,
          metricSaves: asNumber(entry?.metricSaves) ?? null,
          categories:
            entry?.categories
              ?.map((tag) => asString(tag?.name))
              .filter((name) => name.length > 0) ?? [],
        }
      })
      .filter(
        (entry) =>
          entry.imageUrl.length > 0 ||
          entry.sourceUrl.length > 0 ||
          entry.playbackUrl.length > 0 ||
          entry.embedUrl.length > 0,
      ) ?? []
  )
}

const normalizeBrands = (entries: UgcBrandEntry[] | null | undefined): UgcBrandContent[] => {
  return (
    entries
      ?.map((entry, index) => ({
        id: entry?.id != null ? String(entry.id) : `brand-${index + 1}`,
        name: asString(entry?.name),
        logoUrl: resolveStrapiAssetUrl(asString(entry?.logo), env.strapiBaseUrl),
        website: asString(entry?.website),
        location: asString(entry?.location),
        category: asString(entry?.category),
        relatedCollectionSlug: asString(entry?.relatedCollectionSlug),
        relatedCollectionName: asString(entry?.relatedCollectionName),
      }))
      .filter((entry) => entry.name.length > 0) ?? []
  )
}

export const normalizeUgcContent = (ugc: UgcPayload | null | undefined): UgcContent => {
  if (!ugc) {
    return emptyContent
  }

  return {
    aboutMe: {
      sectionName: asString(ugc.aboutMe?.sectionName),
      title: asString(ugc.aboutMe?.title),
      text: asString(ugc.aboutMe?.text),
    },
    hero: {
      title: asString(ugc.hero?.title),
      name: asString(ugc.hero?.name),
      text: asString(ugc.hero?.text),
    },
    myServices: {
      sectionName: asString(ugc.myServices?.sectionName),
      title: asString(ugc.myServices?.title),
      service:
        ugc.myServices?.service?.map((entry, index) => ({
          id: entry?.id != null ? String(entry.id) : `service-${index + 1}`,
          iconName: asString(entry?.iconName),
          serviceDetails: asString(entry?.serviceDetails),
        })) ?? [],
    },
    myWork: {
      sectionName: asString(ugc.myWork?.sectionName),
      title: asString(ugc.myWork?.title),
      text: asString(ugc.myWork?.text),
      media: normalizeWorkMedia(ugc.myWork?.media, 'work-media'),
    },
    brands: normalizeBrands(ugc.brands),
    showcase: {
      collections:
        ugc.collections?.map((collection, index) => {
          const collectionId =
            collection?.id != null ? String(collection.id) : `collection-${index + 1}`

          const collectionIsCollab = collection?.isCollaboration === true
          const collectionMedia = normalizeWorkMedia(collection?.media, `${collectionId}-media`).map(
            (entry) => ({
              ...entry,
              isCollaboration: entry.isCollaboration || collectionIsCollab,
            }),
          )

          const testimonialQuote = asString(collection?.testimonial?.quote)

          return {
            id: collectionId,
            name: asString(collection?.name),
            description: asString(collection?.description),
            story: asString(collection?.story),
            isCollaboration: collectionIsCollab,
            client: asString(collection?.client),
            clientLogo: resolveStrapiAssetUrl(asString(collection?.clientLogo), env.strapiBaseUrl),
            location: asString(collection?.location),
            deliverables: asString(collection?.deliverables),
            testimonial: testimonialQuote
              ? {
                  name: asString(collection?.testimonial?.name),
                  role: asString(collection?.testimonial?.role),
                  quote: testimonialQuote,
                }
              : null,
            insights:
              collection?.insights
                ?.map((insight) => asString(insight?.name))
                .filter((insight) => insight.length > 0) ?? [],
            media: collectionMedia,
          }
        }) ?? [],
      highlights: normalizeWorkMedia(ugc.highlights, 'highlight'),
      videos: normalizeWorkMedia(ugc.videos, 'video'),
    },
    showMetrics: ugc.showMetrics === true,
    performance: {
      periodLabel: asString(ugc.performance?.periodLabel),
      views: asNumber(ugc.performance?.views) ?? null,
      reached: asNumber(ugc.performance?.reached) ?? null,
      nonFollowerPct: asNumber(ugc.performance?.nonFollowerPct) ?? null,
      interactions: asNumber(ugc.performance?.interactions) ?? null,
      followers: asNumber(ugc.performance?.followers) ?? null,
      note: asString(ugc.performance?.note),
    },
  }
}

export const useUgcContent = (): UseUgcContentResult => {
  const shouldQuery = env.backendMode === 'strapi'

  const { data, loading, error } = useQuery<UgcQueryData>(UGC_QUERY, {
    skip: !shouldQuery,
  })

  const content = useMemo(() => normalizeUgcContent(data?.ugc), [data])

  return {
    content,
    isLoading: shouldQuery && loading,
    error: shouldQuery && error ? error.message : null,
  }
}
