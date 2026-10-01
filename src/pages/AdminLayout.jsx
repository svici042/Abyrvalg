import { NavLink, Outlet } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import styles from './Admin.module.css'
export default function AdminLayout() {
  const { t } = useLanguage()
  return (
    <section className={styles.admin}>
      <h1>{t('Demo administration')}</h1>
      <p className={styles.notice}>
        {t(
          'Saved only in this browser. Changes do not update the public website for other visitors. This demo has no secure authentication. Use fictional information only.',
        )}
      </p>
      <nav
        className={styles.actions}
        aria-label={t('Administration navigation')}
      >
        <NavLink to="/admin" end>
          {t('Dashboard')}
        </NavLink>
        <NavLink to="/admin/products">{t('Products')}</NavLink>
        <NavLink to="/admin/content">{t('Store content')}</NavLink>
        <NavLink to="/admin/orders">{t('Demo orders')}</NavLink>
        <NavLink to="/">{t('Back to the shop')}</NavLink>
      </nav>
      {/* Nested administration pages share this navigation and browser-storage notice. */}
      <Outlet />
    </section>
  )
}
