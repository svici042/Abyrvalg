import { useContext, useEffect } from 'react'
import { RecentContext } from '../context/RecentContext'

export function useRecentProducts(product) {
  const context = useContext(RecentContext)
  const { remember } = context
  useEffect(() => {
    // Record a visit only after the product has loaded successfully.
    if (product) remember(product)
  }, [product, remember])
  return context
}
