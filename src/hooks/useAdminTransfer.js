import administrationMessages from '../i18n/admin.nb'
import { useState } from 'react'
import { useAdmin } from './useAdmin'
import { useLanguage } from './useLanguage'
import {
  ADMIN_KEY,
  emptyConfig,
  externalHosts,
  hasHttpImages,
  imageReferences,
  validateConfig,
} from '../utils/admin'
import {
  cleanupImages,
  exportImages,
  importImages,
  rollbackImages,
} from '../utils/adminImages'
import {
  protectImages,
  unprotectImages,
  releaseImages,
} from '../utils/adminStorage'
import { assertExportSize, MAX_CONFIG_SIZE } from '../utils/exportLimit'
import { ANIMATION_IMPORT_PROMPT } from '../utils/imageValidation'

export function useAdminTransfer() {
  const { config, save, warning } = useAdmin()
  const { t } = useLanguage()
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  async function run(action) {
    setBusy(true)
    setFeedback('')
    try {
      await action()
    } catch (error) {
      setFeedback(
        Object.hasOwn(administrationMessages, error.message)
          ? error.message
          : 'Administration operation failed. Allow browser storage or free up space.',
      )
    } finally {
      setBusy(false)
    }
  }
  function exportConfig() {
    return run(async () => {
      const refs = imageReferences(config)
      const exportId = crypto.randomUUID()
      await protectImages(exportId, refs)
      try {
        const overhead = new TextEncoder().encode(
          JSON.stringify({ ...config, images: {} }),
        ).length
        const images = await exportImages(refs, overhead, (done, total) =>
          setFeedback(
            t('Exporting images: {done} of {total}', { done, total }),
          ),
        )
        const serialized = JSON.stringify({ ...config, images })
        assertExportSize(new TextEncoder().encode(serialized).length)
        const url = URL.createObjectURL(
          new Blob([serialized], { type: 'application/json' }),
        )
        const link = document.createElement('a')
        link.href = url
        link.download = 'abyrvalg-demo.json'
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setFeedback('Configuration exported, including uploaded images.')
      } finally {
        await unprotectImages(exportId)
      }
    })
  }
  function importConfig(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    return run(async () => {
      let imported = []
      let committed = false
      try {
        if (file.size > MAX_CONFIG_SIZE)
          throw Error('Configuration file must be under 50 MB.')
        const payload = JSON.parse(await file.text())
        const next = validateConfig(payload)
        if (hasHttpImages(next))
          throw Error(
            'Legacy HTTP images are blocked. Replace them with HTTPS URLs or uploads before saving or importing.',
          )
        const hosts = externalHosts(next)
        const disclosure = hosts.length
          ? '\n\n' +
            t(
              'External image hosts: {hosts}. They receive your IP address and image requests, even without a referrer. Allow these requests?',
              { hosts: hosts.join(', ') },
            )
          : ''
        if (
          !window.confirm(
            t(
              'Replace all administration changes with this configuration? Cart, preferences and orders are preserved.',
            ) + disclosure,
          )
        )
          return
        let animationAccepted = false
        const mapping = await importImages(
          imageReferences(next),
          payload.images,
          () => {
            animationAccepted ||= window.confirm(t(ANIMATION_IMPORT_PROMPT))
            return animationAccepted
          },
        )
        imported = Object.values(mapping)
        const remap = (reference) => mapping[reference] || reference
        for (const product of Object.values(next.products)) {
          product.thumbnail = remap(product.thumbnail)
          product.images = product.images.map(remap)
        }
        if (next.content.logo) next.content.logo = remap(next.content.logo)
        await save(next, config)
        committed = true
        setFeedback('Configuration imported in this browser.')
      } catch (error) {
        if (!committed) await rollbackImages(imported)
        if (
          ['Invalid demo configuration'].includes(error.message) ||
          error instanceof SyntaxError
        )
          throw Error(
            'Import failed. Check the configuration schema and included images, and allow browser storage.',
          )
        throw error
      } finally {
        if (committed) {
          try {
            await releaseImages(imported)
            await cleanupImages()
          } catch {
            setFeedback(
              'Configuration imported, but unused uploads could not be cleaned up. Try cleanup again.',
            )
          }
        }
      }
    })
  }
  function reset() {
    let expectedRaw
    try {
      expectedRaw = localStorage.getItem(ADMIN_KEY)
    } catch {
      setFeedback(
        'Changes could not be saved. Allow browser storage or free up space.',
      )
      return
    }
    if (
      !window.confirm(
        t(
          'Reset all administration changes? Cart, preferences and demo orders will be preserved.',
        ),
      )
    )
      return
    return run(async () => {
      await save(emptyConfig(), config, expectedRaw)
      try {
        await cleanupImages()
      } catch {
        setFeedback(
          'Administration changes reset, but unused uploads could not be cleaned up. Cart, preferences and orders preserved. Try cleanup again.',
        )
        return
      }
      setFeedback(
        'Administration changes reset. Cart, preferences and orders preserved.',
      )
    })
  }
  function cleanup() {
    return run(async () => {
      const count = await cleanupImages()
      setFeedback(
        t(
          'Removed {count} unused uploads. Saved images and active drafts are protected.',
          { count },
        ),
      )
    })
  }
  return { exportConfig, importConfig, reset, cleanup, feedback, busy, warning }
}
