import { createContext } from 'react'
import type { PortfolioData } from '@/types/portfolio'

export type PortfolioDataContextValue = {
  data: PortfolioData | null
  isLoading: boolean
  error: string | null
}

export const PortfolioDataContext = createContext<PortfolioDataContextValue | undefined>(
  undefined,
)
