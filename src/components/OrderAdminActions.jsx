import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useOrders } from '../hooks/useOrders'
import { ORDER_STATUSES, STATUS_LABELS } from '../utils/orders'
import styles from './Orders.module.css'

export default function OrderAdminActions({ order }) {
  const statusId = useId()
  const { t } = useLanguage()
  const { updateStatus, deleteOrder } = useOrders()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState('')

  function changeStatus(status) {
    // Fulfilment changes and cancellations never alter the separate payment status.
    try {
      updateStatus(order.id, status)
      setMessage('Order updated.')
    } catch {
      setMessage('Could not save the order change. Try again.')
    }
  }

  // Leave the detail page only after local deletion succeeds.
  function remove() {
    try {
      deleteOrder(order.id)
      navigate('/admin/orders', { replace: true })
    } catch {
      setMessage('Could not save the order change. Try again.')
    }
  }

  return (
    <section className={styles.panel}>
      <label htmlFor={statusId}>{t('Fulfilment status')}</label>
      <select
        id={statusId}
        name="fulfilmentStatus"
        value={order.status}
        onChange={(event) => changeStatus(event.target.value)}
      >
        {/* Store stable status codes while translating their visible labels. */}
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(STATUS_LABELS[status])}
          </option>
        ))}
      </select>
      <p>
        {t(
          'Cancellation only changes fulfilment status. No real payment or refund takes place.',
        )}
      </p>
      <p role="status">{message && t(message)}</p>
      <button className={styles.danger} onClick={() => setConfirm(true)}>
        {t('Delete order')}
      </button>
      {confirm && (
        <div className={styles.error}>
          <p>{t('Permanently delete this order from this browser?')}</p>
          <div className={styles.actions}>
            <button className={styles.danger} onClick={remove}>
              {t('Yes, delete order')}
            </button>
            <button onClick={() => setConfirm(false)}>{t('Cancel')}</button>
          </div>
        </div>
      )}
    </section>
  )
}
