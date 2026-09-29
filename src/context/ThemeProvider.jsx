import { useEffect } from 'react'
import { ThemeContext } from './ThemeContext'
import usePersistentState from '../hooks/usePersistentState'
import { validateTheme } from '../utils/storage'

export function ThemeProvider({ children }) {
  const [theme, setTheme, warning] = usePersistentState(
    'abyrvalg-theme',
    'light',
    validateTheme,
  )
  useEffect(() => {
    // A data attribute switches theme variables independently of cart state.
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        warning,
        toggleTheme: () =>
          setTheme((current) => (current === 'light' ? 'dark' : 'light')),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
