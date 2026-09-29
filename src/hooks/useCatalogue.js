import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PAGE_SIZE } from '../api/products'
import { useProducts } from './useProducts'
import { parsePage } from '../utils/format'
import { validSort } from '../utils/sorting'

export function useCatalogue() {
  const [params, setParams] = useSearchParams()
  const search = (params.get('q') || '').trim()
  const category = search ? '' : params.get('category') || ''
  const page = parsePage(params.get('page'))
  const sort = validSort(params.get('sort'))
  const query = useProducts({ search, category, page, sort })
  const pageCount = Math.ceil((query.data?.total || 0) / PAGE_SIZE)

  // Normalize invalid pages without adding a browser history entry.
  useEffect(() => {
    const nextPage = query.data ? Math.min(page, Math.max(1, pageCount)) : page
    if (
      (params.has('page') && params.get('page') !== String(nextPage)) ||
      (search && params.has('category'))
    ) {
      const next = new URLSearchParams(params)
      next.set('page', String(nextPage))
      if (search) next.delete('category')
      setParams(next, { replace: true, preventScrollReset: true })
    }
  }, [params, page, pageCount, query.data, search, setParams])

  function changePage(nextPage) {
    // Preserve search and category filters when changing pages.
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    setParams(next, { preventScrollReset: true })
  }

  function changeSort(value) {
    // Sort the complete API result and return to its first page.
    const next = new URLSearchParams(params)
    next.delete('page')
    if (value === 'default') next.delete('sort')
    else next.set('sort', validSort(value))
    setParams(next, { preventScrollReset: true })
  }

  return {
    search,
    category,
    page,
    sort,
    query,
    pageCount,
    changePage,
    changeSort,
    setParams,
  }
}
