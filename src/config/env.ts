const backendModes = ['mock', 'strapi', 'custom'] as const

export type BackendMode = (typeof backendModes)[number]

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const parsePath = (value: string, fallback: string): string => {
  const trimmed = value.trim()

  if (!trimmed) {
    return fallback
  }

  const prefixed = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const normalized = prefixed.replace(/\/+$/, '')

  return normalized || fallback
}

const sanitizeStageSegment = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

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

const parseUploadStage = (): string => {
  const configuredStage = sanitizeStageSegment(import.meta.env.VITE_UPLOAD_STAGE ?? '')
  if (configuredStage) {
    return configuredStage
  }

  const mode = sanitizeStageSegment(import.meta.env.MODE ?? '')
  if (mode === 'development') {
    return 'local'
  }

  if (mode === 'production') {
    return 'prod'
  }

  return mode || 'local'
}

export const env = {
  backendMode: parseBackendMode(),
  strapiBaseUrl: trimTrailingSlash(import.meta.env.VITE_STRAPI_URL ?? ''),
  strapiToken: import.meta.env.VITE_STRAPI_TOKEN ?? '',
  customApiBaseUrl: trimTrailingSlash(import.meta.env.VITE_CUSTOM_API_URL ?? ''),
  uploadStage: parseUploadStage(),
  feedbackFormPath: parsePath(import.meta.env.VITE_FEEDBACK_FORM_PATH ?? '/feedback', '/feedback'),
  feedbackSubmitUrl: trimTrailingSlash(import.meta.env.VITE_FEEDBACK_SUBMIT_URL ?? ''),
  feedbackSubmitToken: import.meta.env.VITE_STRAPI_FEEDBACK_TOKEN ?? '',
  serviceInquirySubmitUrl: trimTrailingSlash(import.meta.env.VITE_SERVICE_INQUIRY_SUBMIT_URL ?? ''),
}
