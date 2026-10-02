import AdminEditorActions from './AdminEditorActions'
import { useAdminProductEditor } from '../hooks/useAdminProductEditor'
import AdminProductFields from './AdminProductFields'
import { useLanguage } from '../hooks/useLanguage'
import AdminConflict from './AdminConflict'
import AdminTextFields from './AdminTextFields'
import AdminImages from './AdminImages'
import styles from '../pages/Admin.module.css'
// Compose the product form while the editor hook owns draft changes and persistence.
export default function AdminProductEditor({ original, norwegian, onClose }) {
  const { t, currency } = useLanguage()
  const {
    editor,
    baseline,
    draft,
    setDraft,
    dirty,
    feedback,
    imageBusy,
    setImageBusy,
    change,
    text,
    submit,
    restore,
  } = useAdminProductEditor(original, norwegian, onClose)
  return (
    <form className={styles.editor} onSubmit={submit}>
      <h3>
        {t('Edit product')} #{original.id}
      </h3>
      <p>
        {t(
          'Editing currency: {currency}. Prices are saved in USD using the fixed demo rate.',
          { currency },
        )}
      </p>
      {/* Resolve external configuration changes before saving the draft. */}
      <AdminConflict editor={editor} busy={imageBusy} />
      {/* The same text schema drives both Norwegian and English input groups. */}
      <AdminTextFields
        values={draft.text}
        onChange={text}
        fields={[
          {
            field: 'title',
            label: 'Product title',
            required: true,
            maxLength: 200,
          },
          {
            field: 'description',
            label: 'Product description',
            multiline: true,
            maxLength: 10000,
          },
        ]}
      />
      {/* Reloading changes the key so uncontrolled price input also resets. */}
      <AdminProductFields
        key={editor.generation}
        draft={draft}
        change={change}
      />
      {/* Image work blocks saving until the gallery and thumbnail references are ready. */}
      <AdminImages
        onBusyChange={setImageBusy}
        images={draft.images}
        main={draft.thumbnail}
        onChange={(images, thumbnail) =>
          setDraft((current) => ({ ...current, images, thumbnail }))
        }
      />
      {/* Announce save feedback and draft status without moving keyboard focus. */}
      <p role="status">
        {t(feedback || (dirty ? 'Unsaved changes' : 'No unsaved changes'))}
      </p>
      <AdminEditorActions
        editor={editor}
        busy={imageBusy}
        onRestore={restore}
        view={`/products/${original.id}`}
        onCancel={() => {
          // Clean drafts close immediately; edited drafts require discard confirmation.
          if (!dirty || window.confirm(t('Discard unsaved changes?'))) {
            setDraft(baseline)
            onClose()
          }
        }}
      />
    </form>
  )
}
