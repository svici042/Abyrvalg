import { useEffect, useRef } from 'react'
import {
  ScrollRestoration,
  useLocation,
  useNavigationType,
} from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
function pageTitle(path) {
  if (path === '/') return 'Explore'
  if (path === '/cart') return 'Your cart'
  if (path === '/checkout') return 'Demo checkout'
  if (path.startsWith('/products/')) return 'Product details'
  if (path.startsWith('/admin/orders/')) return 'Order details'
  if (path === '/admin/orders') return 'Demo orders'
  if (path.startsWith('/orders/')) return 'Order confirmation'
  return 'Page not found'
}
export default function RouteEffects() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const previousRoute = useRef(null)
  const { t } = useLanguage()
  const title = t(pageTitle(pathname)) + ' – Abyrvalg'
  useEffect(() => {
    document.title = title
  }, [title])
  useEffect(() => {
    // Query-only changes and browser history keep the user's reading position.
    const changed =
      !previousRoute.current ||
      previousRoute.current.pathname !== pathname ||
      previousRoute.current.hash !== hash
    previousRoute.current = { pathname, hash }
    if (!changed) return
    let target = document.getElementById('main')
    let invalidTarget = false
    if (hash) {
      try {
        const fragmentTarget = document.getElementById(
          decodeURIComponent(hash.slice(1)),
        )
        invalidTarget = !fragmentTarget
        target = fragmentTarget || target
      } catch {
        // Invalid percent-encoding should fall back to the main content.
        invalidTarget = true
      }
    }
    // Ordinary history navigation keeps focus and lets ScrollRestoration restore position.
    if (navigationType === 'POP' && !invalidTarget) return
    target?.focus({ preventScroll: true })
  }, [pathname, hash, navigationType])
  return <ScrollRestoration />
}
