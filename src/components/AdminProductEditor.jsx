import AdminEditorActions from './AdminEditorActions'
import { useAdminProductEditor } from '../hooks/useAdminProductEditor'
import AdminProductFields from './AdminProductFields'
import { useLanguage } from '../hooks/useLanguage'
import AdminConflict from './AdminConflict'
import AdminTextFields from './AdminTextFields'
import AdminImages from './AdminImages'
import styles from '../pages/Admin.module.css'
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
      <AdminConflict editor={editor} busy={imageBusy} />
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
      <AdminProductFields
        key={editor.generation}
        draft={draft}
        change={change}
      />
      <AdminImages
        onBusyChange={setImageBusy}
        images={draft.images}
        main={draft.thumbnail}
        onChange={(images, thumbnail) =>
          setDraft((current) => ({ ...current, images, thumbnail }))
        }
      />
      <p role="status">
        {t(feedback || (dirty ? 'Unsaved changes' : 'No unsaved changes'))}
      </p>
      <AdminEditorActions
        editor={editor}
        busy={imageBusy}
        onRestore={restore}
        view={`/products/${original.id}`}
        onCancel={() => {
          if (!dirty || window.confirm(t('Discard unsaved changes?'))) {
            setDraft(baseline)
            onClose()
          }
        }}
      />
    </form>
  )
}
