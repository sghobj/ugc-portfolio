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
  categories?: UgcTagEntry[] | null
  media?: UgcMediaAsset | null
}

type UgcWorkBlock = UgcTextBlock & {
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
  imageAlt: string
  width?: number
  height?: number
  mime: string
  categories: string[]
}

export type UgcWorkContent = {
  sectionName: string
  title: string
  text: string
  media: UgcWorkMediaContent[]
}

export type UgcContent = {
  aboutMe: UgcSectionContent
  hero: UgcHeroContent
  myServices: UgcServicesContent
  myWork: UgcWorkContent
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
}

const normalize = (ugc: UgcPayload | null | undefined): UgcContent => {
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
      media:
        ugc.myWork?.media
          ?.map((entry, index) => {
            const title = asString(entry?.title)
            const description = asString(entry?.description)
            const rawUrl = asString(entry?.media?.url)
            const mime = asString(entry?.media?.mime).toLowerCase()
            const kind = asMediaKind(entry?.kind)

            return {
              id: entry?.id != null ? String(entry.id) : `work-media-${index + 1}`,
              kind: inferMediaKind(kind, mime),
              title,
              description,
              hook: asString(entry?.hook),
              goal: asString(entry?.goal),
              style: asString(entry?.style),
              imageUrl: resolveStrapiAssetUrl(rawUrl, env.strapiBaseUrl),
              imageAlt: asString(entry?.media?.alternativeText) || title || 'Portfolio media',
              width: asNumber(entry?.media?.width),
              height: asNumber(entry?.media?.height),
              mime,
              categories:
                entry?.categories
                  ?.map((tag) => asString(tag?.name))
                  .filter((name) => name.length > 0) ?? [],
            }
          })
          .filter((entry) => entry.imageUrl.length > 0) ?? [],
    },
  }
}

export const useUgcContent = (): UseUgcContentResult => {
  const shouldQuery = env.backendMode === 'strapi'

  const { data, loading, error } = useQuery<UgcQueryData>(UGC_QUERY, {
    skip: !shouldQuery,
  })

  const content = useMemo(() => normalize(data?.ugc), [data])

  return {
    content,
    isLoading: shouldQuery && loading,
    error: shouldQuery && error ? error.message : null,
  }
}
