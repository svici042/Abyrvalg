import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'
import { useLanguage } from './useLanguage'
export function useUnsavedChanges(dirty) {
  const { t } = useLanguage()
  const blocker = useBlocker(dirty)
  // Remember the blocked destination to avoid repeating a prompt for the same navigation.
  const handled = useRef(null)
  useEffect(() => {
    if (blocker.state !== 'blocked') {
      handled.current = null
      return
    }
    if (handled.current === blocker.location.key) return
    handled.current = blocker.location.key
    if (blocker.state === 'blocked') {
      if (window.confirm(t('Discard unsaved changes?'))) blocker.proceed()
      else blocker.reset()
    }
  }, [blocker, t])
  useEffect(() => {
    // Browser reloads and tab closing need a separate native unsaved-changes warning.
    if (!dirty) return
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}
