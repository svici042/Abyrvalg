import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
export function useSearchDraft() {
  const location = useLocation()
  const navigate = useNavigate()
  const submitted = new URLSearchParams(location.search).get('q') || ''
  const [search, setSearch] = useState(submitted)
  useEffect(() => {
    // History navigation restores the draft without submitting another search.
    // oxlint-disable-next-line react/set-state-in-effect
    setSearch(submitted)
  }, [location.key, submitted])
  function submit() {
    const params = new URLSearchParams(location.search)
    const next = new URLSearchParams()
    if (params.has('sort')) next.set('sort', params.get('sort'))
    if (search.trim()) next.set('q', search.trim())
    navigate(next.size ? '/?' + next : '/', {
      preventScrollReset: location.pathname === '/',
    })
  }
  return { search, change: setSearch, submit }
}
