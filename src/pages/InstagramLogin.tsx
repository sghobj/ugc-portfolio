import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  clearUgcAdminToken,
  getUgcAdminToken,
  loginUgcAdmin,
  validateUgcAdminToken,
} from '@/lib/ugcAdminAuth'

type LoginLocationState = {
  from?: string
}

const getRedirectPath = (state: unknown): string => {
  if (!state || typeof state !== 'object') {
    return '/admin'
  }

  const typedState = state as LoginLocationState

  if (typeof typedState.from !== 'string' || !typedState.from.startsWith('/')) {
    return '/admin'
  }

  return typedState.from
}

const InstagramLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingExistingSession, setIsCheckingExistingSession] = useState(true)

  const redirectPath = useMemo(
    () => getRedirectPath(location.state),
    [location.state],
  )

  useEffect(() => {
    let isMounted = true
    const token = getUgcAdminToken()

    if (!token) {
      setIsCheckingExistingSession(false)
      return () => {
        isMounted = false
      }
    }

    const validateExistingSession = async (): Promise<void> => {
      const isValid = await validateUgcAdminToken(token)

      if (!isMounted) {
        return
      }

      if (isValid) {
        navigate(redirectPath, { replace: true })
        return
      }

      clearUgcAdminToken()
      setIsCheckingExistingSession(false)
    }

    void validateExistingSession()

    return () => {
      isMounted = false
    }
  }, [navigate, redirectPath])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (!identifier.trim() || !password) {
      setError('Enter your identifier and password.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    const result = await loginUgcAdmin(identifier.trim(), password)

    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    const token = getUgcAdminToken()
    const hasAccess = token ? await validateUgcAdminToken(token) : false

    if (!hasAccess) {
      clearUgcAdminToken()
      setError('Login succeeded, but this user does not have access to the admin dashboard.')
      return
    }

    navigate(redirectPath, { replace: true })
  }

  if (isCheckingExistingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="font-body text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-2xl text-foreground">UGC Portfolio Admin Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your Strapi account to manage uploads and metadata.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="identifier">
              Email or username
            </label>
            <input
              id="identifier"
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-sm text-muted-foreground">
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/">
            Back to portfolio
          </Link>
        </div>
      </section>
    </main>
  )
}

export default InstagramLogin
