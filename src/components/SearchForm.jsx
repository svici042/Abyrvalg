import { useLanguage } from '../hooks/useLanguage'
import { useSearchDraft } from '../hooks/useSearchDraft'
import styles from './Header.module.css'

// Delegate draft text and explicit submission to the search hook.
export default function SearchForm() {
  const { t } = useLanguage()
  const { search, change, submit } = useSearchDraft()

  return (
    <form
      className={styles.search}
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <label htmlFor="product-search" className={styles.hidden}>
        {t('Search products')}
      </label>
      <input
        id="product-search"
        type="search"
        placeholder={t('What are you looking for?')}
        value={search}
        onChange={(event) => change(event.target.value)}
      />
      {search && (
        <button
          type="button"
          aria-label={t('Clear search')}
          onClick={() => change('')}
        >
          ×
        </button>
      )}
      <button type="submit">
        {t('Search')} <span aria-hidden="true">↗</span>
      </button>
    </form>
  )
}
