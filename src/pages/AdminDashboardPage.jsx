import { useId } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useAdminTransfer } from '../hooks/useAdminTransfer'
import styles from './Admin.module.css'
export default function AdminDashboardPage() {
  const { t } = useLanguage()
  const importId = useId()
  const {
    exportConfig,
    importConfig,
    reset,
    cleanup,
    feedback,
    busy,
    warning,
  } = useAdminTransfer()
  return (
    <>
      <h2>{t('Dashboard')}</h2>
      {/* Each card tuple contains a destination, translated title and description. */}
      <div className={styles.grid}>
        {[
          [
            '/admin/products',
            'Products',
            'Edit catalogue text, prices, stock, visibility and images.',
          ],
          [
            '/admin/content',
            'Store content',
            'Edit branding, hero, announcement, footer and fictional contact information.',
          ],
          [
            '/admin/orders',
            'Demo orders',
            'Review historical demo orders and manage fulfilment.',
          ],
        ].map(([to, title, description]) => (
          <article className={styles.panel} key={to}>
            <h3>
              <Link to={to}>{t(title)}</Link>
            </h3>
            <p>{t(description)}</p>
          </article>
        ))}
      </div>
      <h3>{t('Demo configuration')}</h3>
      <p>
        {t(
          'Exports include uploaded images. Imports replace administration settings only. Cart, preferences and demo orders are preserved. Maximum import size: 50 MB.',
        )}
      </p>
      <div className={styles.actions}>
        <button disabled={busy} onClick={exportConfig}>
          {t('Export configuration')}
        </button>
        <button disabled={busy} onClick={reset}>
          {t('Reset administration changes')}
        </button>
      </div>
      <button disabled={busy} onClick={cleanup}>
        {t('Clean up unused uploads')}
      </button>
      <label htmlFor={importId}>
        {t('Import configuration')}
        <input
          id={importId}
          name="adminConfigurationImport"
          type="file"
          accept="application/json,.json"
          disabled={busy}
          onChange={importConfig}
        />
      </label>
      <p role="status">{t(feedback || (busy ? 'Please wait …' : warning))}</p>
    </>
  )
}
