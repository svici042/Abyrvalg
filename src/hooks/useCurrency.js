import { useContext } from 'react'
import { CurrencyContext } from '../context/CurrencyContext'
// Keep context access in one hook shared by interface components.
export function useCurrency() {
  return useContext(CurrencyContext)
}
