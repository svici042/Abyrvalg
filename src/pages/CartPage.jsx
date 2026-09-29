import { useLanguage } from '../hooks/useLanguage'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import CartItem from '../components/CartItem'
import RequestState from '../components/RequestState'
import { calculateQuote } from '../utils/money'
import CurrencyNote from '../components/CurrencyNote'
import styles from './CartPage.module.css'

// Recalculate totals from stored base prices when the selected currency changes.
export default function CartPage() {
  const { t, currency, formatAmount } = useLanguage()
  const { items, totalQuantity } = useCart()
  const quote = calculateQuote(items, currency)
  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>{t('YOUR SELECTED FAVOURITES')}</p>
      <h1>
        {t('Your cart')}
        <span> ({totalQuantity})</span>
      </h1>
      {items.length === 0 ? (
        <RequestState title={t('Your next great find belongs here')}>
          <Link to="/">{t('Explore products and find your favourite')} →</Link>
        </RequestState>
      ) : (
        <div className={styles.columns}>
          <div>
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
            <Link className={styles.back} to="/">
              ← {t('Keep exploring')}
            </Link>
          </div>
          <aside className={styles.summary}>
            <h2>{t('Summary')}</h2>
            <p>
              <span>{t('Number of items')}</span>
              <strong>{totalQuantity}</strong>
            </p>
            <p className={styles.total}>
              <span>{t('Total')}</span>
              <strong>{formatAmount(quote.totalMinor)}</strong>
            </p>
            <Link className={styles.checkout} to="/checkout">
              {t('Go to demo checkout')}
            </Link>
            <CurrencyNote />
            <small>{t('Simulated payment. No money will be charged.')}</small>
          </aside>
        </div>
      )}
    </section>
  )
}
