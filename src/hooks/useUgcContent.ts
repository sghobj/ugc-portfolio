import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { env } from '@/config/env'
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

type UgcPayload = {
  aboutMe?: UgcTextBlock | null
  hero?: {
    title?: string | null
    name?: string | null
    text?: string | null
  } | null
  myServices?: UgcServicesBlock | null
  myWork?: UgcTextBlock | null
}

type UgcQueryData = {
  ugc?: UgcPayload | null
}

const asString = (value: string | null | undefined): string => value?.trim() ?? ''

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

export type UgcContent = {
  aboutMe: UgcSectionContent
  hero: UgcHeroContent
  myServices: UgcServicesContent
  myWork: UgcSectionContent
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
