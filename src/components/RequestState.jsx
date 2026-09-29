import { useLanguage } from '../hooks/useLanguage'
import styles from './RequestState.module.css'

// Share accessible loading, empty and retryable-error presentation across routes.
export default function RequestState({
  title,
  children,
  onRetry,
  loading = false,
  mainHeading = false,
}) {
  const Heading = mainHeading ? 'h1' : 'h2'
  const { t } = useLanguage()
  return (
    <section
      className={styles.state}
      role={onRetry ? 'alert' : 'status'}
      aria-busy={loading}
    >
      <span className={styles.symbol} aria-hidden="true">
        {loading ? '◌' : '◇'}
      </span>
      <Heading>{title}</Heading>
      {children && <p>{children}</p>}
      {onRetry && <button onClick={onRetry}>{t('Try again')}</button>}
    </section>
  )
}
