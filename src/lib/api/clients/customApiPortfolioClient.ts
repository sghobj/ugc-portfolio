import { env } from '@/config/env'
import type { PortfolioClient } from '@/lib/api/clients/portfolioClient'
import type { PortfolioData, PortfolioItem, Service, Testimonial } from '@/types/portfolio'

export class CustomApiPortfolioClient implements PortfolioClient {
  private readonly baseUrl: string

  constructor(baseUrl = env.customApiBaseUrl) {
    if (!baseUrl) {
      throw new Error(
        'VITE_CUSTOM_API_URL is required when VITE_BACKEND_MODE=custom',
      )
    }

    this.baseUrl = baseUrl
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`)

    if (!response.ok) {
      throw new Error(
        `Custom API request failed (${response.status}) for ${path}`,
      )
    }

    return (await response.json()) as T
  }

  getPortfolioData = async (): Promise<PortfolioData> => {
    const [items, services, testimonials] = await Promise.all([
      this.fetchJson<PortfolioItem[]>('/portfolio-items'),
      this.fetchJson<Service[]>('/services'),
      this.fetchJson<Testimonial[]>('/testimonials'),
    ])

    return {
      items,
      services,
      testimonials,
    }
  }
}
