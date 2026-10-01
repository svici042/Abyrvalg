import { useLanguage } from '../hooks/useLanguage'
import ProductCard from './ProductCard'
import Pagination from './Pagination'
import SortSelect from './SortSelect'
import RequestState from './RequestState'
import styles from '../pages/CataloguePage.module.css'

// Render result metadata, request states and paginated product cards together.
export default function CatalogueResults({
  heading,
  currency,
  query,
  page,
  pageCount,
  sort,
  hasFilters,
  onSortChange,
  onClearFilters,
  onPageChange,
}) {
  const { t } = useLanguage()

  return (
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
      <SortSelect value={sort} onChange={onSortChange} />
      {hasFilters && (
        <button className={styles.clear} onClick={onClearFilters}>
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
        <Pagination page={page} pageCount={pageCount} onChange={onPageChange} />
      )}
    </section>
  )
}
