import { useId, useState } from 'react'
import { useAdminImageUpload } from '../hooks/useAdminImageUpload'
import { useLanguage } from '../hooks/useLanguage'
import { ANIMATION_ERROR } from '../utils/imageValidation'
import { validImage } from '../utils/admin'
import AdminImageList from './AdminImageList'
import AdminField from './AdminField'
// Combine external image URLs, local uploads and gallery selection in one editor.
export default function AdminImages({
  images,
  main,
  onChange,
  single = false,
  onBusyChange,
}) {
  const { t } = useLanguage()
  const uploadId = useId()
  const [url, setUrl] = useState('')
  const { add, upload, busy, error, setError } = useAdminImageUpload({
    images,
    main,
    onChange,
    single,
    onBusyChange,
  })

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
      {/* Flag legacy URLs that cannot pass the current HTTPS-only validation. */}
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
          // Validate before adding a reference to the draft gallery.
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
      {/* The upload hook validates and stores files before updating image references. */}
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
