import { useLanguage } from '../hooks/useLanguage'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useTheme } from '../hooks/useTheme'
import SearchForm from './SearchForm'
import CurrencySwitch from './CurrencySwitch'
import LanguageSwitch from './LanguageSwitch'
import BrandLogo from './BrandLogo'
import styles from './Header.module.css'

// Shared navigation exposes cart quantity, language and theme on every route.
export default function Header() {
  const { t } = useLanguage()
  const { totalQuantity } = useCart()
  const { theme, toggleTheme } = useTheme()
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label={t('Abyrvalg – home')}>
          <BrandLogo decorative />
        </Link>
        <nav aria-label={t('Main navigation')} className={styles.navigation}>
          <NavLink to="/" end>
            {t('Explore')}
          </NavLink>
          <NavLink
            to="/cart"
            aria-label={t('Cart, {count} items', {
              count: totalQuantity,
            })}
          >
            {t('Cart')} <span className={styles.badge}>{totalQuantity}</span>
          </NavLink>
        </nav>
        <SearchForm />
        <div className={styles.preferences}>
          <LanguageSwitch />
          <CurrencySwitch />
          <button
            className={styles.theme}
            onClick={toggleTheme}
            aria-label={
              theme === 'light'
                ? t('Switch to dark theme')
                : t('Switch to light theme')
            }
          >
            <span aria-hidden="true">{theme === 'light' ? '◐' : '☀'}</span>
            <span>{theme === 'light' ? t('Dark') : t('Light')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
