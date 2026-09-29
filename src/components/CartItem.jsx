import QuantityInput from './QuantityInput'
import { useLanguage } from '../hooks/useLanguage'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { calculateQuote } from '../utils/money'
import ProductImage from './ProductImage'
import styles from './CartItem.module.css'

// Use the shared quote calculation so line totals match checkout rounding.
export default function CartItem({ item }) {
  const { t, currency, formatPrice, formatAmount, productTitle } = useLanguage()
  const quote = calculateQuote([item], currency)
  const { setQuantity, removeProduct } = useCart()
  return (
    <article className={styles.item}>
      <Link to={`/products/${item.id}`}>
        <ProductImage src={item.thumbnail} title={productTitle(item)} />
      </Link>
      <div className={styles.details}>
        <Link to={`/products/${item.id}`}>
          <h2>{productTitle(item)}</h2>
        </Link>
        <p>
          {formatPrice(item.price)} {t('each')}
        </p>
        <QuantityInput
          value={item.quantity}
          max={item.stock}
          title={productTitle(item)}
          onCommit={(quantity) => setQuantity(item.id, quantity)}
        />
        <small id={`stock-${item.id}`}>
          {t('Maximum {count} available in stock.', { count: item.stock })}
        </small>
      </div>
      <div className={styles.total}>
        <strong>{formatAmount(quote.totalMinor)}</strong>
        <button
          onClick={() => removeProduct(item.id)}
          aria-label={t('Remove {title}', { title: productTitle(item) })}
        >
          {t('Remove')}
        </button>
      </div>
    </article>
  )
}
