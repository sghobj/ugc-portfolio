import { env } from '@/config/env'

const PANEL_AUTH_TOKEN_KEY = 'instagram-panel-auth-token'

type StrapiAuthSuccessPayload = {
  jwt?: string
}

type StrapiErrorPayload = {
  error?: {
    message?: string
  }
}

type LoginResult =
  | { ok: true }
  | { ok: false; message: string }

const getBaseUrl = (): string => env.strapiBaseUrl.replace(/\/+$/, '')

const parseStrapiErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const typedPayload = payload as StrapiErrorPayload
  return typedPayload.error?.message ?? null
}

const getSafeErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : 'Authentication failed.'

export const getInstagramPanelToken = (): string | null =>
  window.localStorage.getItem(PANEL_AUTH_TOKEN_KEY)

export const clearInstagramPanelToken = (): void => {
  window.localStorage.removeItem(PANEL_AUTH_TOKEN_KEY)
}

const setInstagramPanelToken = (token: string): void => {
  window.localStorage.setItem(PANEL_AUTH_TOKEN_KEY, token)
}

export const loginInstagramPanel = async (
  identifier: string,
  password: string,
): Promise<LoginResult> => {
  const baseUrl = getBaseUrl()

  if (!baseUrl) {
    return {
      ok: false,
      message: 'VITE_STRAPI_URL is missing. Configure it before using panel login.',
    }
  }

  try {
    const response = await fetch(`${baseUrl}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    })

    const payload = (await response.json()) as StrapiAuthSuccessPayload | StrapiErrorPayload

    if (!response.ok) {
      return {
        ok: false,
        message: parseStrapiErrorMessage(payload) ?? 'Invalid credentials.',
      }
    }

    if (!('jwt' in payload) || !payload.jwt) {
      return {
        ok: false,
        message: 'Authentication succeeded but no token was returned.',
      }
    }

    setInstagramPanelToken(payload.jwt)

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message: getSafeErrorMessage(error),
    }
  }
}

export const validateInstagramPanelToken = async (token: string): Promise<boolean> => {
  const baseUrl = getBaseUrl()

  if (!baseUrl || !token) {
    return false
  }

  try {
    const response = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.ok
  } catch {
    return false
  }
}
