import { env } from '@/config/env'

const UGC_ADMIN_TOKEN_KEY = 'ugc-admin-auth-token'

type StrapiAuthSuccessPayload = {
  jwt?: string
}

type StrapiErrorPayload = {
  error?: {
    message?: string
  }
  message?: string
}

type LoginResult = { ok: true } | { ok: false; message: string }

type AuthUser = {
  id?: number | string | null
  username?: string | null
  email?: string | null
  role?: {
    type?: string | null
    name?: string | null
  } | null
}

type MePayload = {
  user?: AuthUser | null
}

const getBaseUrl = (): string => env.strapiBaseUrl.replace(/\/+$/, '')

const parseErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const typedPayload = payload as StrapiErrorPayload
  return typedPayload.error?.message ?? typedPayload.message ?? null
}

const safeErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : 'Authentication failed.'

const withApiPath = (path: string): string => `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

export const getUgcAdminToken = (): string | null =>
  window.localStorage.getItem(UGC_ADMIN_TOKEN_KEY)

export const clearUgcAdminToken = (): void => {
  window.localStorage.removeItem(UGC_ADMIN_TOKEN_KEY)
}

const setUgcAdminToken = (token: string): void => {
  window.localStorage.setItem(UGC_ADMIN_TOKEN_KEY, token)
}

export const loginUgcAdmin = async (
  identifier: string,
  password: string,
): Promise<LoginResult> => {
  const baseUrl = getBaseUrl()

  if (!baseUrl) {
    return {
      ok: false,
      message: 'VITE_STRAPI_URL is missing. Configure it before using admin login.',
    }
  }

  try {
    const response = await fetch(withApiPath('/api/auth/local'), {
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
        message: parseErrorMessage(payload) ?? 'Invalid credentials.',
      }
    }

    if (!('jwt' in payload) || !payload.jwt) {
      return {
        ok: false,
        message: 'Authentication succeeded but no token was returned.',
      }
    }

    setUgcAdminToken(payload.jwt)

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message: safeErrorMessage(error),
    }
  }
}

export const getUgcAdminMe = async (token: string): Promise<AuthUser | null> => {
  const baseUrl = getBaseUrl()

  if (!baseUrl || !token) {
    return null
  }

  try {
    const response = await fetch(withApiPath('/api/ugc-portfolio/admin/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as MePayload
    return payload.user ?? null
  } catch {
    return null
  }
}

export const validateUgcAdminToken = async (token: string): Promise<boolean> => {
  const user = await getUgcAdminMe(token)
  return Boolean(user)
}
