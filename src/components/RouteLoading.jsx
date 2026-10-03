import RequestState from './RequestState'
import { useLanguage } from '../hooks/useLanguage'

export default function RouteLoading() {
  const { t } = useLanguage()
  return <RequestState mainHeading loading title={t('Loading products …')} />
}
