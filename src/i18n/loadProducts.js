// Vite emits data assets; English startup receives URLs, not dictionary contents.
const assets = import.meta.glob('./products/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
})
const loaded = new Map()
let pending
function loadRange(url) {
  if (!loaded.has(url)) {
    const request = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Translation download failed')
        return response.json()
      })
      .catch((error) => {
        loaded.delete(url)
        throw error
      })
    loaded.set(url, request)
  }
  return loaded.get(url)
}
async function dictionary(language) {
  const ranges = Object.entries(assets).filter(([name]) =>
    name.startsWith('./products/' + language + '-'),
  )
  return Object.assign(
    {},
    ...(await Promise.all(ranges.map(([, url]) => loadRange(url)))),
  )
}
export function loadProductTranslations() {
  // Retry failed requests only on a later language change; successful ranges stay cached.
  pending ||= Promise.all([dictionary('en'), dictionary('nb')])
    .then(([english, norwegian]) => ({ english, norwegian }))
    .catch(() => {
      pending = undefined
      return null
    })
  return pending
}
