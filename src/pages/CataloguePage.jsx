import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useCatalogue } from '../hooks/useCatalogue'
import { useLanguage } from '../hooks/useLanguage'
import CatalogueHero from '../components/CatalogueHero'
import { useCategoryNames } from '../hooks/useCategoryNames'
import CategoryFilter from '../components/CategoryFilter'
import CatalogueResults from '../components/CatalogueResults'
import RecentlyViewed from '../components/RecentlyViewed'
import styles from './CataloguePage.module.css'

// Compose URL-driven filters, request states and server-paginated product results.
export default function CataloguePage() {
  const { t, currency } = useLanguage()
  const {
    search,
    category,
    page,
    sort,
    query,
    pageCount,
    changePage,
    changeSort,
    setParams,
  } = useCatalogue()
  const { categoryName } = useCategoryNames()
  const { key, hash } = useLocation()
  useEffect(() => {
    // Direct anchors need the loaded catalogue height; history entries use router restoration.
    if (key === 'default' && hash === '#catalogue' && query.isSuccess)
      document.getElementById('catalogue')?.scrollIntoView()
  }, [key, hash, query.isSuccess])

  let heading = t('All products')
  if (category) heading = categoryName(category)
  if (search) heading = t('Results for “{search}”', { search })

  return (
    <>
      <CatalogueHero />
      <div tabIndex={-1} id="catalogue" className={styles.catalogue}>
        <CategoryFilter
          category={category}
          onChange={(slug) =>
            setParams(
              {
                ...(slug ? { category: slug } : {}),
                ...(sort !== 'default' ? { sort } : {}),
              },
              { preventScrollReset: true },
            )
          }
        />
        <CatalogueResults
          heading={heading}
          currency={currency}
          query={query}
          page={page}
          pageCount={pageCount}
          sort={sort}
          hasFilters={Boolean(search || category)}
          onSortChange={changeSort}
          onClearFilters={() => setParams({}, { preventScrollReset: true })}
          onPageChange={changePage}
        />
      </div>
      <RecentlyViewed />
    </>
  )
}
