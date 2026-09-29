import { useEffect, useState } from 'react'
import { readStoredValue } from '../utils/storage'

export default function usePersistentState(key, fallback, validate) {
  // Read stored data before the first write, including StrictMode initialization.
  const [initial] = useState(() => {
    try {
      return readStoredValue(window.localStorage, key, fallback, validate)
    } catch {
      return {
        value: fallback,
        warning: 'storageUnavailable',
      }
    }
  })
  const [value, setValue] = useState(initial.value)
  const [warning, setWarning] = useState(initial.warning)

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Report write failures while preserving in-memory changes.
      // oxlint-disable-next-line react/set-state-in-effect
      setWarning('storageWrite')
    }
  }, [key, value])

  return [value, setValue, warning]
}
