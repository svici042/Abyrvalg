import { useEffect, useState } from 'react'

const preference = '(prefers-reduced-motion: reduce)'
let sessionPaused = false

// Keep the user's pause for client-side navigation; CSS handles reduced motion on first paint.
export function useHeroMotion() {
  const [paused, setPaused] = useState(sessionPaused)
  const [reduced, setReduced] = useState(() => matchMedia(preference).matches)
  useEffect(() => {
    const media = matchMedia(preference)
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  function toggle() {
    if (reduced) return
    sessionPaused = !paused
    setPaused(sessionPaused)
  }
  return { paused, reduced, toggle }
}
