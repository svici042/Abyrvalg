import { useState } from 'react'
import { useAdmin } from './useAdmin'
import { useLanguage } from './useLanguage'
import { useAdminDraft } from './useAdminDraft'
import { applyOverride } from '../utils/admin'

export function useAdminProductEditor(original, norwegian, onClose) {
  const { save } = useAdmin()
  const { t } = useLanguage()
  // Start from saved overrides, falling back to original catalogue and translated text.
  function initial(config) {
    const product = applyOverride(original, config)
    return {
      price: product.price,
      stock: product.stock,
      category: product.category,
      brand: product.brand || '',
      hidden: !!product.hidden,
      thumbnail: product.thumbnail || '',
      // Place the thumbnail first and discard empty or repeated gallery references.
      images: [
        ...new Set(
          [product.thumbnail, ...(product.images || [])].filter(Boolean),
        ),
      ],
      text: product.text || {
        en: { title: original.title, description: original.description || '' },
        nb: {
          title: norwegian.title,
          description: norwegian.description,
        },
      },
    }
  }
  const [feedback, setFeedback] = useState('')
  const [imageBusy, setImageBusy] = useState(false)
  const editor = useAdminDraft(
    initial,
    (product) => ({ content: {}, products: { [original.id]: product } }),
    imageBusy,
  )
  const { base, baseline, draft, setDraft, dirty } = editor
  function change(field, value) {
    setFeedback('')
    setDraft((current) => ({ ...current, [field]: value }))
  }
  function text(language, field, value) {
    change('text', {
      ...draft.text,
      [language]: { ...draft.text[language], [field]: value },
    })
  }
  async function submit(event) {
    event.preventDefault()
    if (imageBusy) return
    setImageBusy(true)
    try {
      const next = await save(
        {
          ...base,
          products: { ...base.products, [original.id]: draft },
        },
        base,
      )
      editor.saved(next)
      setFeedback('Changes saved in this browser.')
    } catch (error) {
      setFeedback(
        error.message === 'Invalid demo configuration'
          ? 'Check both product titles, category, price and stock. Required text cannot be blank.'
          : error.message,
      )
    } finally {
      setImageBusy(false)
    }
  }
  async function restore() {
    if (!window.confirm(t('Restore this product to its original data?'))) return
    try {
      const products = { ...base.products }
      // Removing this override restores API data without changing other products.
      delete products[original.id]
      await save({ ...base, products }, base)
      onClose()
    } catch (error) {
      setFeedback(
        error.message === 'Invalid demo configuration'
          ? 'Check both product titles, category, price and stock. Required text cannot be blank.'
          : error.message,
      )
    }
  }
  return {
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
  }
}
