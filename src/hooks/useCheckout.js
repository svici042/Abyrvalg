import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from './useCart'
import { useOrders } from './useOrders'
import { createOrder } from '../utils/orders'

export function useCheckout() {
  const { clearCart, revalidate, ready } = useCart()
  const { addOrder } = useOrders()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [submittedQuote, setSubmittedQuote] = useState(null)
  const locked = useRef(false)
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  async function pay(customer, quote) {
    // The ref blocks duplicate clicks before React renders the disabled button.
    if (locked.current) return
    if (!ready || !revalidate()) {
      setError(
        'Review the updated cart before checkout. Product data must finish loading.',
      )
      return
    }
    locked.current = true
    setProcessing(true)
    setError('')
    // Freeze the displayed quote while the simulated payment is processing.
    try {
      // Create and freeze the entire transaction inside the error boundary.
      const order = createOrder(customer, quote)
      setSubmittedQuote(order)
      await new Promise((resolve) => setTimeout(resolve, 700))
      if (!active.current) return
      if (!revalidate()) throw Error('Cart changed')
      addOrder(order)
      clearCart()
      navigate(`/orders/${order.id}`, { replace: true })
    } catch {
      setError(
        'The order could not be saved. Your cart is unchanged. Allow local storage and try again.',
      )
      locked.current = false
      setProcessing(false)
      setSubmittedQuote(null)
    }
  }
  return { pay, processing, error, submittedQuote }
}
