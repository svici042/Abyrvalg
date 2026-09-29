import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useCatalogue } from '../hooks/useCatalogue'
import { useLanguage } from '../hooks/useLanguage'
import CatalogueHero from '../components/CatalogueHero'
import { useCategoryNames } from '../hooks/useCategoryNames'
import CategoryFilter from '../components/CategoryFilter'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'
import SortSelect from '../components/SortSelect'
import RecentlyViewed from '../components/RecentlyViewed'
import RequestState from '../components/RequestState'
import styles from './CataloguePage.module.css'

// Compose URL-driven filters, request states and server-paginated product results.
export default function CataloguePage() {
  const { t, currency } = useLanguage()
  const {
    search,
    category,
    page,
    sort,
    query,
    pageCount,
    changePage,
    changeSort,
    setParams,
  } = useCatalogue()
  const { categoryName } = useCategoryNames()
  const { key, hash } = useLocation()
  useEffect(() => {
    // Direct anchors need the loaded catalogue height; history entries use router restoration.
    if (key === 'default' && hash === '#catalogue' && query.isSuccess)
      document.getElementById('catalogue')?.scrollIntoView()
  }, [key, hash, query.isSuccess])

  let heading = t('All products')
  if (category) heading = categoryName(category)
  if (search) heading = t('Results for “{search}”', { search })

  return (
    <>
      <CatalogueHero />
      <div tabIndex={-1} id="catalogue" className={styles.catalogue}>
        <CategoryFilter
          category={category}
          onChange={(slug) =>
            setParams(
              {
                ...(slug ? { category: slug } : {}),
                ...(sort !== 'default' ? { sort } : {}),
              },
              { preventScrollReset: true },
            )
          }
        />
        <section className={styles.results} aria-label={t('Products')}>
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>{t('FIND YOUR FAVOURITE')}</p>
              <h2>{heading}</h2>
            </div>
            {query.data && (
              <span>
                {t('{count} products · {currency}', {
                  count: query.data.total,
                  currency,
                })}
              </span>
            )}
          </div>
          <SortSelect value={sort} onChange={changeSort} />
          {(search || category) && (
            <button
              className={styles.clear}
              onClick={() => setParams({}, { preventScrollReset: true })}
            >
              {t('Clear filters')} ×
            </button>
          )}
          {query.isPending && (
            <RequestState title={t('Loading products …')} loading />
          )}
          {query.isError && (
            <RequestState
              title={t('We could not load the products')}
              onRetry={() => query.refetch()}
            >
              {t('Check your connection and try again.')}
            </RequestState>
          )}
          {query.isSuccess && query.data.total === 0 && (
            <RequestState title={t('No products found')}>
              {t('Try another search or choose “All products”.')}
            </RequestState>
          )}
          {query.isSuccess && page <= pageCount && (
            <div className={styles.grid}>
              {query.data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {query.isSuccess && page <= pageCount && (
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={changePage}
            />
          )}
        </section>
      </div>
      <RecentlyViewed />
    </>
  )
}
