import { defaultStoreContent } from '../config/storeContent'
import { useAdmin } from '../hooks/useAdmin'
import { useLanguage } from './useLanguage'
export function useStoreContent() {
  const { config } = useAdmin()
  const { language } = useLanguage()
  // Undefined text lets each storefront component use its translated default.
  return {
    content: config.content,
    storeText: (field) =>
      config.content[field]?.[language] ??
      defaultStoreContent()[field]?.[language],
  }
}
