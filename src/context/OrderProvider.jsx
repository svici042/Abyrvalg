import { useState } from 'react'
import { OrderContext } from './OrderContext'
import { commitOrders, ORDER_KEY, readOrders } from '../utils/orders'

function restoreOrders() {
  try {
    return { orders: readOrders(window.localStorage), error: '' }
  } catch {
    return {
      orders: [],
      error:
        'Saved orders could not be read. Try reading again before saving new orders.',
    }
  }
}

export function OrderProvider({ children }) {
  const [state, setState] = useState(restoreOrders)

  function commit(update) {
    // Propagate persistence errors so checkout cannot show a false confirmation.
    try {
      const orders = commitOrders(window.localStorage, update)
      setState({ orders, error: '' })
    } catch (error) {
      setState((current) => ({
        ...current,
        error: 'Could not save the order change. Try again.',
      }))
      throw error
    }
  }

  function resetInvalid() {
    try {
      window.localStorage.setItem(ORDER_KEY, '[]')
      setState({ orders: [], error: '' })
    } catch {
      setState((current) => ({
        ...current,
        error: 'Could not save the order change. Try again.',
      }))
    }
  }

  const value = {
    ...state,
    reload: () => setState(restoreOrders()),
    resetInvalid,
    deleteAll: () => {
      // Delete only this app’s order data, never unrelated storage keys.
      window.localStorage.removeItem(ORDER_KEY)
      setState({ orders: [], error: '' })
    },
    addOrder: (order) => commit((orders) => [...orders, order]),
    updateStatus: (id, status) =>
      commit((orders) =>
        orders.map((order) => (order.id === id ? { ...order, status } : order)),
      ),
    deleteOrder: (id) =>
      commit((orders) => orders.filter((order) => order.id !== id)),
  }
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}
