import { useLanguage } from '../hooks/useLanguage'
import { CONFLICT } from '../utils/adminStorage'

export default function AdminConflict({ editor, busy }) {
  const { t } = useLanguage()
  if (!editor.conflict)
    return editor.storageWarning ? (
      <p role="alert">{t(editor.storageWarning)}</p>
    ) : null
  return (
    <section role="alert">
      <p>{t(CONFLICT)}</p>
      <button type="button" disabled={busy} onClick={editor.reload}>
        {t('Reload saved data')}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (
            window.confirm(
              t(
                'Keep this draft? Saving will replace this section of the latest configuration. Other sections are preserved.',
              ),
            )
          )
            editor.keep()
        }}
      >
        {t('Keep my draft')}
      </button>
    </section>
  )
}
