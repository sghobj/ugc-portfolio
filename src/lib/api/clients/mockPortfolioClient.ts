import { mockPortfolioData } from '@/data/mockPortfolioData'
import type { PortfolioClient } from '@/lib/api/clients/portfolioClient'
import type { PortfolioData } from '@/types/portfolio'

export class MockPortfolioClient implements PortfolioClient {
  getPortfolioData = async (): Promise<PortfolioData> => {
    return Promise.resolve(mockPortfolioData)
  }
}
