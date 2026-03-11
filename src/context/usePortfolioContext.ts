import { useContext } from 'react'
import {
  PortfolioDataContext,
  type PortfolioDataContextValue,
} from '@/context/portfolioDataContext.shared'

export const usePortfolioContext = (): PortfolioDataContextValue => {
  const contextValue = useContext(PortfolioDataContext)

  if (!contextValue) {
    throw new Error('usePortfolioContext must be used inside PortfolioDataProvider')
  }

  return contextValue
}
