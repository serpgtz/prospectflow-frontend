import { useEffect, useMemo, useState } from 'react'

function toDateInputValue(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function ProspectFollowUpModal({ prospect, onClose, onSave, isSaving = false }) {
  const [commentDate, setCommentDate] = useState(() => toDateInputValue())
  const [newComment, setNewComment] = useState('')
  const [nextContactDate, setNextContactDate] = useState(() =>
    prospect?.proximo_contacto ? String(prospect.proximo_contacto).slice(0, 10) : '',
  )

  useEffect(() => {
    if (!prospect) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [prospect, onClose])

  const fullName = useMemo(() => {
    if (!prospect) {
      return ''
    }

    const names = [prospect.nombre, prospect.apellido_paterno, prospect.apellido_materno].filter(Boolean)
    return names.join(' ').trim()
  }, [prospect])

  if (!prospect) {
    return null
  }

  const formatScore = (value) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : '-'
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!newComment.trim()) {
      return
    }

    onSave({
      commentDate,
      newComment,
      nextContactDate,
    })
  }

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal followup-modal" onClick={(event) => event.stopPropagation()}>
        <header className="preview-header">
          <h3>Seguimiento de prospecto: {fullName || 'Sin nombre'}</h3>
          <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <form className="followup-form" onSubmit={handleSubmit}>
          <label>
            Score
            <input value={formatScore(prospect.score_total)} readOnly disabled />
          </label>
          <label>
            Historial de comentarios
            <textarea value={prospect.comentarios || 'Sin comentarios previos.'} rows={5} readOnly />
          </label>

          <label>
            Fecha y hora del comentario
            <input
              type="datetime-local"
              value={commentDate}
              onChange={(event) => setCommentDate(event.target.value)}
            />
          </label>

          <label>
            Nuevo comentario
            <textarea
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              rows={4}
              placeholder="Escribe aquí el seguimiento"
              required
            />
          </label>

          <label>
            Próximo contacto
            <input
              type="date"
              value={nextContactDate}
              onChange={(event) => setNextContactDate(event.target.value)}
            />
          </label>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando seguimiento...' : 'Guardar seguimiento'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
