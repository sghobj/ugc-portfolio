import type { PortfolioData } from '@/types/portfolio'

export interface PortfolioClient {
  getPortfolioData: () => Promise<PortfolioData>
}
