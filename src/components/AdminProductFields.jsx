import { useId } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { currencySettings } from '../utils/money'
import AdminField from './AdminField'
import styles from '../pages/Admin.module.css'

export default function AdminProductFields({ draft, change }) {
  const { t, currency } = useLanguage()
  const { rate } = currencySettings(currency)
  const visibilityId = useId()
  return (
    <>
      {/* Display prices in the selected currency; edits convert back to USD for storage. */}
      <div className={styles.grid}>
        <AdminField
          key={currency}
          label={`${t('Base price')} (${currency})`}
          name="productPrice"
          type="number"
          min="0"
          max={1000000 * rate}
          step="any"
          required
          defaultValue={
            draft.price === '' ? '' : Number((draft.price * rate).toFixed(6))
          }
          onChange={(value) =>
            change('price', value === '' ? '' : Number(value) / rate)
          }
        />
        <AdminField
          label="Demo stock quantity"
          name="productStock"
          type="number"
          min="0"
          max="1000000"
          step="1"
          required
          value={draft.stock}
          onChange={(value) =>
            change('stock', value === '' ? '' : Number(value))
          }
        />
        <AdminField
          label="Category"
          name="productCategory"
          value={draft.category}
          onChange={(value) => change('category', value)}
          required
          maxLength={200}
        />
        <AdminField
          label="Brand"
          name="productBrand"
          value={draft.brand}
          onChange={(value) => change('brand', value)}
          maxLength={200}
        />
      </div>
      <label htmlFor={visibilityId}>
        <input
          id={visibilityId}
          name="productHidden"
          type="checkbox"
          checked={draft.hidden}
          onChange={(event) => change('hidden', event.target.checked)}
        />
        {t('Hide product from storefront')}
      </label>
    </>
  )
}
