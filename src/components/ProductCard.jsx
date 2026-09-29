import { Link } from 'react-router-dom'
import ProductImage from './ProductImage'
import { useLanguage } from '../hooks/useLanguage'
import { useCategoryNames } from '../hooks/useCategoryNames'
import styles from './ProductCard.module.css'

// Link each catalogue item to its independently loadable product detail route.
export default function ProductCard({ product }) {
  const { t, formatPrice, productTitle } = useLanguage()
  const { categoryName } = useCategoryNames()
  return (
    <article className={styles.card}>
      <Link to={`/products/${product.id}`}>
        <div className={styles.image}>
          <ProductImage src={product.thumbnail} title={productTitle(product)} />
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
        </div>
        <div className={styles.details}>
          <span className={styles.category}>
            {categoryName(product.category)}
          </span>
          <h3>{productTitle(product)}</h3>
          <div className={styles.bottom}>
            <strong>{formatPrice(product.price)}</strong>
            <span
              aria-label={t('Rating {rating} out of 5', {
                rating: product.rating,
              })}
            >
              ★ {product.rating}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
