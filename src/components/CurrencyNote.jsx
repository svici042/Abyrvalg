import { DEMO_USD_TO_NOK } from '../config/currency'
import { useLanguage } from '../hooks/useLanguage'

// Explain the same fixed demonstration rate used by price calculations.
export default function CurrencyNote() {
  const { t } = useLanguage()
  return (
    <small>
      {t('Demo rate: 1 USD = {rate} NOK. Fixed example, not a live rate.', {
        rate: DEMO_USD_TO_NOK,
      })}
    </small>
  )
}
