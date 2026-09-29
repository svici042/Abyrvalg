;(function restoreGitHubPagesDestination() {
  const storageKey = 'github-pages-redirect'
  const basePath = document.querySelector('meta[name="app-base-path"]')?.content

  if (!basePath) return

  let savedUrl
  try {
    const storage = window.sessionStorage
    savedUrl = storage.getItem(storageKey)
    if (savedUrl !== null) storage.removeItem(storageKey)
  } catch {
    return
  }

  if (!savedUrl) return

  let destination
  try {
    destination = new URL(savedUrl)
  } catch {
    return
  }

  if (
    destination.origin !== window.location.origin ||
    !(
      destination.pathname === basePath ||
      destination.pathname.startsWith(basePath)
    )
  ) {
    return
  }

  try {
    window.history.replaceState(
      null,
      '',
      `${destination.pathname}${destination.search}${destination.hash}`,
    )
  } catch {
    // Keep the application usable if the browser rejects history restoration.
  }
})()
