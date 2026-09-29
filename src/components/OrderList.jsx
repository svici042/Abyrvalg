import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { STATUS_LABELS } from '../utils/orders'
import styles from './Orders.module.css'

export default function OrderList({ orders }) {
  const { t, language, formatAmount } = useLanguage()
  return (
    <div className={styles.orderList}>
      {/* Preserve the filtered order sequence supplied by the administration page. */}
      {orders.map((order) => (
        <article className={styles.panel} key={order.id}>
          <h2 className={styles.orderId}>{order.id}</h2>
          <p>{order.customer.name}</p>
          <p>
            {t('Created')}:{' '}
            {new Date(order.createdAt).toLocaleString(
              language === 'nb' ? 'nb-NO' : 'en-US',
            )}
          </p>
          <p>
            <strong>{formatAmount(order.totalMinor, order.currency)}</strong>
          </p>
          <p>
            {t('Payment')}:{' '}
            <span className={styles.success}>{t('Simulated paid')}</span>
          </p>
          <p>
            {t('Fulfilment status')}: {t(STATUS_LABELS[order.status])}
          </p>
          <Link to={`/admin/orders/${order.id}`}>{t('Open order')}</Link>
        </article>
      ))}
    </div>
  )
}
