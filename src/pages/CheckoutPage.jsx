import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLanguage } from '../hooks/useLanguage'
import { useCheckout } from '../hooks/useCheckout'
import { calculateQuote } from '../utils/money'
import CustomerForm from '../components/CustomerForm'
import CheckoutReview from '../components/CheckoutReview'
import OrderSummary from '../components/OrderSummary'
import OrderStorageNotice from '../components/OrderStorageNotice'
import CurrencyNote from '../components/CurrencyNote'
import RequestState from '../components/RequestState'
import styles from '../components/Orders.module.css'

// Keep customer review state local while the payment hook manages order persistence.
export default function CheckoutPage() {
  const { items } = useCart()
  const { t, currency } = useLanguage()
  const [customer, setCustomer] = useState({ name: '', email: '', address: '' })
  const [review, setReview] = useState(false)
  const payment = useCheckout()
  const quote = payment.submittedQuote || calculateQuote(items, currency)
  if (!items.length)
    return (
      <RequestState title={t('Your next great find belongs here')}>
        <Link to="/">{t('Back to the shop')}</Link>
      </RequestState>
    )
  return (
    <section className={styles.page}>
      <h1>{t('Demo checkout')}</h1>
      <p>{t('Simulated payment. No money will be charged.')}</p>
      <OrderStorageNotice />
      <div className={styles.columns}>
        {review ? (
          <CheckoutReview
            payment={payment}
            customer={customer}
            quote={quote}
            onEdit={() => setReview(false)}
          />
        ) : (
          <CustomerForm
            customer={customer}
            setCustomer={setCustomer}
            onReview={() => setReview(true)}
          />
        )}
        <div className={styles.checkoutSummary}>
          <OrderSummary quote={quote} />
          <CurrencyNote />
        </div>
      </div>
    </section>
  )
}
