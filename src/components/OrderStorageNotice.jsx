import { useState } from 'react'
import { useOrders } from '../hooks/useOrders'
import { useLanguage } from '../hooks/useLanguage'
import styles from './Orders.module.css'

// Offer a non-destructive reload before allowing a confirmed storage reset.
export default function OrderStorageNotice() {
  const { error, reload, resetInvalid } = useOrders()
  const { t } = useLanguage()
  const [confirm, setConfirm] = useState(false)
  if (!error) return null
  return (
    <div className={styles.error} role="alert">
      <p>{t(error)}</p>
      <button onClick={reload}>{t('Reload saved orders')}</button>
      <button onClick={() => setConfirm(true)}>
        {t('Reset invalid order data')}
      </button>
      {confirm && (
        <div>
          <p>{t('Delete invalid order data? This cannot be undone.')}</p>
          <button
            onClick={() => {
              resetInvalid()
              setConfirm(false)
            }}
          >
            {t('Yes, delete order')}
          </button>
          <button onClick={() => setConfirm(false)}>{t('Cancel')}</button>
        </div>
      )}
    </div>
  )
}
