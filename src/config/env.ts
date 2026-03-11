const backendModes = ['mock', 'strapi', 'custom'] as const

export type BackendMode = (typeof backendModes)[number]

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const parseBackendMode = (): BackendMode => {
  const requestedMode = import.meta.env.VITE_BACKEND_MODE

  if (requestedMode && backendModes.includes(requestedMode as BackendMode)) {
    return requestedMode as BackendMode
  }

  if (import.meta.env.VITE_STRAPI_URL) {
    return 'strapi'
  }

  return 'mock'
}

export const env = {
  backendMode: parseBackendMode(),
  strapiBaseUrl: trimTrailingSlash(import.meta.env.VITE_STRAPI_URL ?? ''),
  strapiToken: import.meta.env.VITE_STRAPI_TOKEN ?? '',
  customApiBaseUrl: trimTrailingSlash(import.meta.env.VITE_CUSTOM_API_URL ?? ''),
}
