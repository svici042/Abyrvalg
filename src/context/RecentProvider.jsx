import { useCallback, useEffect, useState } from 'react'
import { RecentContext } from './RecentContext'
import { rememberProduct, validateRecent } from '../utils/recentProducts'
const KEY = 'abyrvalg-recent'
const OPT_IN = 'abyrvalg-recent-enabled'
function restore() {
  try {
    // Do not read history until the user has opted in.
    const enabled = localStorage.getItem(OPT_IN) === 'true'
    return {
      enabled,
      items: enabled
        ? validateRecent(JSON.parse(localStorage.getItem(KEY) || '[]'))
        : [],
      warning: '',
    }
  } catch {
    return { enabled: false, items: [], warning: 'storageRead' }
  }
}
export function RecentProvider({ children }) {
  const [state, setState] = useState(restore)
  useEffect(() => {
    if (!state.enabled || !state.items.length) return
    try {
      localStorage.setItem(KEY, JSON.stringify(state.items))
    } catch {
      // oxlint-disable-next-line react/set-state-in-effect
      setState((current) =>
        current.warning ? current : { ...current, warning: 'storageWrite' },
      )
    }
  }, [state.enabled, state.items])
  const remember = useCallback((product) => {
    setState((current) =>
      current.enabled
        ? { ...current, items: rememberProduct(current.items, product) }
        : current,
    )
  }, [])
  function enable(enabled) {
    try {
      localStorage.setItem(OPT_IN, JSON.stringify(enabled))
      localStorage.removeItem(KEY)
      setState({ enabled, items: [], warning: '' })
      return true
    } catch {
      setState((current) => ({ ...current, warning: 'storageWrite' }))
      return false
    }
  }
  function clear() {
    try {
      localStorage.removeItem(KEY)
      setState((current) => ({ ...current, items: [], warning: '' }))
      return true
    } catch {
      setState((current) => ({ ...current, warning: 'storageWrite' }))
      return false
    }
  }
  return (
    <RecentContext.Provider value={{ ...state, remember, enable, clear }}>
      {children}
    </RecentContext.Provider>
  )
}
