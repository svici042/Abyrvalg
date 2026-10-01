import { useId } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import styles from './Header.module.css'

// Language changes text and number formatting independently of currency.
export default function LanguageSwitch() {
  const id = useId()
  const { language, setLanguage, t } = useLanguage()
  return (
    <label className={styles.selector} htmlFor={id}>
      <span>{t('Language')}</span>
      <select
        id={id}
        name="language"
        aria-label={t('Choose language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        <option value="nb" lang="nb">
          NO
        </option>
        <option value="en" lang="en">
          EN
        </option>
      </select>
    </label>
  )
}
