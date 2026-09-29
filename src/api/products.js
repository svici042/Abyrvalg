import axios from 'axios'
import { SORT_OPTIONS, validSort } from '../utils/sorting'

const client = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 15000,
})

export const PAGE_SIZE = 12

export async function getProducts({ search, category, page, sort, signal }) {
  const sorting = SORT_OPTIONS[validSort(sort)]
  // Search and category use separate endpoints, both with server-side pagination.
  let endpoint = '/products'
  if (search) endpoint = '/products/search'
  else if (category)
    endpoint = `/products/category/${encodeURIComponent(category)}`

  const { data } = await client.get(endpoint, {
    params: {
      limit: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      sortBy: sorting.sortBy,
      order: sorting.order,
      ...(search ? { q: search } : {}),
    },
    signal,
  })
  return data
}

export async function getCategories(signal) {
  // Fetch names and slugs dynamically so new categories require no code changes.
  const { data } = await client.get('/products/categories', { signal })
  return data
}

export async function getProduct(id, signal) {
  // Fetch details separately so direct product links work without loading the catalogue.
  const { data } = await client.get(`/products/${encodeURIComponent(id)}`, {
    signal,
  })
  return data
}
