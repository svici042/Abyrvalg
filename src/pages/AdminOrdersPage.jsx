import LocalDataControls from '../components/LocalDataControls'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useOrders } from '../hooks/useOrders'
import { ORDER_STATUSES, STATUS_LABELS } from '../utils/orders'
import OrderList from '../components/OrderList'
import OrderDetails from '../components/OrderDetails'
import OrderAdminActions from '../components/OrderAdminActions'
import OrderStorageNotice from '../components/OrderStorageNotice'
import RequestState from '../components/RequestState'
import styles from '../components/Orders.module.css'

export default function AdminOrdersPage() {
  const { t } = useLanguage()
  const { orders } = useOrders()
  const { id } = useParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const selected = orders.find((order) => order.id === id)
  // Filter the complete local order list independently of the product API.
  const matching = orders
    .filter((order) => {
      const term = search.trim().toLowerCase()
      return (
        (!status || order.status === status) &&
        `${order.id} ${order.customer.name}`.toLowerCase().includes(term)
      )
    })
    // Show newest entries first without mutating the persisted order array.
    .toReversed()

  return (
    <section className={styles.page}>
      <h1>{t('Demo orders')}</h1>
      <p className={styles.notice}>
        {t(
          'This browser only. No real sign-in or access control. Use fictional details only.',
        )}
      </p>
      <LocalDataControls kind="orders" />
      <OrderStorageNotice />
      {id ? (
        <>
          <Link className={styles.back} to="/admin/orders">
            {t('Back to orders')}
          </Link>
          {selected ? (
            <>
              <OrderDetails order={selected} />
              <OrderAdminActions key={selected.id} order={selected} />
            </>
          ) : (
            <RequestState title={t('Order not found')}>
              {t(
                'The order may have been deleted or saved in another browser.',
              )}
            </RequestState>
          )}
        </>
      ) : (
        <>
          <div className={styles.filters}>
            <label htmlFor="order-search">
              {t('Search by order number or customer')}
              <input
                id="order-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label htmlFor="status-filter">
              {t('Fulfilment status')}
              <select
                id="status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">{t('All statuses')}</option>
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(STATUS_LABELS[value])}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {matching.length ? (
            <OrderList orders={matching} />
          ) : (
            <RequestState title={t('No orders to show')}>
              {t('No orders match your search or filter.')}
            </RequestState>
          )}
        </>
      )}
    </section>
  )
}
