import { useContext } from 'react'
import { LanguageContext } from '../context/LanguageContext'

// Keep context access in one hook shared by interface components.
export function useLanguage() {
  return useContext(LanguageContext)
}
