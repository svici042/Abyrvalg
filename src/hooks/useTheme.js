import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

// Keep context access in one hook shared by interface components.
export function useTheme() {
  return useContext(ThemeContext)
}
