import { SORT_OPTIONS, validSort } from '../utils/sorting.js'
import axios from 'axios'

const client = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 15000,
})

export const PAGE_SIZE = 12

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

// Read the entire original catalogue once; local overrides are applied by consumers.
export async function getAllProducts(signal) {
  const { data } = await client.get('/products', {
    params: { limit: 1000, skip: 0 },
    signal,
  })
  const products = [...data.products]
  while (products.length < data.total) {
    const next = await client.get('/products', {
      params: { limit: 1000, skip: products.length },
      signal,
    })
    if (!next.data.products.length) throw Error('Incomplete catalogue')
    products.push(...next.data.products)
  }
  return products
}

// Normal storefront requests paginate and sort on the API, before returning a page.
export async function getProducts(
  { search = '', category = '', page = 1, sort = 'default' } = {},
  signal,
) {
  const endpoint = search
    ? '/products/search'
    : category
      ? `/products/category/${encodeURIComponent(category)}`
      : '/products'
  const { sortBy, order } = SORT_OPTIONS[validSort(sort)]
  const { data } = await client.get(endpoint, {
    params: {
      limit: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      ...(search ? { q: search } : {}),
      ...(sortBy ? { sortBy, order } : {}),
    },
    signal,
  })
  return data
}
