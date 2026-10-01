import { useLanguage } from '../hooks/useLanguage'
import { useImageSource } from '../hooks/useImageSource'
import { useState } from 'react'
import styles from './ProductImage.module.css'

// Replace missing or failed images with an accessible translated fallback.
export default function ProductImage({ src, title, eager = false }) {
  const { t } = useLanguage()
  const imageSrc = useImageSource(src)
  const [failed, setFailed] = useState('')
  return (
    <div className={styles.frame}>
      {imageSrc && failed !== imageSrc ? (
        <img
          referrerPolicy="no-referrer"
          src={imageSrc}
          alt={title}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(imageSrc)}
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
