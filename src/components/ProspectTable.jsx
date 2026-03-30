import { useEffect, useRef, useState } from 'react'

function getPhone(prospect) {
  return prospect?.telefono || prospect?.phone || prospect?.celular || '-'
}

function getProspectId(prospect) {
  const rawId =
    prospect?.id ||
    prospect?._id ||
    prospect?.prospect_id ||
    prospect?.prospecto_id ||
    prospect?.prospectId ||
    prospect?.uuid ||
    null

  if (rawId && typeof rawId === 'object') {
    return rawId.$oid || rawId.id || null
  }

  return rawId
}

function getDocLink(prospect, key) {
  if (key === 'comprobante') {
    return prospect?.comprobante_url || prospect?.comprobanteUrl || ''
  }

  return prospect?.identificacion_url || prospect?.identificacionUrl || ''
}

function getDocType(prospect, key) {
  if (key === 'comprobante') {
    return prospect?.comprobante_type || 'other'
  }

  return prospect?.identificacion_type || 'other'
}

function formatNivelVenta(value) {
  if (!value || typeof value !== 'string') {
    return '-'
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return '-'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function getNivelVentaClass(value) {
  if (!value || typeof value !== 'string') {
    return 'nivel-venta-badge nivel-venta-empty'
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'caliente') {
    return 'nivel-venta-badge nivel-venta-caliente'
  }

  if (normalized === 'tibio') {
    return 'nivel-venta-badge nivel-venta-tibio'
  }

  if (normalized === 'frio') {
    return 'nivel-venta-badge nivel-venta-frio'
  }

  return 'nivel-venta-badge nivel-venta-empty'
}

function getRowClass(prospect) {
  const nivelVenta = String(prospect?.estado || prospect?.nivel_venta || '').trim().toLowerCase()
  return nivelVenta === 'caliente' ? 'prospect-row-caliente' : ''
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const raw = String(value).trim()
  const dateLikeMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/)
  const date = dateLikeMatch
    ? new Date(Number(dateLikeMatch[1]), Number(dateLikeMatch[2]) - 1, Number(dateLikeMatch[3]))
    : new Date(raw)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString('es-MX')
}

function isWithinNext72Hours(value) {
  if (!value) {
    return false
  }

  const targetDate = new Date(value)

  if (Number.isNaN(targetDate.getTime())) {
    return false
  }

  const now = new Date()
  const diffMs = targetDate.getTime() - now.getTime()
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000

  return diffMs >= 0 && diffMs <= seventyTwoHoursMs
}

function CommentCell({ text }) {
  const [showAll, setShowAll] = useState(false)
  const comments =
    typeof text === 'string'
      ? text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      : []

  const latestComment = comments.length > 0 ? comments[comments.length - 1] : '-'
  const fullComments = comments.length > 0 ? comments.join('\n') : '-'
  const visibleText = showAll ? fullComments : latestComment
  const isTruncatable = visibleText.length > 140
  const displayText = isTruncatable ? `${visibleText.slice(0, 140)}...` : visibleText

  return (
    <div className="comment-cell">
      <span style={{ whiteSpace: showAll ? 'pre-line' : 'normal' }}>{displayText}</span>
      {comments.length > 1 && (
        <button
          type="button"
          className="comment-toggle"
          onClick={(event) => {
            event.stopPropagation()
            setShowAll((prev) => !prev)
          }}
        >
          {showAll ? 'Ocultar comentarios' : 'Comentarios'}
        </button>
      )}
    </div>
  )
}

export default function ProspectTable({
  prospects = [],
  isLoading = false,
  onEdit,
  onDelete,
  onRowClick = null,
  onPreviewDoc = () => {},
  deletingId = null,
}) {
  const tableWrapperRef = useRef(null)
  const scrollbarRef = useRef(null)
  const isSyncingFromTableRef = useRef(false)
  const isSyncingFromBarRef = useRef(false)
  const [scrollMetrics, setScrollMetrics] = useState({
    showBar: false,
    contentWidth: 0,
  })

  useEffect(() => {
    const updateScrollMetrics = () => {
      const wrapper = tableWrapperRef.current
      if (!wrapper) return

      const contentWidth = wrapper.scrollWidth
      const viewportWidth = wrapper.clientWidth
      const showBar = contentWidth > viewportWidth + 2

      setScrollMetrics({ showBar, contentWidth })
    }

    updateScrollMetrics()
    window.addEventListener('resize', updateScrollMetrics)
    const timer = window.setTimeout(updateScrollMetrics, 0)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', updateScrollMetrics)
    }
  }, [prospects, isLoading])

  const handleTableScroll = (event) => {
    if (!scrollbarRef.current || isSyncingFromBarRef.current) {
      return
    }

    isSyncingFromTableRef.current = true
    scrollbarRef.current.scrollLeft = event.currentTarget.scrollLeft
    window.requestAnimationFrame(() => {
      isSyncingFromTableRef.current = false
    })
  }

  const handleBarScroll = (event) => {
    if (!tableWrapperRef.current || isSyncingFromTableRef.current) {
      return
    }

    isSyncingFromBarRef.current = true
    tableWrapperRef.current.scrollLeft = event.currentTarget.scrollLeft
    window.requestAnimationFrame(() => {
      isSyncingFromBarRef.current = false
    })
  }

  if (isLoading) {
    return <p className="status-text">Cargando prospectos...</p>
  }

  if (!prospects.length) {
    return <p className="status-text">No hay prospectos para mostrar.</p>
  }

  return (
    <>
      <div className="table-wrapper" ref={tableWrapperRef} onScroll={handleTableScroll}>
        <table className="prospect-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido paterno</th>
            <th>Apellido materno</th>
            <th>Fecha creación</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Próximo contacto</th>
            <th>Comentarios</th>
            <th>Documentos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((prospect) => {
            const prospectId = getProspectId(prospect)
            const comprobanteLink = getDocLink(prospect, 'comprobante')
            const identificacionLink = getDocLink(prospect, 'identificacion')
            const comprobanteType = getDocType(prospect, 'comprobante')
            const identificacionType = getDocType(prospect, 'identificacion')
            const isCloseContact = isWithinNext72Hours(prospect.proximo_contacto)

            return (
              <tr
                key={prospectId || `${prospect.nombre}-${prospect.apellido_paterno}`}
                className={`${getRowClass(prospect)} ${onRowClick ? 'prospect-row-clickable' : ''}`.trim()}
                onClick={() => {
                  if (onRowClick) {
                    onRowClick(prospect)
                  }
                }}
              >
                <td>{prospect.nombre || '-'}</td>
                <td>{prospect.apellido_paterno || '-'}</td>
                <td>{prospect.apellido_materno || '-'}</td>
                <td>{formatDate(prospect.fecha_creacion)}</td>
                <td>{getPhone(prospect)}</td>
                <td>
                  <span className={getNivelVentaClass(prospect.estado || prospect.nivel_venta)}>
                    {formatNivelVenta(prospect.estado || prospect.nivel_venta)}
                  </span>
                </td>
                <td className={isCloseContact ? 'contact-soon' : ''}>
                  {formatDate(prospect.proximo_contacto)}
                </td>
                <td>
                  <CommentCell text={prospect.comentarios} />
                </td>
                <td>
                  <div className="doc-links">
                    {comprobanteLink ? (
                      <div className="doc-row">
                        {comprobanteType === 'image' && (
                          <img
                            src={comprobanteLink}
                            alt="Miniatura comprobante"
                            className="doc-thumb"
                            loading="lazy"
                          />
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={(event) => {
                            event.stopPropagation()
                            onPreviewDoc(comprobanteLink, 'Comprobante', comprobanteType)
                          }}
                        >
                          Vista previa
                        </button>
                        <a
                          href={comprobanteLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Abrir
                        </a>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                    {identificacionLink ? (
                      <div className="doc-row">
                        {identificacionType === 'image' && (
                          <img
                            src={identificacionLink}
                            alt="Miniatura identificación"
                            className="doc-thumb"
                            loading="lazy"
                          />
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={(event) => {
                            event.stopPropagation()
                            onPreviewDoc(identificacionLink, 'Identificación', identificacionType)
                          }}
                        >
                          Vista previa
                        </button>
                        <a
                          href={identificacionLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Abrir
                        </a>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={(event) => {
                        event.stopPropagation()
                        if (onRowClick) {
                          onRowClick(prospect)
                        }
                      }}
                    >
                      Seguimiento
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(prospect)
                      }}
                      disabled={!prospectId}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDelete(prospect)
                      }}
                      disabled={!prospectId || deletingId === prospectId}
                    >
                      {deletingId === prospectId ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
        </table>
      </div>

      {scrollMetrics.showBar && (
        <div className="table-scrollbar" ref={scrollbarRef} onScroll={handleBarScroll}>
          <div className="table-scrollbar-content" style={{ width: scrollMetrics.contentWidth }} />
        </div>
      )}
    </>
  )
}
