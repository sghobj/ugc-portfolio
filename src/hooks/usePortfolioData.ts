import { useEffect, useState } from 'react'
import { createPortfolioClient } from '@/lib/api/createPortfolioClient'
import type { PortfolioData } from '@/types/portfolio'

type UsePortfolioDataResult = {
  data: PortfolioData | null
  isLoading: boolean
  error: string | null
}

const client = createPortfolioClient()

export const usePortfolioData = (): UsePortfolioDataResult => {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const load = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await client.getPortfolioData()

        if (isActive) {
          setData(response)
        }
      } catch (unknownError) {
        if (isActive) {
          setError(
            unknownError instanceof Error
              ? unknownError.message
              : 'Failed to load portfolio data.',
          )
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [])

  return { data, isLoading, error }
}
