import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import styles from './CartToast.module.css'
export default function CartToast({ product, quantity, onClose, trigger }) {
  const { t, productTitle } = useLanguage()
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (hovered || focused) return
    const timer = setTimeout(onClose, 4500)
    return () => clearTimeout(timer)
  }, [hovered, focused, onClose])
  function dismiss() {
    // Restore keyboard focus before dismissing a focused toast.
    if (ref.current.contains(document.activeElement)) {
      if (trigger.current && !trigger.current.disabled) trigger.current.focus()
      else document.getElementById('main')?.focus()
    }
    onClose()
  }
  return (
    <aside
      ref={ref}
      className={styles.toast}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false)
      }}
    >
      <p role="status" aria-live="polite">
        {t(
          quantity === 1
            ? 'Added 1 item: {title}.'
            : 'Added {count} items: {title}.',
          { count: quantity, title: productTitle(product) },
        )}
      </p>
      <Link to="/cart">{t('View cart')}</Link>
      <button type="button" onClick={dismiss}>
        {t('Close')}
      </button>
    </aside>
  )
}
