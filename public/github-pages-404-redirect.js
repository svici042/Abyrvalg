// GitHub Pages serves this fallback for deep links; the app shell restores the route.
;(function redirectGitHubPagesRoute() {
  const basePath = '/Abyrvalg/'
  const currentPath = window.location.pathname

  if (
    currentPath === basePath ||
    currentPath === basePath.slice(0, -1) ||
    !currentPath.startsWith(basePath)
  ) {
    return
  }

  // Keep the full destination in this tab, including its query string and fragment.
  try {
    window.sessionStorage.setItem('github-pages-redirect', window.location.href)
  } catch {
    return
  }

  window.location.replace(basePath)
})()
