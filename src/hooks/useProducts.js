import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getAllProducts,
  getCategories,
  getProduct,
  getProducts,
} from '../api/products'
import { useAdmin } from '../hooks/useAdmin'
import { useLanguage } from './useLanguage'
import { applyOverride, selectProducts } from '../utils/admin'
export function useFullCatalogue(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['catalogue-source'],
    queryFn: ({ signal }) => getAllProducts(signal),
  })
}
export function useProducts(options) {
  const { config } = useAdmin()
  const { language } = useLanguage()
  const localMode = Object.keys(config.products).length > 0
  const catalogue = useFullCatalogue(localMode)
  const page = useQuery({
    queryKey: ['products', options],
    queryFn: ({ signal }) => getProducts(options, signal),
    enabled: !localMode,
  })
  // DummyJSON cannot sort or filter local edits. Never apply them to a partial page.
  return localMode
    ? {
        ...catalogue,
        data: catalogue.data
          ? selectProducts(catalogue.data, config, { ...options, language })
          : undefined,
      }
    : page
}
export function useCategories() {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => getCategories(signal),
    staleTime: 600000,
  })
  const { config } = useAdmin()
  const slugs = [
    ...new Set(
      Object.values(config.products)
        .filter((product) => !product.hidden)
        .map((product) => product.category),
    ),
  ]
  return {
    ...query,
    data: query.data
      ? [
          ...query.data,
          ...slugs
            .filter(
              (slug) => !query.data.some((category) => category.slug === slug),
            )
            .map((slug) => ({ slug, name: slug })),
        ]
      : undefined,
  }
}
export function useProduct(id) {
  const { config } = useAdmin()
  const query = useQuery({
    queryKey: ['product', id],
    queryFn: ({ signal }) => getProduct(id, signal),
    retry: false,
  })
  const product = useMemo(
    () => (query.data ? applyOverride(query.data, config) : undefined),
    [query.data, config],
  )
  if (product?.hidden)
    return {
      ...query,
      data: undefined,
      isError: true,
      error: { response: { status: 404 } },
    }
  return { ...query, data: product }
}
