import { useContext } from 'react'
import { OrderContext } from '../context/OrderContext'

// Keep context access in one hook shared by interface components.
export function useOrders() {
  return useContext(OrderContext)
}
