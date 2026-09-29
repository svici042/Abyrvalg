import { useLanguage } from '../hooks/useLanguage'
import styles from './Orders.module.css'

export default function OrderSummary({ quote }) {
  const { t, formatAmount, productTitle } = useLanguage()
  // The caller supplies either the transaction snapshot or a converted display quote.
  return (
    <section className={styles.panel} aria-label={t('Summary')}>
      <h2>{t('Summary')}</h2>
      <ul className={styles.lines}>
        {/* Unit prices, line totals and the grand total all use the same supplied quote. */}
        {quote.lines.map((line) => (
          <li key={line.productId}>
            <div>
              <strong>{productTitle(line)}</strong>
              <small>
                {t('Quantity')}: {line.quantity} ·{' '}
                {formatAmount(line.unitMinor, quote.currency)} {t('each')}
              </small>
            </div>
            <strong>{formatAmount(line.totalMinor, quote.currency)}</strong>
          </li>
        ))}
      </ul>
      <p className={styles.total}>
        <span>{t('Total')}</span>
        <strong>{formatAmount(quote.totalMinor, quote.currency)}</strong>
      </p>
    </section>
  )
}
