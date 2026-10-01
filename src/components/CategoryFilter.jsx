import { useId } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useCategories } from '../hooks/useProducts'
import styles from './CategoryFilter.module.css'

export default function CategoryFilter({ category, onChange }) {
  const id = useId()
  const { t } = useLanguage()
  const query = useCategories()
  return (
    <aside className={styles.filter}>
      <div className={styles.title}>
        <h2>{t('Categories')}</h2>
        <span aria-hidden="true">↙</span>
      </div>
      {query.isPending && <p role="status">{t('Loading categories …')}</p>}
      {query.isError && (
        <div role="alert">
          <p>{t('Could not load categories.')}</p>
          <button onClick={() => query.refetch()}>{t('Try again')}</button>
        </div>
      )}
      <label className={styles.mobileLabel} htmlFor={id}>
        {t('Choose a category')}
      </label>
      <select
        id={id}
        name="category"
        className={styles.select}
        value={category}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t('All products')}</option>
        {/* Mobile options use API slugs as values and translated API names as labels. */}
        {query.data?.map((item) => (
          <option key={item.slug} value={item.slug}>
            {t(item.name)}
          </option>
        ))}
      </select>
      {/* Desktop buttons use the same category data and selection as the mobile control. */}
      <div className={styles.list}>
        <button aria-pressed={!category} onClick={() => onChange('')}>
          {t('All products')}{' '}
          <span aria-hidden="true">{category ? '↗' : '✓'}</span>
        </button>
        {query.data?.map((item) => (
          <button
            key={item.slug}
            aria-pressed={category === item.slug}
            onClick={() => onChange(item.slug)}
          >
            {t(item.name)}
            {category === item.slug && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      <div className={styles.note}>
        <span aria-hidden="true">✳</span>
        <strong>{t('Find something new.')}</strong>
        <p>{t('Explore favourites big and small across our categories.')}</p>
      </div>
    </aside>
  )
}
