import { useCallback, useRef, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useCart } from '../hooks/useCart'
import QuantityDialog from './QuantityDialog'
import CartToast from './CartToast'
import styles from './AddToCartButton.module.css'
export default function AddToCartButton({ product }) {
  const { t } = useLanguage()
  const { items } = useCart()
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(null)
  const trigger = useRef(null)
  const clear = useCallback(() => setAdded(null), [])
  const quantity = items.find((item) => item.id === product.id)?.quantity || 0
  const unavailable = !product.stock || quantity >= product.stock
  return (
    <div className={styles.wrapper}>
      <button
        ref={trigger}
        className={styles.button}
        onClick={() => setOpen(true)}
        disabled={unavailable}
      >
        {t(
          product.stock < 1
            ? 'Out of stock'
            : unavailable
              ? 'Stock limit reached'
              : 'Add to cart',
        )}
      </button>
      {open && (
        <QuantityDialog
          product={product}
          onClose={() => setOpen(false)}
          onAdded={(count) => setAdded({ count, key: Date.now() })}
        />
      )}
      {added && (
        <CartToast
          key={added.key}
          product={product}
          quantity={added.count}
          onClose={clear}
          trigger={trigger}
        />
      )}
    </div>
  )
}
