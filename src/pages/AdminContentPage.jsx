import AdminEditorActions from '../components/AdminEditorActions'
import { useState } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import { useLanguage } from '../hooks/useLanguage'
import { useAdminDraft } from '../hooks/useAdminDraft'
import AdminConflict from '../components/AdminConflict'
import AdminTextFields from '../components/AdminTextFields'
import {
  contentDraft,
  contentLabels,
  contentOverrides,
} from '../config/storeContent'
import { contentFields } from '../utils/admin'
import AdminImages from '../components/AdminImages'
import styles from './Admin.module.css'
export default function AdminContentPage() {
  const { save } = useAdmin()
  const { t } = useLanguage()
  const [feedback, setFeedback] = useState('')
  const [imageBusy, setImageBusy] = useState(false)
  // Adapt store content to the shared draft and image-protection lifecycle.
  const editor = useAdminDraft(
    contentDraft,
    (content) => ({ products: {}, content }),
    imageBusy,
  )
  const { base, draft, setDraft, baseline, dirty } = editor
  async function submit(event) {
    event.preventDefault()
    if (imageBusy) return
    setImageBusy(true)
    try {
      // Save content against the original configuration without replacing product edits.
      const next = await save(
        { ...base, content: contentOverrides(draft) },
        base,
      )
      editor.saved(next)
      setFeedback('Changes saved in this browser.')
    } catch (error) {
      setFeedback(
        error.message === 'Invalid demo configuration'
          ? 'Complete both language versions of every text field. Required text cannot be blank.'
          : error.message,
      )
    } finally {
      setImageBusy(false)
    }
  }
  return (
    <form className={styles.editor} onSubmit={submit}>
      <h2>{t('Store content')}</h2>
      <p>
        {t('Use fictional information only. Text is displayed as plain text.')}
      </p>
      <AdminConflict editor={editor} busy={imageBusy} />
      {/* Convert field-first content into the language-first shape used by the inputs. */}
      <AdminTextFields
        values={Object.fromEntries(
          ['nb', 'en'].map((language) => [
            language,
            Object.fromEntries(
              contentFields.map((field) => [field, draft[field][language]]),
            ),
          ]),
        )}
        fields={contentFields.map((field) => ({
          field,
          label: contentLabels[field],
          multiline: field !== 'storeName',
          required: true,
          maxLength: 5000,
        }))}
        onChange={(language, field, value) => {
          setFeedback('')
          setDraft((current) => ({
            ...current,
            [field]: { ...current[field], [language]: value },
          }))
        }}
      />
      <AdminImages
        onBusyChange={setImageBusy}
        single
        images={draft.logo ? [draft.logo] : []}
        main={draft.logo}
        onChange={(_, logo) => setDraft((current) => ({ ...current, logo }))}
      />
      <p role="status">
        {t(feedback || (dirty ? 'Unsaved changes' : 'No unsaved changes'))}
      </p>
      <AdminEditorActions
        editor={editor}
        busy={imageBusy}
        view="/"
        onCancel={() => {
          setDraft(baseline)
          setFeedback('')
        }}
      />
    </form>
  )
}
