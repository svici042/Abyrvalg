import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { putImage, rollbackImages } from '../utils/adminImages'
import {
  IMAGE_ERROR,
  DECODE_ERROR,
  ANIMATION_ERROR,
} from '../utils/imageValidation'
import { validImage } from '../utils/admin'
import AdminImageList from './AdminImageList'
import AdminField from './AdminField'
export default function AdminImages({
  images,
  main,
  onChange,
  single = false,
  onBusyChange,
}) {
  const { t } = useLanguage()
  const uploadId = useId()
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const [url, setUrl] = useState('')
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
  return (
    <fieldset disabled={busy}>
      <legend>{t(single ? 'Logo image' : 'Product images')}</legend>
      <p>{t('Use JPG, PNG, WebP or GIF images up to 5 MB.')}</p>
      <p>
        {t(
          'External image hosts receive your IP address and image requests. Referrers are not sent.',
        )}
      </p>
      <p>{t(ANIMATION_ERROR)}</p>
      {images.some((image) => image.startsWith('http:')) && (
        <p role="alert">
          {t(
            'Legacy HTTP images are blocked. Replace them with HTTPS URLs or uploads before saving or importing.',
          )}
        </p>
      )}
      <AdminField
        label="Image URL"
        name="imageUrl"
        type="url"
        value={url}
        onChange={setUrl}
      />
      <button
        type="button"
        onClick={() => {
          setError('')
          if (!url.startsWith('https://') || !validImage(url)) {
            setError('Enter a valid HTTPS image URL.')
            return
          }
          try {
            add(url)
            setUrl('')
          } catch (error) {
            setError(error.message)
          }
        }}
      >
        {t('Add image URL')}
      </button>
      <label htmlFor={uploadId}>
        {t('Upload image')}
        <input
          id={uploadId}
          name="imageUpload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={upload}
        />
      </label>
      {busy && <p role="status">{t('Saving image …')}</p>}
      {error && <p role="alert">{t(error)}</p>}
      <AdminImageList
        images={images}
        main={main}
        single={single}
        onChange={onChange}
      />
    </fieldset>
  )
}
