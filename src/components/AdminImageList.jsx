import { useLanguage } from '../hooks/useLanguage'
import ProductImage from './ProductImage'
import styles from '../pages/Admin.module.css'

export default function AdminImageList({ images, main, single, onChange }) {
  const { t } = useLanguage()
  function move(index, direction) {
    // Swap adjacent entries in a copy without changing the selected main image.
    const next = [...images]
    ;[next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ]
    onChange(next, main)
  }
  return (
    <ol className={styles.images}>
      {images.map((reference, index) => (
        <li key={reference}>
          <ProductImage
            src={reference}
            title={t('Image {number} of {count}', {
              number: index + 1,
              count: images.length,
            })}
          />
          <div className={styles.actions}>
            {!single && (
              <>
                <button
                  type="button"
                  aria-pressed={main === reference}
                  onClick={() => onChange(images, reference)}
                >
                  {t('Main image')}
                </button>
                <button
                  type="button"
                  aria-label={t('Move image {number} earlier', {
                    number: index + 1,
                  })}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={t('Move image {number} later', {
                    number: index + 1,
                  })}
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
              </>
            )}
            <button
              type="button"
              aria-label={t('Remove image {number}', { number: index + 1 })}
              onClick={() => {
                // Removing the main image promotes the first remaining gallery entry.
                const next = images.filter((image) => image !== reference)
                onChange(next, main === reference ? next[0] || '' : main)
              }}
            >
              {t('Remove')}
            </button>
          </div>
        </li>
      ))}
    </ol>
  )
}
