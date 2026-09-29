import { useCurrency } from '../hooks/useCurrency'
import { useLanguage } from '../hooks/useLanguage'
import styles from './Header.module.css'

export default function CurrencySwitch() {
  const { currency, setCurrency } = useCurrency()
  const { t } = useLanguage()
  return (
    <label className={styles.selector}>
      <span>{t('Currency')}</span>
      <select
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
