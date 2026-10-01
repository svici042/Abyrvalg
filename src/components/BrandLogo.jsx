import { useStoreContent } from '../hooks/useStoreContent'
import { useImageSource } from '../hooks/useImageSource'
import { useState } from 'react'
import logo from '../assets/brand-logo-display.webp'
import styles from './BrandLogo.module.css'

// Keep the original asset proportions; decorative instances rely on the parent link label.
export default function BrandLogo({ compact = false, decorative = false }) {
  const { content, storeText } = useStoreContent()
  const src = useImageSource(content.logo)
  const [failed, setFailed] = useState('')
  if (content.storeName)
    return (
      <span className={styles.brand}>
        {src && failed !== src && (
          <img
            referrerPolicy="no-referrer"
            className={compact ? styles.compact : styles.logo}
            src={src}
            alt=""
            onError={() => setFailed(src)}
          />
        )}
        {storeText('storeName')}
      </span>
    )
  return (
    <img
      referrerPolicy="no-referrer"
      className={compact ? styles.compact : styles.logo}
      src={src && failed !== src ? src : logo}
      onError={() => setFailed(src)}
      alt={decorative ? '' : storeText('storeName')}
      width="564"
      height="160"
    />
  )
}
