import { useAdmin } from '../hooks/useAdmin'
import { useStoreContent } from '../hooks/useStoreContent'
import RouteEffects from './RouteEffects'
import { useLanguage } from '../hooks/useLanguage'
import { useCurrency } from '../hooks/useCurrency'
import { Link, Outlet } from 'react-router-dom'
import Header from './Header'
import BrandLogo from './BrandLogo'
import { useCart } from '../hooks/useCart'
import { useTheme } from '../hooks/useTheme'
import { useRecentProducts } from '../hooks/useRecentProducts'
import styles from './Layout.module.css'

export default function Layout() {
  const { t, warning: languageWarning } = useLanguage()
  const { storeText } = useStoreContent()
  const administration = useAdmin()
  const cart = useCart()
  const theme = useTheme()
  const recent = useRecentProducts()
  // Combine provider warnings, removing empty entries and duplicate messages.
  const currencyState = useCurrency()
  const warnings = [
    ...new Set(
      [
        administration.warning,
        cart.warning,
        cart.changeNotice,
        theme.warning,
        languageWarning,
        recent.warning,
        currencyState.warning,
      ].filter(Boolean),
    ),
  ]
  return (
    <>
      <RouteEffects />
      <a
        className={styles.skip}
        href="#main"
        onClick={() => document.getElementById('main')?.focus()}
      >
        {t('Skip to content')}
      </a>
      <div
        className={styles.announcement}
        role="region"
        aria-label={t('Announcement text')}
      >
        {storeText('announcement')}
      </div>
      <Header />
      <main tabIndex={-1} id="main" className={styles.main}>
        {warnings.map((warning) => (
          <p className={styles.warning} role="status" key={warning}>
            {t(warning)}
          </p>
        ))}
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <Link to="/admin">{t('Demo administration')}</Link>
        <div className={styles.footerBrand}>
          <BrandLogo compact />
          <p>{storeText('footer')}</p>
        </div>
        <p>{storeText('contact')}</p>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Bim &amp; Bom
        </p>
      </footer>
    </>
  )
}
