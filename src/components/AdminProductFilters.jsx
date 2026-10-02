import { useLanguage } from '../hooks/useLanguage'
import { useCategoryNames } from '../hooks/useCategoryNames'
import AdminField from './AdminField'
import styles from '../pages/Admin.module.css'

export default function AdminProductFilters({
  products,
  search,
  category,
  visibility,
  setSearch,
  setCategory,
  setVisibility,
  updateFilter,
}) {
  const { t } = useLanguage()
  const { data: categories, categoryName } = useCategoryNames()
  return (
    <div className={styles.grid}>
      <AdminField
        label="Search products"
        name="adminProductSearch"
        type="search"
        value={search}
        onChange={(value) => updateFilter(setSearch, value)}
      />
      <label>
        {t('Category')}
        <select
          name="adminProductCategory"
          value={category}
          onChange={(event) => updateFilter(setCategory, event.target.value)}
        >
          <option value="">{t('All categories')}</option>
          {[...new Set(products.map((product) => product.category))]
            .sort()
            .map((value) => (
              <option key={value} value={value}>
                {categories?.some((item) => item.slug === value)
                  ? categoryName(value)
                  : value.replaceAll('-', ' ')}
              </option>
            ))}
        </select>
      </label>
      <label>
        {t('Visibility')}
        <select
          name="adminProductVisibility"
          value={visibility}
          onChange={(event) => updateFilter(setVisibility, event.target.value)}
        >
          <option value="">{t('All products')}</option>
          <option value="visible">{t('Visible')}</option>
          <option value="hidden">{t('Hidden')}</option>
        </select>
      </label>
    </div>
  )
}
