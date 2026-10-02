import { useProductTranslations } from '../hooks/useProductTranslations'
import { productText } from '../i18n/productText'
import { loadProductTranslations } from '../i18n/loadProducts'
import { useEffect, useState } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import { useLanguage } from '../hooks/useLanguage'
import { useFullCatalogue } from '../hooks/useProducts'
import { applyOverride } from '../utils/admin'
import AdminProductEditor from '../components/AdminProductEditor'
import AdminProductList from '../components/AdminProductList'
import RequestState from '../components/RequestState'
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
  const { t } = useLanguage()
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
      ) : null}
      <div hidden={Boolean(selected)}>
        <AdminProductList
          products={products}
          onSelect={(id) =>
            setSelected(query.data.find((source) => source.id === id))
          }
        />
      </div>
    </>
  )
}
