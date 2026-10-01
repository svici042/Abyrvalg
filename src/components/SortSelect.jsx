import { useId } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { SORT_OPTIONS } from '../utils/sorting'
import styles from './SortSelect.module.css'

export default function SortSelect({ value, onChange }) {
  const id = useId()
  const { t } = useLanguage()
  return (
    <label className={styles.sort} htmlFor={id}>
      {t('Sort by')}
      <select
        id={id}
        name="sort"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {/* Keep available choices aligned with the API sorting configuration. */}
        {Object.entries(SORT_OPTIONS).map(([key, option]) => (
          <option key={key} value={key}>
            {t(option.label)}
          </option>
        ))}
      </select>
    </label>
  )
}
