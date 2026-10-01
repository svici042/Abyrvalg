import { useProductTranslations } from '../hooks/useProductTranslations'
import { productText } from '../i18n/productText'
import { loadProductTranslations } from '../i18n/loadProducts'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../hooks/useAdmin'
import { useLanguage } from '../hooks/useLanguage'
import { useFullCatalogue } from '../hooks/useProducts'
import { applyOverride } from '../utils/admin'
import AdminProductEditor from '../components/AdminProductEditor'
import AdminField from '../components/AdminField'
import RequestState from '../components/RequestState'
import styles from './Admin.module.css'
export default function AdminProductsPage() {
  const dictionaries = useProductTranslations('nb')
  const [translationsReady, setTranslationsReady] = useState(false)
  useEffect(() => {
    let active = true
    loadProductTranslations().then(() => {
      if (active) setTranslationsReady(true)
    })
    return () => {
      active = false
    }
  }, [])
  const query = useFullCatalogue()
  const { config } = useAdmin()
  const { t, productTitle, formatPrice } = useLanguage()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [visibility, setVisibility] = useState('')
  const [selected, setSelected] = useState(null)
  if (query.isPending || !translationsReady)
    return <RequestState loading title={t('Loading products …')} />
  if (query.isError)
    return (
      <RequestState
        title={t('Could not load products')}
        onRetry={query.refetch}
      />
    )
  // Admin filters include hidden products and operate on the locally edited catalogue.
  const products = query.data.map((product) => applyOverride(product, config))
  const matching = products.filter(
    (product) =>
      (!category || product.category === category) &&
      (!visibility || Boolean(product.hidden) === (visibility === 'hidden')) &&
      `${productTitle(product)} ${product.id} ${product.brand || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  return (
    <>
      <h2>{t('Products')}</h2>
      {!dictionaries && (
        <p role="status">
          {t(
            'Original Norwegian text could not be loaded. Review both language fields before saving.',
          )}
        </p>
      )}
      {selected ? (
        <AdminProductEditor
          key={selected.id}
          original={selected}
          norwegian={{
            title: productText(selected, 'nb', 'title', dictionaries),
            description: productText(
              selected,
              'nb',
              'description',
              dictionaries,
            ),
          }}
          onClose={() => setSelected(null)}
        />
      ) : (
        <>
          <div className={styles.grid}>
            <AdminField
              label="Search products"
              name="adminProductSearch"
              type="search"
              value={search}
              onChange={setSearch}
            />
            <label>
              {t('Category')}
              <select
                name="adminProductCategory"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">{t('All categories')}</option>
                {[...new Set(products.map((product) => product.category))]
                  .sort()
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </select>
            </label>
            <label>
              {t('Visibility')}
              <select
                name="adminProductVisibility"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
              >
                <option value="">{t('All products')}</option>
                <option value="visible">{t('Visible')}</option>
                <option value="hidden">{t('Hidden')}</option>
              </select>
            </label>
          </div>
          <p role="status">
            {t('{count} products', { count: matching.length })}
          </p>
          <ul className={styles.list}>
            {matching.map((product) => (
              <li key={product.id}>
                <div>
                  <strong>{productTitle(product)}</strong>
                  <p>
                    #{product.id} · {formatPrice(product.price)} ·{' '}
                    {t(product.hidden ? 'Hidden' : 'Visible')}
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    onClick={() =>
                      setSelected(
                        query.data.find((source) => source.id === product.id),
                      )
                    }
                  >
                    {t('Edit product')} #{product.id}
                  </button>
                  <Link to={`/products/${product.id}`}>
                    {t('View in store')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {!matching.length && <p>{t('No products found')}</p>}
        </>
      )}
    </>
  )
}
