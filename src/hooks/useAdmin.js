import { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
// Keep access to browser-local administration state in one shared hook.
export const useAdmin = () => useContext(AdminContext)
