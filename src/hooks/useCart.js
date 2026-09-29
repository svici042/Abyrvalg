import { useContext } from 'react'
import { CartContext } from '../context/CartContext'

// Keep context access in one hook shared by interface components.
export function useCart() {
  return useContext(CartContext)
}
