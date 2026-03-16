const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const isLoopbackHostname = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase()

  return (
    normalized === 'localhost' ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized === '[::1]' ||
    normalized === '127.0.0.1' ||
    normalized.startsWith('127.')
  )
}

const withBase = (value: string, baseUrl: string): string => {
  const prefixed = value.startsWith('/') ? value : `/${value}`
  return `${baseUrl}${prefixed}`
}

export const resolveStrapiAssetUrl = (value: string, baseUrl: string): string => {
  if (!value) {
    return ''
  }

  const normalizedBaseUrl = trimTrailingSlash(baseUrl)

  if (!normalizedBaseUrl) {
    return value
  }

  try {
    const parsedAssetUrl = new URL(value)
    const parsedBaseUrl = new URL(normalizedBaseUrl)

    if (
      isLoopbackHostname(parsedAssetUrl.hostname) &&
      !isLoopbackHostname(parsedBaseUrl.hostname)
    ) {
      return `${normalizedBaseUrl}${parsedAssetUrl.pathname}${parsedAssetUrl.search}${parsedAssetUrl.hash}`
    }

    return value
  } catch {
    return withBase(value, normalizedBaseUrl)
  }
}
