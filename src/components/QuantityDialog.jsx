import { useRef, useState } from 'react'
import Modal from './Modal'
import QuantityInput from './QuantityInput'
import { useLanguage } from '../hooks/useLanguage'
import { useCart } from '../hooks/useCart'
import { calculateQuote } from '../utils/money'
export default function QuantityDialog({ product, onClose, onAdded }) {
  const { t, currency, formatAmount, formatPrice, productTitle } = useLanguage()
  const { items, addProduct } = useCart()
  const max = Math.max(
    0,
    product.stock -
      (items.find((item) => item.id === product.id)?.quantity || 0),
  )
  const [quantity, setQuantity] = useState(1)
  const [draftQuantity, setDraftQuantity] = useState(1)
  const valid =
    draftQuantity !== null && draftQuantity >= 1 && draftQuantity <= max
  const locked = useRef(false)
  const quote = calculateQuote(
    [{ ...product, quantity: draftQuantity || 1 }],
    currency,
  )
  function confirm() {
    // Block duplicate submissions before the dialog can unmount.
    if (locked.current || !valid) return
    locked.current = true
    const added = addProduct(product, draftQuantity)
    onClose()
    if (added > 0) onAdded(added)
  }
  return (
    <Modal title={t('Choose quantity')} onClose={onClose}>
      <h3>{productTitle(product)}</h3>
      <p>
        {formatPrice(product.price)} {t('each')}
      </p>
      <p>{t('Available to add: {count}', { count: max })}</p>
      <QuantityInput
        value={quantity}
        max={max}
        onCommit={setQuantity}
        onDraftChange={setDraftQuantity}
        title={productTitle(product)}
      />
      <p>
        {t('Selected subtotal')}:{' '}
        <strong>{valid ? formatAmount(quote.totalMinor) : '—'}</strong>
      </p>
      <button data-primary type="button" disabled={!valid} onClick={confirm}>
        {t('Confirm addition')}
      </button>
      <button type="button" onClick={onClose}>
        {t('Cancel')}
      </button>
    </Modal>
  )
}
