import { useEffect } from 'react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      onClose()
    }, 2600)

    return () => window.clearTimeout(timeout)
  }, [toast, onClose])

  if (!toast) {
    return null
  }

  return (
    <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
      <span>{toast.message}</span>
      <button type="button" className="toast-close" onClick={onClose}>
        x
      </button>
    </div>
  )
}
