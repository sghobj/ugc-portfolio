import { useCallback, useEffect, useState } from 'react'
import { fetchTestimonials } from '@/lib/api/testimonialsApi'
import type { Testimonial } from '@/types/portfolio'

type UseTestimonialsResult = {
  testimonials: Testimonial[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Failed to load testimonials.'
}

export const useTestimonials = (): UseTestimonialsResult => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchTestimonials()
      setTestimonials(response)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
      setTestimonials([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    testimonials,
    isLoading,
    error,
    reload,
  }
}
