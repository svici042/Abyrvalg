import { useLanguage } from '../hooks/useLanguage'
import { STATUS_LABELS } from '../utils/orders'
import OrderSummary from './OrderSummary'
import styles from './Orders.module.css'

// Keep transaction facts from the saved order, even when the summary uses a converted quote.
export default function OrderDetails({ order, quote = order }) {
  const { t, language } = useLanguage()
  return (
    <div className={styles.columns}>
      <section className={styles.panel}>
        <h2>{t('Order number')}</h2>
        <p className={styles.orderId}>{order.id}</p>
        <dl className={styles.facts}>
          <dt>{t('Created')}</dt>
          <dd>
            {new Date(order.createdAt).toLocaleString(
              language === 'nb' ? 'nb-NO' : 'en-US',
            )}
          </dd>
          <dt>{t('Payment')}</dt>
          <dd className={styles.success}>{t('Simulated paid')}</dd>
          <dt>{t('Fulfilment status')}</dt>
          <dd>{t(STATUS_LABELS[order.status])}</dd>
          <dt>{t('Customer')}</dt>
          <dd>
            {order.customer.name}
            <br />
            {order.customer.email}
          </dd>
          <dt>{t('Delivery address')}</dt>
          <dd className={styles.address}>{order.customer.address}</dd>
        </dl>
        <small>
          {t(
            'Transaction rate: 1 USD = {rate} {currency}. Amounts were fixed at checkout.',
            { rate: order.rate, currency: order.currency },
          )}
        </small>
      </section>
      <OrderSummary quote={quote} />
    </div>
  )
}
