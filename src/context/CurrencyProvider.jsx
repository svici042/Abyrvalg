import { CurrencyContext } from './CurrencyContext'
import usePersistentState from '../hooks/usePersistentState'
import { validateCurrency } from '../utils/storage'
export function CurrencyProvider({ children }) {
  // Currency is stored independently of language and defaults to NOK.
  const [currency, setCurrency, warning] = usePersistentState(
    'abyrvalg-currency',
    'NOK',
    validateCurrency,
  )
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, warning }}>
      {children}
    </CurrencyContext.Provider>
  )
}
