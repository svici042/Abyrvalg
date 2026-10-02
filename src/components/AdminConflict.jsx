import { useLanguage } from '../hooks/useLanguage'
import { CONFLICT } from '../utils/adminStorage'

// Let the administrator resolve external saves before replacing stored data.
export default function AdminConflict({ editor, busy }) {
  const { t } = useLanguage()
  // Storage failures still need an alert when there is no competing save.
  if (!editor.conflict)
    return editor.storageWarning ? (
      <p role="alert">{t(editor.storageWarning)}</p>
    ) : null
  return (
    <section role="alert">
      <p>{t(CONFLICT)}</p>
      {/* Reload discards the draft and reads the latest saved configuration. */}
      <button type="button" disabled={busy} onClick={editor.reload}>
        {t('Reload saved data')}
      </button>
      {/* Keeping the draft requires confirmation because a later save replaces this section. */}
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
