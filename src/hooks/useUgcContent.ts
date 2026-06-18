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
  sortOrder?: number | null
  isCollaboration?: boolean | null
  categories?: UgcTagEntry[] | null
  media?: UgcMediaAsset | null
}

type UgcWorkBlock = UgcTextBlock & {
  media?: UgcWorkMediaEntry[] | null
}

type UgcCollectionEntry = {
  id?: string | number | null
  name?: string | null
  description?: string | null
  story?: string | null
  isCollaboration?: boolean | null
  insights?: UgcTagEntry[] | null
  media?: UgcWorkMediaEntry[] | null
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
  collections?: UgcCollectionEntry[] | null
  highlights?: UgcWorkMediaEntry[] | null
  videos?: UgcWorkMediaEntry[] | null
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
  categories: string[]
}

export type UgcWorkContent = {
  sectionName: string
  title: string
  text: string
  media: UgcWorkMediaContent[]
}

export type UgcShowcaseCollectionContent = {
  id: string
  name: string
  description: string
  story: string
  isCollaboration: boolean
  insights: string[]
  media: UgcWorkMediaContent[]
}

export type UgcShowcaseContent = {
  collections: UgcShowcaseCollectionContent[]
  highlights: UgcWorkMediaContent[]
  videos: UgcWorkMediaContent[]
}

export type UgcContent = {
  aboutMe: UgcSectionContent
  hero: UgcHeroContent
  myServices: UgcServicesContent
  myWork: UgcWorkContent
  showcase: UgcShowcaseContent
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
  showcase: {
    collections: [],
    highlights: [],
    videos: [],
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

          return {
            id: collectionId,
            name: asString(collection?.name),
            description: asString(collection?.description),
            story: asString(collection?.story),
            isCollaboration: collectionIsCollab,
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
