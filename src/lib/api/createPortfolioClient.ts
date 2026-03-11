import { env } from '@/config/env'
import { CustomApiPortfolioClient } from '@/lib/api/clients/customApiPortfolioClient'
import { MockPortfolioClient } from '@/lib/api/clients/mockPortfolioClient'
import type { PortfolioClient } from '@/lib/api/clients/portfolioClient'
import { StrapiPortfolioClient } from '@/lib/api/clients/strapiPortfolioClient'

let portfolioClient: PortfolioClient | null = null

export const createPortfolioClient = (): PortfolioClient => {
  if (portfolioClient) {
    return portfolioClient
  }

  switch (env.backendMode) {
    case 'strapi':
      portfolioClient = new StrapiPortfolioClient()
      break
    case 'custom':
      portfolioClient = new CustomApiPortfolioClient()
      break
    case 'mock':
    default:
      portfolioClient = new MockPortfolioClient()
      break
  }

  return portfolioClient
}
