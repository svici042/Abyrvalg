import { useEffect, useState } from 'react'
import { loadProductTranslations } from '../i18n/loadProducts'
export function useProductTranslations(language) {
  const [dictionaries, setDictionaries] = useState(null)
  useEffect(() => {
    // English uses API text; load the supplementary dictionaries only for Norwegian.
    if (language !== 'nb') return
    let active = true
    loadProductTranslations().then((value) => {
      if (active) setDictionaries(value)
    })
    // Ignore a pending load after the language changes or the consumer unmounts.
    return () => {
      active = false
    }
  }, [language])
  return dictionaries
}
