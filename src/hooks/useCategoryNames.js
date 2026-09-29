import { useLanguage } from './useLanguage'
import { useCategories } from './useProducts'

export function useCategoryNames() {
  const { t } = useLanguage()
  const query = useCategories()
  // Resolve display names from the shared API cache; slugs remain internal identifiers.
  function categoryName(slug) {
    const name = query.data?.find((category) => category.slug === slug)?.name
    return name ? t(name) : '…'
  }
  return { ...query, categoryName }
}
