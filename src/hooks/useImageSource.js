import { useEffect, useState } from 'react'
import { getImage } from '../utils/adminImages'
export function useImageSource(reference) {
  const [resolved, setResolved] = useState({ reference: '', url: '' })
  useEffect(() => {
    if (!reference?.startsWith('image:')) return
    // Ignore late database results after the reference changes or the component unmounts.
    let active = true
    let url
    getImage(reference)
      .then((blob) => {
        if (active && blob) {
          url = URL.createObjectURL(blob)
          setResolved({ reference, url })
        }
      })
      .catch(() => {})
    return () => {
      active = false
      // Release the temporary blob URL when this effect no longer needs it.
      if (url) URL.revokeObjectURL(url)
    }
  }, [reference])
  // Never display a resolved upload URL belonging to a previous reference.
  return reference?.startsWith('image:')
    ? resolved.reference === reference
      ? resolved.url
      : ''
    : reference?.startsWith('http:')
      ? ''
      : reference
}
