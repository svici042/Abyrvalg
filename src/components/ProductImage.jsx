import { useLanguage } from '../hooks/useLanguage'
import { useState } from 'react'
import styles from './ProductImage.module.css'

// Replace missing or failed images with an accessible translated fallback.
export default function ProductImage({ src, title, eager = false }) {
  const { t } = useLanguage()
  const [failed, setFailed] = useState(false)
  return (
    <div className={styles.frame}>
      {src && !failed ? (
        <img
          src={src}
          alt={title}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={styles.fallback}
          role="img"
          aria-label={`${title} – ${t('Image unavailable')}`}
        >
          <span aria-hidden="true">◇</span>
          <small>{t('Image unavailable')}</small>
        </div>
      )}
    </div>
  )
}
