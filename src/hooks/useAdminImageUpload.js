import { useEffect, useRef, useState } from 'react'
import { putImage, rollbackImages } from '../utils/adminImages'
import {
  IMAGE_ERROR,
  DECODE_ERROR,
  ANIMATION_ERROR,
} from '../utils/imageValidation'

// Upload lifecycle and rollback are shared by product galleries and store logos.
export function useAdminImageUpload({
  images,
  main,
  onChange,
  single,
  onBusyChange,
}) {
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  function add(reference) {
    // Logos replace the sole image; product galleries preserve order and remove duplicates.
    const next = single ? [reference] : [...new Set([...images, reference])]
    if (next.length > 30) throw Error('Maximum 30 images.')
    onChange(next, single || !main ? reference : main)
  }
  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setBusy(true)
    // Keep the parent editor from saving or leaving while uploaded bytes are being stored.
    onBusyChange?.(true)
    let uploaded
    try {
      uploaded = await putImage(file)
      if (!mounted.current) {
        await rollbackImages([uploaded])
        return
      }
      add(uploaded)
    } catch (error) {
      if (uploaded) await rollbackImages([uploaded])
      setError(
        [IMAGE_ERROR, DECODE_ERROR, ANIMATION_ERROR].includes(error.message)
          ? error.message
          : 'Image could not be saved. Allow browser storage or free up space.',
      )
    } finally {
      setBusy(false)
      onBusyChange?.(false)
      event.target.value = ''
    }
  }
  return { add, upload, busy, error, setError }
}
