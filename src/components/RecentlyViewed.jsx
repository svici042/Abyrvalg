import { useAdmin } from '../hooks/useAdmin'
import { applyOverride } from '../utils/admin'
import LocalDataControls from './LocalDataControls'
import { Link } from 'react-router-dom'
import { useRecentProducts } from '../hooks/useRecentProducts'
import { useLanguage } from '../hooks/useLanguage'
import ProductImage from './ProductImage'
import styles from './RecentlyViewed.module.css'

export default function RecentlyViewed({ excludeId }) {
  const { items } = useRecentProducts()
  const { t, formatPrice, productTitle } = useLanguage()
  // Omit the current product without removing it from the saved viewing history.
  const { config } = useAdmin()
  const visible = items
    .map((item) => applyOverride(item, config))
    .filter((item) => item.id !== excludeId && !item.hidden)
  return (
    <section className={styles.section} aria-label={t('Recently viewed')}>
      <h2>{t('Recently viewed')}</h2>
      <LocalDataControls />
      <ul className={styles.list}>
        {visible.map((item) => (
          <li key={item.id}>
            <Link to={`/products/${item.id}`}>
              <ProductImage src={item.thumbnail} title={productTitle(item)} />
              <span>{productTitle(item)}</span>
              <strong>{formatPrice(item.price)}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
