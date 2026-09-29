import { useLanguage } from '../hooks/useLanguage'
import { Link } from 'react-router-dom'
import RequestState from '../components/RequestState'

// Provide a recovery link for URLs that do not match any application route.
export default function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <RequestState mainHeading title={t('404 – Nothing here')}>
      <Link to="/">{t('Page not found. Back to all products')} →</Link>
    </RequestState>
  )
}
