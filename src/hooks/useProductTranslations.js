import { useEffect, useState } from 'react'
import { loadProductTranslations } from '../i18n/loadProducts'
export function useProductTranslations(language) {
  const [dictionaries, setDictionaries] = useState(null)
  useEffect(() => {
    if (language !== 'nb') return
    let active = true
    loadProductTranslations().then((value) => {
      if (active) setDictionaries(value)
    })
    return () => {
      active = false
    }
  }, [language])
  return dictionaries
}
