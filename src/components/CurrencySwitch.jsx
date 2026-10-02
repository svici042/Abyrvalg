import { useId } from 'react'
import { useCurrency } from '../hooks/useCurrency'
import { useLanguage } from '../hooks/useLanguage'
import styles from './Header.module.css'

// Change the shared display currency independently of the interface language.
export default function CurrencySwitch() {
  const id = useId()
  const { currency, setCurrency } = useCurrency()
  const { t } = useLanguage()
  return (
    <label className={styles.selector} htmlFor={id}>
      <span>{t('Currency')}</span>
      <select
        id={id}
        name="currency"
        aria-label={t('Currency')}
        value={currency}
        onChange={(event) => setCurrency(event.target.value)}
      >
        <option value="NOK">NOK</option>
        <option value="USD">USD</option>
      </select>
    </label>
  )
}
