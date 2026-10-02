import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import AdminProductFilters from './AdminProductFilters'
import styles from '../pages/Admin.module.css'

const PAGE_SIZE = 12

// Filtering includes hidden products; pagination never changes the source selected for editing.
export default function AdminProductList({ products, onSelect }) {
  const { t, productTitle, formatPrice } = useLanguage()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [visibility, setVisibility] = useState('')
  const [page, setPage] = useState(1)
  const matching = products.filter(
    (product) =>
      (!category || product.category === category) &&
      (!visibility || Boolean(product.hidden) === (visibility === 'hidden')) &&
      `${productTitle(product)} ${product.id} ${product.brand || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE))
  if (page > pages) setPage(pages)
  const current = Math.min(page, pages)
  const visibleProducts = matching.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE,
  )
  function updateFilter(setter, value) {
    setter(value)
    setPage(1)
  }
  return (
    <>
      <AdminProductFilters
        {...{
          products,
          search,
          category,
          visibility,
          setSearch,
          setCategory,
          setVisibility,
          updateFilter,
        }}
      />
      <p role="status">{t('{count} products', { count: matching.length })}</p>
      <ul className={styles.list}>
        {visibleProducts.map((product) => (
          <li key={product.id}>
            <div>
              <strong>{productTitle(product)}</strong>
              <p>
                #{product.id} · {formatPrice(product.price)} ·{' '}
                {t(product.hidden ? 'Hidden' : 'Visible')}
              </p>
            </div>
            <div className={styles.actions}>
              <button onClick={() => onSelect(product.id)}>
                {t('Edit product')} #{product.id}
              </button>
              <Link to={`/products/${product.id}`}>{t('View in store')}</Link>
            </div>
          </li>
        ))}
      </ul>
      {!matching.length && <p>{t('No products found')}</p>}
      <nav aria-label={t('Product pages')} className={styles.actions}>
        <button disabled={current === 1} onClick={() => setPage(current - 1)}>
          {t('Previous')}
        </button>
        <span>{t('Page {page} of {pages}', { page: current, pages })}</span>
        <button
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
        >
          {t('Next')}
        </button>
      </nav>
    </>
  )
}
