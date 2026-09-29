import { Link, useParams } from 'react-router-dom'
import { useOrders } from '../hooks/useOrders'
import { useLanguage } from '../hooks/useLanguage'
import OrderDetails from '../components/OrderDetails'
import OrderStorageNotice from '../components/OrderStorageNotice'
import RequestState from '../components/RequestState'
import styles from '../components/Orders.module.css'

// Resolve confirmations from saved local orders, including direct visits and refreshes.
export default function OrderConfirmationPage() {
  const { id } = useParams()
  const { orders } = useOrders()
  const { t } = useLanguage()
  const order = orders.find((item) => item.id === id)
  return (
    <section className={styles.page}>
      <OrderStorageNotice />
      {order ? (
        <>
          <h1>{t('Your order is confirmed')}</h1>
          <p>{t('Simulated payment. No money will be charged.')}</p>
          <OrderDetails order={order} />
        </>
      ) : (
        <RequestState title={t('Order not found')}>
          {t('The order may have been deleted or saved in another browser.')}
        </RequestState>
      )}
      <Link className={styles.back} to="/">
        {t('Back to the shop')}
      </Link>
    </section>
  )
}
