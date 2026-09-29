import { useEffect, useRef } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import styles from './Modal.module.css'
export default function Modal({ title, onClose, children }) {
  const ref = useRef(null)
  const { t } = useLanguage()
  useEffect(() => {
    const dialog = ref.current
    const trigger = document.activeElement
    dialog.showModal()
    dialog.querySelector('input, select')?.focus()
    return () => {
      dialog.close()
      if (trigger?.isConnected && !trigger.matches(':disabled')) trigger.focus()
      else document.getElementById('main')?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={title}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        // Contain keyboard focus even at the boundary with the browser toolbar.
        const controls = [
          ...event.currentTarget.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length)
        const first = controls[0]
        const last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose()
      }}
    >
      <div className={styles.heading}>
        <h2>{title}</h2>
        <button type="button" onClick={onClose}>
          {t('Close')}
        </button>
      </div>
      {children}
    </dialog>
  )
}
