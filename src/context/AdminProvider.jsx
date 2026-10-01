import { useEffect, useRef, useState } from 'react'
import { ADMIN_KEY, emptyConfig, hasHttpImages } from '../utils/admin'
import {
  CONFLICT,
  persistAdministration,
  readAdministration,
} from '../utils/adminStorage'
import { cleanupImages } from '../utils/adminImages'
import { AdminContext } from './AdminContext'

export function AdminProvider({ children }) {
  const [restored] = useState(() => {
    try {
      return { ...readAdministration(), warning: '' }
    } catch {
      return {
        raw: (() => {
          try {
            return localStorage.getItem(ADMIN_KEY)
          } catch {
            return null
          }
        })(),
        config: emptyConfig(),
        warning:
          'Saved administration data could not be read. Originals are displayed. Import a backup or reset administration settings.',
      }
    }
  })
  const [config, setConfig] = useState(restored.config)
  const [warning, setWarning] = useState(restored.warning)
  const latestRaw = useRef(restored.raw)
  const tokens = useRef(new WeakMap([[restored.config, restored.raw]]))
  function accept(saved) {
    latestRaw.current = saved.raw
    tokens.current.set(saved.config, saved.raw)
    setConfig(saved.config)
  }
  useEffect(() => {
    const synchronize = (event) => {
      if (event.key !== ADMIN_KEY && event.key !== null) return
      try {
        const saved = readAdministration()
        if (saved.raw === latestRaw.current) return
        accept(saved)
        setWarning('Administration updated from another tab.')
      } catch {
        setWarning(
          'Saved administration data could not be read. Originals are displayed. Import a backup or reset administration settings.',
        )
      }
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])
  // The editor supplies its original config token, even after a storage event.
  async function save(
    next,
    base = config,
    expectedRaw = tokens.current.get(base),
  ) {
    try {
      const saved = await persistAdministration(next, expectedRaw)
      accept(saved)
      setWarning('')
      void cleanupImages().catch(() => {})
      return saved.config
    } catch (error) {
      if (error.message === CONFLICT) {
        try {
          accept(readAdministration())
        } catch {
          /* Keep the last readable settings. */
        }
      }
      setWarning(error.message)
      throw error
    }
  }
  const message = hasHttpImages(config)
    ? 'Legacy HTTP images are blocked. Replace them with HTTPS URLs or uploads before saving or importing.'
    : warning
  return (
    <AdminContext.Provider value={{ config, save, warning: message }}>
      {children}
    </AdminContext.Provider>
  )
}
