import { useEffect, useRef } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import styles from './Orders.module.css'

// Disable edits and repeat submissions while the payment hook saves the order.
export default function CheckoutReview({ customer, quote, onEdit, payment }) {
  const { t } = useLanguage()
  const focusRef = useRef(null)
  useEffect(() => {
    focusRef.current?.focus()
  }, [])
  const { pay, processing, error } = payment
  return (
    <section className={styles.panel} aria-busy={processing}>
      <h2 ref={focusRef} tabIndex={-1}>
        {t('Review your order')}
      </h2>
      <p>
        {customer.name}
        <br />
        {customer.email}
      </p>
      <p className={styles.address}>{customer.address}</p>
      <p>{t('Simulated payment. No money will be charged.')}</p>
      {error && (
        <p className={styles.error} role="alert">
          {t(error)}
        </p>
      )}
      <div className={styles.actions}>
        <button disabled={processing} onClick={onEdit}>
          {t('Edit details')}
        </button>
        <button
          className={styles.primary}
          disabled={processing}
          onClick={() => pay(customer, quote)}
        >
          {t('Simulate payment and place order')}
        </button>
      </div>
      <p role="status">{processing && t('Processing demo payment …')}</p>
    </section>
  )
}
