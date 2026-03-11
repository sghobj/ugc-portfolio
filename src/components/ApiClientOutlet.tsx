import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { createPortfolioClient } from '@/lib/api/createPortfolioClient'

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Failed to initialize the API client.'
}

export const ApiClientOutlet = () => {
  const [isClientReady, setIsClientReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const initializeClient = async (): Promise<void> => {
      try {
        await Promise.resolve(createPortfolioClient())

        if (isMounted) {
          setIsClientReady(true)
        }
      } catch (unknownError) {
        if (isMounted) {
          setError(getErrorMessage(unknownError))
        }
      }
    }

    void initializeClient()

    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="font-body text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!isClientReady) {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-live="polite">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
          role="status"
          aria-label="Loading API client"
        />
      </div>
    )
  }

  return <Outlet />
}
