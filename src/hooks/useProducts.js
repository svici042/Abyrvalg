import { useQuery } from '@tanstack/react-query'
import { getCategories, getProduct, getProducts } from '../api/products'

export function useProducts({ search, category, page, sort }) {
  // Include every filter in the cache key and cancel obsolete requests through the signal.
  return useQuery({
    queryKey: ['products', { search, category, page, sort }],
    queryFn: ({ signal }) =>
      getProducts({ search, category, page, sort, signal }),
  })
}

export function useCategories() {
  // Share category data between filters, cards and details through one cache key.
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => getCategories(signal),
    staleTime: 10 * 60 * 1000,
  })
}

export function useProduct(id) {
  // Allow manual retries while keeping missing products as a distinct state.
  return useQuery({
    queryKey: ['product', id],
    queryFn: ({ signal }) => getProduct(id, signal),
    retry: false,
  })
}
