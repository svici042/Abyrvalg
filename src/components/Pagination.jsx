import { useLanguage } from '../hooks/useLanguage'
import styles from './Pagination.module.css'

// Boundary controls prevent requests outside the available server-side pages.
export default function Pagination({ page, pageCount, onChange }) {
  const { t } = useLanguage()
  if (pageCount < 1) return null
  return (
    <nav aria-label={t('Product pages')} className={styles.pagination}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← {t('Previous')}
      </button>
      <span aria-live="polite">
        {t('Page {page} of {count}', { page, count: pageCount })}
      </span>
      <button disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        {t('Next')} →
      </button>
    </nav>
  )
}
