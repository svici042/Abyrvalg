import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import styles from '../pages/Admin.module.css'

// Shared editor actions keep explicit save, cancellation and preview behavior consistent.
export default function AdminEditorActions({
  editor,
  busy,
  onCancel,
  onRestore,
  view,
}) {
  const { t } = useLanguage()
  return (
    <div className={styles.actions}>
      <button disabled={busy || editor.conflict} data-primary type="submit">
        {t('Save')}
      </button>
      <button disabled={busy} type="button" onClick={onCancel}>
        {t('Cancel')}
      </button>
      {onRestore && (
        <button
          disabled={busy || editor.conflict}
          type="button"
          onClick={onRestore}
        >
          {t('Restore original product')}
        </button>
      )}
      <Link to={view}>{t('View in store')}</Link>
    </div>
  )
}
