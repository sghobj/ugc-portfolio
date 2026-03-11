import type { ReactNode } from 'react'
import { usePortfolioData } from '@/hooks/usePortfolioData'
import { PortfolioDataContext } from '@/context/portfolioDataContext.shared'

type PortfolioDataProviderProps = {
  children: ReactNode
}

export const PortfolioDataProvider = ({ children }: PortfolioDataProviderProps) => {
  const value = usePortfolioData()
  return <PortfolioDataContext.Provider value={value}>{children}</PortfolioDataContext.Provider>
}
