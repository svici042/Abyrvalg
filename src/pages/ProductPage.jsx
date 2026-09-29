import { useLanguage } from '../hooks/useLanguage'
import { Link, useParams } from 'react-router-dom'
import { useProduct } from '../hooks/useProducts'
import ProductGallery from '../components/ProductGallery'
import RecentlyViewed from '../components/RecentlyViewed'
import { useRecentProducts } from '../hooks/useRecentProducts'
import RequestState from '../components/RequestState'
import AddToCartButton from '../components/AddToCartButton'
import { useCategoryNames } from '../hooks/useCategoryNames'
import styles from './ProductPage.module.css'

export default function ProductPage() {
  const { t, formatPrice, productTitle, productDescription } = useLanguage()
  const { categoryName } = useCategoryNames()
  const { id } = useParams()
  const query = useProduct(id)
  useRecentProducts(query.data)
  // Keep loading, missing products and retryable request failures distinct.
  if (query.isPending)
    return <RequestState mainHeading title={t('Loading product …')} loading />
  if (query.error?.response?.status === 404) {
    return (
      <RequestState mainHeading title={t('Product not found')}>
        <Link to="/">{t('Explore all products')}</Link>
      </RequestState>
    )
  }
  if (query.isError)
    return (
      <RequestState
        mainHeading
        title={t('Could not load product')}
        onRetry={() => query.refetch()}
      >
        {t('Please try again in a moment.')}
      </RequestState>
    )
  const product = query.data
  return (
    <>
      <nav className={styles.breadcrumb} aria-label={t('Breadcrumbs')}>
        <Link to="/">{t('All products')}</Link>
        <span>/</span>
        <span>{productTitle(product)}</span>
      </nav>
      <article className={styles.product}>
        <ProductGallery key={product.id} product={product} />
        <div className={styles.details}>
          <p className={styles.category}>{categoryName(product.category)}</p>
          <h1>{productTitle(product)}</h1>
          <p className={styles.rating}>
            ★ {product.rating ?? '–'} / 5 <span>{t('Product rating')}</span>
          </p>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          <p className={styles.description}>{productDescription(product)}</p>
          <dl>
            <div>
              <dt>{t('Brand')}</dt>
              <dd>{product.brand || t('Not provided')}</dd>
            </div>
            <div>
              <dt>{t('Category')}</dt>
              <dd>{categoryName(product.category)}</dd>
            </div>
            <div>
              <dt>{t('Availability')}</dt>
              <dd>
                {product.stock > 0
                  ? t('{count} in stock', { count: product.stock })
                  : t('Out of stock')}
              </dd>
            </div>
          </dl>
          <AddToCartButton product={product} />
          <p className={styles.note}>
            {t('Simulated payment. No money will be charged.')}
          </p>
        </div>
      </article>
      <RecentlyViewed excludeId={product.id} />
    </>
  )
}
