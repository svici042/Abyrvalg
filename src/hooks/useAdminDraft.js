import { useLayoutEffect, useRef, useState } from 'react'
import { useAdmin } from './useAdmin'
import { useUnsavedChanges } from './useUnsavedChanges'
import { imageReferences } from '../utils/admin'
import { protectImages, unprotectImages } from '../utils/adminStorage'
import { cleanupImages } from '../utils/adminImages'

// Preserve editor state across external saves; rebasing requires an explicit user action.
export function useAdminDraft(initial, toConfig, busy) {
  const { config } = useAdmin()
  // Track the saved configuration separately from the editable section and its baseline.
  const [base, setBase] = useState(config)
  const [baseline, setBaseline] = useState(() => initial(config))
  const [draft, setDraft] = useState(baseline)
  const [generation, setGeneration] = useState(0)
  const [storageWarning, setStorageWarning] = useState('')
  const id = useRef(crypto.randomUUID())
  // Changes to the shared configuration signal a conflict even when this draft is clean.
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  const conflict = base !== config
  useUnsavedChanges(dirty || busy)
  // Protect both saved and draft images so cleanup cannot remove images needed for cancellation.
  const refs = JSON.stringify([
    ...new Set([
      ...imageReferences(toConfig(draft)),
      ...imageReferences(toConfig(baseline)),
    ]),
  ])
  useLayoutEffect(() => {
    void protectImages(id.current, JSON.parse(refs))
      .then(() => cleanupImages())
      .catch((error) => setStorageWarning(error.message))
  }, [refs])
  // Release this editor's image protection only after it unmounts.
  useLayoutEffect(() => {
    const key = id.current
    return () => {
      void unprotectImages(key)
        .then(() => cleanupImages())
        .catch(() => {})
    }
  }, [])
  // Reset the draft and remount generation-keyed fields using the latest saved values.
  function reload() {
    setGeneration((current) => current + 1)
    const next = initial(config)
    setBaseline(next)
    setDraft(next)
    setBase(config)
  }
  // Accept the latest configuration as the save base without discarding draft edits.
  function keep() {
    setBase(config)
  }
  // A successful save makes the current draft the new comparison baseline.
  function saved(next) {
    setBase(next)
    setBaseline(draft)
  }
  return {
    generation,
    storageWarning,
    base,
    baseline,
    draft,
    setDraft,
    dirty,
    conflict,
    reload,
    keep,
    saved,
  }
}
