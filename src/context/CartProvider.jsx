import { useRef } from 'react'
import { CartContext } from './CartContext'
import usePersistentState from '../hooks/usePersistentState'
import {
  addItem,
  CART_KEY,
  cartTotals,
  changeQuantity,
  validateCart,
} from './cartState'

export function CartProvider({ children }) {
  const [items, setItems, warning] = usePersistentState(
    CART_KEY,
    [],
    validateCart,
  )
  const currentItems = useRef(items)
  function update(transform) {
    const next = transform(currentItems.current)
    currentItems.current = next
    setItems(next)
  }
  const totals = cartTotals(items)
  // Derive totals from cart lines and apply updates to the latest state.
  const value = {
    items,
    warning,
    totalQuantity: totals.quantity,
    totalCents: totals.cents,
    addProduct: (product, quantity = 1) => {
      const before =
        currentItems.current.find((item) => item.id === product.id)?.quantity ||
        0
      update((current) => addItem(current, product, quantity))
      const after =
        currentItems.current.find((item) => item.id === product.id)?.quantity ||
        0
      return Math.max(0, after - before)
    },
    setQuantity: (id, quantity) =>
      update((current) => changeQuantity(current, id, quantity)),
    removeProduct: (id) =>
      update((current) => current.filter((item) => item.id !== id)),
    // Checkout clears the cart only after the order has been saved successfully.
    clearCart: () => update(() => []),
  }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
