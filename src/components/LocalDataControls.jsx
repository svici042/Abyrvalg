import { useState } from 'react'
import { useRecentProducts } from '../hooks/useRecentProducts'
import { useOrders } from '../hooks/useOrders'
import { useLanguage } from '../hooks/useLanguage'
import Modal from './Modal'

// Contextual controls share confirmation and keep failures inside the active dialog.
export default function LocalDataControls({ kind = 'history' }) {
  const { enabled, enable, clear } = useRecentProducts()
  const { deleteAll } = useOrders()
  const { t } = useLanguage()
  const [pending, setPending] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  function request(action) {
    setMessage('')
    setError('')
    setPending(action)
  }
  function confirm() {
    try {
      if (pending === 'orders') deleteAll()
      else if (pending === 'disable') {
        if (!enable(false)) throw new Error('Storage')
      } else if (!clear()) throw new Error('Storage')
      setMessage('Local data updated.')
      setPending('')
    } catch {
      setError('Could not delete local data. Try again.')
    }
  }
  return (
    <>
      {kind === 'history' ? (
        <details>
          <summary>{t('History preferences')}</summary>
          <p>
            {t(
              'Recently viewed history is optional. Enable it to remember up to six products in this browser. Disabling deletes the history.',
            )}
          </p>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => {
                if (!event.target.checked) request('disable')
                else if (!enable(true))
                  setMessage('Could not save history preferences. Try again.')
              }}
            />
            {t('Remember recently viewed products')}
          </label>
          <p>
            <button onClick={() => request('history')}>
              {t('Delete recent history')}
            </button>
          </p>
        </details>
      ) : (
        <p>
          <button onClick={() => request('orders')}>
            {t('Delete all demo orders')}
          </button>
        </p>
      )}
      {message && <p role="status">{t(message)}</p>}
      {pending && (
        <Modal title={t('Confirm deletion')} onClose={() => setPending('')}>
          <p>
            {t(
              pending === 'orders'
                ? 'Delete all demo orders from this browser? This cannot be undone.'
                : 'Delete recent history from this browser?',
            )}
          </p>
          {error && <p role="alert">{t(error)}</p>}
          <button onClick={confirm}>{t('Confirm deletion')}</button>{' '}
          <button onClick={() => setPending('')}>{t('Cancel')}</button>
        </Modal>
      )}
    </>
  )
}
