import { useLanguage } from '../hooks/useLanguage'
import AdminField from './AdminField'
import styles from '../pages/Admin.module.css'

// Reuse field definitions for each language so validation stays consistent.
export default function AdminTextFields({ values, fields, onChange }) {
  const { t } = useLanguage()
  return (
    <div className={styles.grid}>
      {/* Fieldsets identify each translation group for sighted and screen reader users. */}
      {['nb', 'en'].map((language) => (
        <fieldset key={language}>
          <legend>
            {t(language === 'nb' ? 'Norwegian text' : 'English text')}
          </legend>
          {fields.map(({ field, label, multiline, required, maxLength }) => (
            <AdminField
              key={field}
              label={label}
              name={`${field}-${language}`}
              value={values[language][field]}
              multiline={multiline}
              required={required}
              maxLength={maxLength}
              onChange={(value) => onChange(language, field, value)}
            />
          ))}
        </fieldset>
      ))}
    </div>
  )
}
