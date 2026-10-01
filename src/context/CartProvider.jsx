import { useAdmin } from '../hooks/useAdmin'
import { useQueries } from '@tanstack/react-query'
import { getProduct } from '../api/products'
import { reconcileCart } from '../utils/admin'
import { useCallback, useEffect, useState, useRef } from 'react'
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
  const { config } = useAdmin()
  // Refresh only products present in the cart instead of downloading the catalogue.
  const requests = useQueries({
    queries: items.map((item) => ({
      queryKey: ['product', String(item.id)],
      queryFn: ({ signal }) => getProduct(item.id, signal),
      retry: false,
    })),
  })
  const ready = requests.every(
    (request) => request.isSuccess || request.error?.response?.status === 404,
  )
  const sourceKey = JSON.stringify(
    requests.map((request) => request.data || null),
  )
  const [changeNotice, setChangeNotice] = useState('')
  const currentItems = useRef(items)
  const update = useCallback(
    (transform) => {
      const next = transform(currentItems.current)
      currentItems.current = next
      setItems(next)
    },
    [setItems],
  )
  const revalidate = useCallback(() => {
    if (!ready) return false
    const next = reconcileCart(
      currentItems.current,
      JSON.parse(sourceKey).filter(Boolean),
      config,
    )
    if (JSON.stringify(next) !== JSON.stringify(currentItems.current)) {
      update(() => next)
      setChangeNotice(
        'Your cart was updated: current prices apply, quantities are limited to stock, and hidden or unavailable products are removed. Review before checkout.',
      )
      return false
    }
    return true
  }, [sourceKey, ready, config, update])
  useEffect(() => {
    if (ready) revalidate()
  }, [sourceKey, ready, revalidate])
  const totals = cartTotals(items)
  // Derive totals from cart lines and apply updates to the latest state.
  const value = {
    items: items.map((item) =>
      config.products[item.id]
        ? { ...item, text: config.products[item.id].text }
        : item,
    ),
    warning,
    changeNotice,
    revalidate,
    ready,
    totalQuantity: totals.quantity,
    totalCents: totals.cents,
    addProduct: (product, quantity = 1) => {
      if (product.hidden) return 0
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
