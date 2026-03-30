import { useEffect } from 'react'

function getExtension(url) {
  const cleanUrl = url.split('?')[0].toLowerCase()
  const chunks = cleanUrl.split('.')
  return chunks.length > 1 ? chunks[chunks.length - 1] : ''
}

function resolveType(url) {
  const extension = getExtension(url)

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension)) {
    return 'image'
  }

  if (extension === 'pdf') {
    return 'pdf'
  }

  return 'other'
}

export default function DocumentPreviewModal({ document, onClose }) {
  useEffect(() => {
    if (!document) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [document, onClose])

  if (!document) {
    return null
  }

  const contentType = document.contentType || ''
  const type = document.type
    ? document.type
    : contentType.startsWith('image/')
      ? 'image'
      : contentType.includes('pdf')
        ? 'pdf'
        : resolveType(document.url)

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(event) => event.stopPropagation()}>
        <header className="preview-header">
          <h3>{document.label}</h3>
          <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className="preview-content">
          {type === 'image' && <img src={document.url} alt={document.label} className="preview-image" />}
          {type === 'pdf' && <iframe title={document.label} src={document.url} className="preview-frame" />}
          {type === 'other' && (
            <p>
              Formato no soportado para preview.{' '}
              <a href={document.url} target="_blank" rel="noreferrer">
                Abrir documento
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
