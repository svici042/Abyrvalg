import { useLanguage } from '../hooks/useLanguage'
import { SORT_OPTIONS } from '../utils/sorting'
import styles from './SortSelect.module.css'

export default function SortSelect({ value, onChange }) {
  const { t } = useLanguage()
  return (
    <label className={styles.sort}>
      {t('Sort by')}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
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
