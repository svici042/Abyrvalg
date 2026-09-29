import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import ProductImage from './ProductImage'
import styles from './ProductGallery.module.css'

export default function ProductGallery({ product }) {
  const { t, productTitle } = useLanguage()
  // Remove missing and repeated URLs before building slides and thumbnail controls.
  const images = [...new Set((product.images || []).filter(Boolean))]
  if (!images.length && product.thumbnail) images.push(product.thumbnail)
  const [index, setIndex] = useState(0)
  const current = Math.min(index, Math.max(0, images.length - 1))

  function move(direction) {
    // Wrap manual navigation without automatically advancing images.
    setIndex(
      (currentIndex) =>
        (currentIndex + direction + images.length) % images.length,
    )
  }

  return (
    <section aria-label={t('Product images')} className={styles.gallery}>
      <ProductImage
        key={images[current] || 'empty'}
        src={images[current]}
        title={productTitle(product)}
        eager
      />
      {images.length > 1 && (
        <>
          <div className={styles.controls}>
            <button onClick={() => move(-1)} aria-label={t('Previous image')}>
              ←
            </button>
            <span role="status">
              {t('Image {number} of {count}', {
                number: current + 1,
                count: images.length,
              })}
            </span>
            <button onClick={() => move(1)} aria-label={t('Next image')}>
              →
            </button>
          </div>
          <div className={styles.thumbnails}>
            {images.map((src, imageIndex) => (
              <button
                key={src}
                aria-label={t('Show image {number}', {
                  number: imageIndex + 1,
                })}
                aria-pressed={current === imageIndex}
                onClick={() => setIndex(imageIndex)}
              >
                <ProductImage src={src} title="" />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
