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

  try {
    window.sessionStorage.setItem('github-pages-redirect', window.location.href)
  } catch {
    return
  }

  window.location.replace(basePath)
})()
