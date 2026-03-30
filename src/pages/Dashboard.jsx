import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Pagination from '../components/Pagination'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import ProspectFollowUpModal from '../components/ProspectFollowUpModal'
import ProspectTable from '../components/ProspectTable'
import SearchBar from '../components/SearchBar'
import Toast from '../components/Toast'
import {
  createProspect,
  deleteProspect,
  getProspects,
  searchProspects,
  updateProspect,
} from '../services/prospectService'

const PAGE_SIZE = 8
const SCORE_OPTIONS = ['A', 'B', 'C']

function ScoreCheckboxGroup({ label, name, value, onChange, prefix }) {
  return (
    <fieldset className="score-fieldset">
      <legend>{label}</legend>
      <div className="score-checkbox-group">
        {SCORE_OPTIONS.map((option) => (
          <label key={`${prefix}-${name}-${option}`} className="score-checkbox-option">
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function pickFirst(source, keys, fallback = '') {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return fallback
}

function toAbsoluteFileUrl(value) {
  if (!value) {
    return ''
  }

  if (typeof value !== 'string') {
    return ''
  }

  if (value.startsWith('/prospectos/')) {
    return `http://localhost:3000/api/prospects/file?path=${encodeURIComponent(value)}`
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  if (value.startsWith('/')) {
    return `http://localhost:3000${value}`
  }

  return `http://localhost:3000/${value}`
}

function extractFileReference(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return extractFileReference(value[0])
  }

  if (typeof value === 'object') {
    return (
      value.url ||
      value.path ||
      value.location ||
      value.fileUrl ||
      value.secure_url ||
      value.downloadUrl ||
      ''
    )
  }

  return ''
}

function inferDocumentType(reference) {
  if (!reference || typeof reference !== 'string') {
    return 'other'
  }

  const clean = reference.split('?')[0].toLowerCase()

  if (clean.endsWith('.pdf')) {
    return 'pdf'
  }

  if (
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.bmp')
  ) {
    return 'image'
  }

  return 'other'
}

function splitLastNames(fullLastName = '') {
  const parts = String(fullLastName).trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return { apellidoPaterno: '', apellidoMaterno: '' }
  }

  if (parts.length === 1) {
    return { apellidoPaterno: parts[0], apellidoMaterno: '' }
  }

  return {
    apellidoPaterno: parts[0],
    apellidoMaterno: parts.slice(1).join(' '),
  }
}

function getErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message
  }

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    const firstError = responseData.errors[0]
    if (typeof firstError === 'string') {
      return firstError
    }
    if (typeof firstError?.msg === 'string') {
      return firstError.msg
    }
  }

  return fallbackMessage
}

function formatDisplayDate(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const dateLikeMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/)
  const date = dateLikeMatch
    ? new Date(Number(dateLikeMatch[1]), Number(dateLikeMatch[2]) - 1, Number(dateLikeMatch[3]))
    : new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-MX')
}

function formatCommentTimestamp(value) {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString('es-MX')
  }

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeProspect(raw) {
  const id = pickFirst(raw, ['id', '_id', 'prospect_id', 'prospecto_id', 'prospectId', 'uuid'], null)
  const nombre = pickFirst(raw, ['nombre', 'name'])
  const fullLastName = pickFirst(raw, ['apellidos', 'lastName', 'apellido', 'apellidos_completos'])
  const apellidoPaternoRaw = pickFirst(raw, ['apellido_paterno', 'apellidoPaterno', 'paterno'])
  const apellidoMaternoRaw = pickFirst(raw, ['apellido_materno', 'apellidoMaterno', 'materno'])
  const parsedLastName = fullLastName ? fullLastName.split(/\s+/).filter(Boolean) : []
  const apellidoPaterno = apellidoPaternoRaw || parsedLastName[0] || ''
  const apellidoMaterno =
    apellidoMaternoRaw || (parsedLastName.length > 1 ? parsedLastName.slice(1).join(' ') : '')
  const telefono = pickFirst(raw, ['telefono', 'phone', 'celular'])
  const dependencia = pickFirst(raw, ['dependencia'])
  const ingresos = pickFirst(raw, ['ingresos'])
  const comentarios = pickFirst(raw, ['comentarios', 'notas', 'observaciones'])
  const proximoContacto = pickFirst(raw, ['proximo_contacto', 'proximoContacto'])
  const perfil = pickFirst(raw, ['perfil'])
  const interes = pickFirst(raw, ['interes'])
  const decision = pickFirst(raw, ['decision'])
  const scoreTotal = pickFirst(raw, ['score_total'], null)
  const nivelVenta = pickFirst(raw, ['estado', 'nivel_venta'])
  const fechaCreacion = pickFirst(raw, ['fecha_creacion', 'fechaCreacion', 'createdAt'])
  const comprobanteRef = extractFileReference(
    pickFirst(raw, [
      'comprobante_ingresos',
      'comprobante_url',
      'comprobanteUrl',
      'comprobante',
      'archivo_comprobante',
    ]),
  )
  const identificacionRef = extractFileReference(
    pickFirst(raw, [
      'identificacion_url',
      'identificacionUrl',
      'identificacion',
      'archivo_identificacion',
    ]),
  )
  const comprobanteUrl = toAbsoluteFileUrl(
    comprobanteRef,
  )
  const identificacionUrl = toAbsoluteFileUrl(identificacionRef)

  return {
    ...raw,
    id,
    nombre,
    apellidos: fullLastName || [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ').trim(),
    apellido_paterno: apellidoPaterno,
    apellido_materno: apellidoMaterno,
    telefono,
    dependencia,
    ingresos,
    comentarios,
    proximo_contacto: proximoContacto,
    perfil,
    interes,
    decision,
    score_total: scoreTotal,
    estado: nivelVenta,
    nivel_venta: nivelVenta,
    fecha_creacion: fechaCreacion,
    comprobante_url: comprobanteUrl,
    comprobante_type: inferDocumentType(comprobanteRef),
    identificacion_url: identificacionUrl,
    identificacion_type: inferDocumentType(identificacionRef),
  }
}

function normalizeList(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.prospects)
        ? payload.prospects
        : []

  return list.map(normalizeProspect)
}

function normalizeConcentrado(payload) {
  const source = payload?.concentrado || payload?.meta?.concentrado || {}

  return {
    caliente: Number(source?.caliente || 0),
    tibio: Number(source?.tibio || 0),
    frio: Number(source?.frio || 0),
    sin_estado: Number(source?.sin_estado || 0),
  }
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

function getPhone(prospect) {
  return prospect?.telefono || prospect?.phone || prospect?.celular || ''
}

const initialCreateForm = {
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',
  dependencia: '',
  ingresos: '',
  perfil: '',
  interes: '',
  decision: '',
  fecha_creacion: '',
  proximo_contacto: '',
  comentarios: '',
  comprobante: null,
  identificacion: null,
}

export default function Dashboard({ auth }) {
  const editSectionRef = useRef(null)
  const [prospects, setProspects] = useState([])
  const [concentrado, setConcentrado] = useState({
    caliente: 0,
    tibio: 0,
    frio: 0,
    sin_estado: 0,
  })
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isFollowUpSaving, setIsFollowUpSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm] = useState(initialCreateForm)
  const [editForm, setEditForm] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [followUpProspect, setFollowUpProspect] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  const closeToast = () => setToast(null)

  const fetchProspects = useCallback(async (searchTerm = '') => {
    setIsLoading(true)

    try {
      const data = searchTerm ? await searchProspects(searchTerm) : await getProspects()
      setProspects(normalizeList(data))
      setConcentrado(searchTerm ? { caliente: 0, tibio: 0, frio: 0, sin_estado: 0 } : normalizeConcentrado(data))
      setCurrentPage(1)
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo cargar la lista de prospectos.')
      showToast('error', message)
      setProspects([])
      setConcentrado({ caliente: 0, tibio: 0, frio: 0, sin_estado: 0 })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCurrentList = async () => {
    await fetchProspects(query.trim())
  }

  useEffect(() => {
    fetchProspects('')
  }, [fetchProspects])

  useEffect(() => {
    const trimmed = query.trim()

    const timeout = window.setTimeout(() => {
      fetchProspects(trimmed)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [query, fetchProspects])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateScoreChange = (event) => {
    const { name, value, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: checked ? value : '' }))
  }

  const handleFileChange = (event) => {
    const { name, files } = event.target
    setForm((prev) => ({ ...prev, [name]: files?.[0] || null }))
  }

  const handleCreateProspect = async (event) => {
    event.preventDefault()

    if (
      !form.nombre ||
      !form.apellido_paterno ||
      !form.telefono ||
      !form.dependencia ||
      !form.ingresos ||
      !form.perfil ||
      !form.interes ||
      !form.decision
    ) {
      showToast(
        'error',
        'Completa los campos obligatorios: nombre, apellido paterno, teléfono, dependencia, ingresos, perfil, interés y decisión.',
      )
      return
    }

    const apellidos = [form.apellido_paterno, form.apellido_materno].filter(Boolean).join(' ').trim()

    const payload = new FormData()
    payload.append('nombre', form.nombre)
    payload.append('apellidos', apellidos)
    payload.append('telefono', form.telefono)
    payload.append('dependencia', form.dependencia)
    payload.append('ingresos', form.ingresos)
    payload.append('perfil', form.perfil)
    payload.append('interes', form.interes)
    payload.append('decision', form.decision)

    if (form.proximo_contacto) {
      payload.append('proximo_contacto', form.proximo_contacto)
    }

    if (form.comentarios) {
      payload.append('comentarios', form.comentarios)
    }

    if (form.comprobante) {
      payload.append('comprobante', form.comprobante)
    }

    if (form.identificacion) {
      payload.append('identificacion', form.identificacion)
    }

    setIsSaving(true)

    try {
      await createProspect(payload)
      showToast('success', 'Prospecto creado correctamente.')
      setForm(initialCreateForm)
      await refreshCurrentList()
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo crear el prospecto.')
      showToast('error', message)
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (prospect) => {
    const prospectId = getProspectId(prospect)

    if (!prospectId) {
      showToast('error', 'No se pudo editar: el prospecto no tiene identificador válido.')
      return
    }

    const splitNames = splitLastNames(prospect.apellidos)

    setEditForm({
      id: prospectId,
      nombre: prospect.nombre || '',
      apellido_paterno: prospect.apellido_paterno || splitNames.apellidoPaterno,
      apellido_materno: prospect.apellido_materno || splitNames.apellidoMaterno,
      telefono: getPhone(prospect),
      dependencia: prospect.dependencia || '',
      ingresos: prospect.ingresos || '',
      perfil: prospect.perfil || '',
      interes: prospect.interes || '',
      decision: prospect.decision || '',
      fecha_creacion: prospect.fecha_creacion || '',
      proximo_contacto: prospect.proximo_contacto ? String(prospect.proximo_contacto).slice(0, 10) : '',
      comentarios: prospect.comentarios || '',
      comprobante: null,
      identificacion: null,
    })
  }

  const cancelEdit = () => setEditForm(null)

  const openFollowUpModal = (prospect) => {
    setFollowUpProspect(prospect)
  }

  const closeFollowUpModal = () => {
    if (isFollowUpSaving) {
      return
    }

    setFollowUpProspect(null)
  }

  const handleEditInputChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditScoreChange = (event) => {
    const { name, value, checked } = event.target
    setEditForm((prev) => ({ ...prev, [name]: checked ? value : '' }))
  }

  const handleEditFileChange = (event) => {
    const { name, files } = event.target
    setEditForm((prev) => ({ ...prev, [name]: files?.[0] || null }))
  }

  const handleUpdateProspect = async (event) => {
    event.preventDefault()

    if (!editForm?.id) {
      showToast('error', 'No hay prospecto seleccionado para editar.')
      return
    }

    if (
      !editForm.nombre ||
      !editForm.apellido_paterno ||
      !editForm.telefono ||
      !editForm.dependencia ||
      !editForm.ingresos ||
      !editForm.perfil ||
      !editForm.interes ||
      !editForm.decision
    ) {
      showToast(
        'error',
        'Completa los campos obligatorios: nombre, apellido paterno, teléfono, dependencia, ingresos, perfil, interés y decisión.',
      )
      return
    }

    const apellidos = [editForm.apellido_paterno, editForm.apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim()

    setIsUpdating(true)

    try {
      const payload = new FormData()
      payload.append('nombre', editForm.nombre)
      payload.append('apellidos', apellidos)
      payload.append('telefono', editForm.telefono)
      payload.append('dependencia', editForm.dependencia)
      payload.append('ingresos', editForm.ingresos)
      payload.append('perfil', editForm.perfil)
      payload.append('interes', editForm.interes)
      payload.append('decision', editForm.decision)
      payload.append('comentarios', editForm.comentarios || '')

      if (editForm.proximo_contacto) {
        payload.append('proximo_contacto', editForm.proximo_contacto)
      }

      if (editForm.comprobante) {
        payload.append('comprobante', editForm.comprobante)
      }

      if (editForm.identificacion) {
        payload.append('identificacion', editForm.identificacion)
      }

      await updateProspect(editForm.id, payload)

      showToast('success', 'Prospecto actualizado correctamente.')
      setEditForm(null)
      await refreshCurrentList()
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo actualizar el prospecto.')
      showToast('error', message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProspect = async (prospect) => {
    const prospectId = getProspectId(prospect)

    if (!prospectId) {
      showToast('error', 'No se pudo eliminar: el prospecto no tiene identificador válido.')
      return
    }

    const confirmed = window.confirm('¿Seguro que deseas eliminar este prospecto?')

    if (!confirmed) {
      return
    }

    setDeletingId(prospectId)

    try {
      await deleteProspect(prospectId)
      showToast('success', 'Prospecto eliminado correctamente.')

      if (editForm?.id === prospectId) {
        setEditForm(null)
      }
      if (getProspectId(followUpProspect) === prospectId) {
        setFollowUpProspect(null)
      }

      await refreshCurrentList()
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo eliminar el prospecto.')
      showToast('error', message)
    } finally {
      setDeletingId(null)
    }
  }

  const totalResults = useMemo(() => prospects.length, [prospects])
  const totalConcentrado = useMemo(() => {
    return concentrado.caliente + concentrado.tibio + concentrado.frio + concentrado.sin_estado
  }, [concentrado])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalResults / PAGE_SIZE)),
    [totalResults],
  )

  const pagedProspects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return prospects.slice(start, start + PAGE_SIZE)
  }, [prospects, currentPage])

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return
    }

    setCurrentPage(nextPage)
  }

  const openPreview = async (url, label, type = 'other') => {
    if (!url) {
      showToast('error', 'El documento no tiene una URL válida.')
      return
    }

    setPreviewDoc({ url, label, type })
  }

  const closePreview = () => {
    setPreviewDoc(null)
  }

  const handleSaveFollowUp = async ({ commentDate, newComment, nextContactDate }) => {
    if (!followUpProspect) {
      showToast('error', 'No hay prospecto seleccionado para seguimiento.')
      return
    }

    const prospectId = getProspectId(followUpProspect)
    if (!prospectId) {
      showToast('error', 'No se pudo guardar el seguimiento: identificador no válido.')
      return
    }

    const trimmedComment = String(newComment || '').trim()
    if (!trimmedComment) {
      showToast('error', 'Escribe un comentario para guardar el seguimiento.')
      return
    }

    const splitNames = splitLastNames(followUpProspect.apellidos)
    const apellidoPaterno = followUpProspect.apellido_paterno || splitNames.apellidoPaterno
    const apellidoMaterno = followUpProspect.apellido_materno || splitNames.apellidoMaterno
    const apellidos = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ').trim()

    const entryDate = formatCommentTimestamp(commentDate)
    const newCommentEntry = `[${entryDate}] ${trimmedComment}`
    const existingComments = String(followUpProspect.comentarios || '').trim()
    const combinedComments = existingComments
      ? `${existingComments}\n${newCommentEntry}`
      : newCommentEntry

    setIsFollowUpSaving(true)

    try {
      const payload = new FormData()
      payload.append('nombre', followUpProspect.nombre || '')
      payload.append('apellidos', apellidos)
      payload.append('telefono', getPhone(followUpProspect))
      payload.append('dependencia', followUpProspect.dependencia || '')
      payload.append('ingresos', followUpProspect.ingresos || '')
      payload.append('perfil', followUpProspect.perfil || '')
      payload.append('interes', followUpProspect.interes || '')
      payload.append('decision', followUpProspect.decision || '')
      payload.append('comentarios', combinedComments)

      if (nextContactDate) {
        payload.append('proximo_contacto', nextContactDate)
      }

      await updateProspect(prospectId, payload)
      showToast('success', 'Seguimiento guardado correctamente.')
      setFollowUpProspect(null)
      await refreshCurrentList()
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo guardar el seguimiento.')
      showToast('error', message)
    } finally {
      setIsFollowUpSaving(false)
    }
  }

  useEffect(() => {
    if (!editForm || !editSectionRef.current) {
      return
    }

    editSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [editForm])

  return (
    <main className="dashboard-layout">
      <Toast toast={toast} onClose={closeToast} />
      <DocumentPreviewModal document={previewDoc} onClose={closePreview} />
      <ProspectFollowUpModal
        key={getProspectId(followUpProspect) || 'followup-modal'}
        prospect={followUpProspect}
        onClose={closeFollowUpModal}
        onSave={handleSaveFollowUp}
        isSaving={isFollowUpSaving}
      />

      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img className="app-logo app-logo-dashboard" src="/logo-prospecthub.png" alt="ProspectHub" />
          <h1>Dashboard de Prospectos</h1>
          <p>Total encontrados: {totalResults}</p>
        </div>
        <button className="btn btn-secondary" onClick={auth.logout}>
          Cerrar sesión
        </button>
      </header>

      <section className="card">
        <h2>Búsqueda</h2>
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          isLoading={isLoading && query.trim().length > 0}
        />
      </section>

      <section className="card">
        <h2>Concentrado por estado</h2>
        <div className="estado-concentrado-grid">
          <article className="estado-card estado-caliente">
            <h3>Caliente</h3>
            <p>{concentrado.caliente}</p>
          </article>
          <article className="estado-card estado-tibio">
            <h3>Tibio</h3>
            <p>{concentrado.tibio}</p>
          </article>
          <article className="estado-card estado-frio">
            <h3>Frío</h3>
            <p>{concentrado.frio}</p>
          </article>
          <article className="estado-card estado-sin">
            <h3>Sin estado</h3>
            <p>{concentrado.sin_estado}</p>
          </article>
        </div>
        <p className="search-status">Total en concentrado: {totalConcentrado}</p>
      </section>

      <section className="card">
        <h2>Prospectos</h2>
        <ProspectTable
          prospects={pagedProspects}
          isLoading={isLoading}
          onRowClick={openFollowUpModal}
          onEdit={startEdit}
          onDelete={handleDeleteProspect}
          onPreviewDoc={openPreview}
          deletingId={deletingId}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </section>

      {editForm && (
        <section className="card" ref={editSectionRef}>
          <h2>Editar prospecto</h2>

          <form className="form-grid two-columns" onSubmit={handleUpdateProspect}>
            <label>
              Nombre
              <input name="nombre" value={editForm.nombre} onChange={handleEditInputChange} />
            </label>

            <label>
              Apellido paterno
              <input
                name="apellido_paterno"
                value={editForm.apellido_paterno}
                onChange={handleEditInputChange}
              />
            </label>

            <label>
              Apellido materno
              <input
                name="apellido_materno"
                value={editForm.apellido_materno}
                onChange={handleEditInputChange}
              />
            </label>

            <label>
              Teléfono
              <input name="telefono" value={editForm.telefono} onChange={handleEditInputChange} />
            </label>

            <label>
              Dependencia
              <select
                name="dependencia"
                value={editForm.dependencia}
                onChange={handleEditInputChange}
              >
                <option value="">Selecciona una dependencia</option>
                <option value="IMSS">IMSS</option>
                <option value="ISSSTE">ISSSTE</option>
                <option value="CFE">CFE</option>
                <option value="PEMEX">PEMEX</option>
              </select>
            </label>

            <label>
              Ingresos
              <input
                type="number"
                step="0.01"
                name="ingresos"
                value={editForm.ingresos}
                onChange={handleEditInputChange}
              />
            </label>

            <label>
              Fecha de creación
              <input value={formatDisplayDate(editForm.fecha_creacion) || '-'} readOnly disabled />
            </label>

            <ScoreCheckboxGroup
              label="Perfil"
              name="perfil"
              value={editForm.perfil}
              onChange={handleEditScoreChange}
              prefix="edit"
            />

            <ScoreCheckboxGroup
              label="Interés"
              name="interes"
              value={editForm.interes}
              onChange={handleEditScoreChange}
              prefix="edit"
            />

            <ScoreCheckboxGroup
              label="Decisión"
              name="decision"
              value={editForm.decision}
              onChange={handleEditScoreChange}
              prefix="edit"
            />

            <label>
              Próximo contacto
              <input
                type="date"
                name="proximo_contacto"
                value={editForm.proximo_contacto}
                onChange={handleEditInputChange}
              />
            </label>

            <label>
              Comentarios
              <textarea
                name="comentarios"
                value={editForm.comentarios}
                onChange={handleEditInputChange}
                rows={3}
              />
            </label>

            <label>
              Comprobante
              <input type="file" name="comprobante" onChange={handleEditFileChange} />
              {editForm.comprobante && (
                <span className="status-text">Archivo nuevo seleccionado: {editForm.comprobante.name}</span>
              )}
            </label>

            <label>
              Identificación
              <input type="file" name="identificacion" onChange={handleEditFileChange} />
              {editForm.identificacion && (
                <span className="status-text">Archivo nuevo seleccionado: {editForm.identificacion.name}</span>
              )}
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={isUpdating}>
                {isUpdating ? 'Guardando cambios...' : 'Guardar cambios'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={cancelEdit}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card">
        <h2>Crear prospecto</h2>

        <form className="form-grid two-columns" onSubmit={handleCreateProspect}>
          <label>
            Nombre
            <input name="nombre" value={form.nombre} onChange={handleInputChange} />
          </label>

          <label>
            Apellido paterno
            <input
              name="apellido_paterno"
              value={form.apellido_paterno}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Apellido materno
            <input
              name="apellido_materno"
              value={form.apellido_materno}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Teléfono
            <input name="telefono" value={form.telefono} onChange={handleInputChange} />
          </label>

          <label>
            Dependencia
            <select name="dependencia" value={form.dependencia} onChange={handleInputChange}>
              <option value="">Selecciona una dependencia</option>
              <option value="IMSS">IMSS</option>
              <option value="ISSSTE">ISSSTE</option>
              <option value="CFE">CFE</option>
              <option value="PEMEX">PEMEX</option>
            </select>
          </label>

          <label>
            Ingresos
            <input
              type="number"
              step="0.01"
              name="ingresos"
              value={form.ingresos}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Fecha de creación
            <input value="Se genera automáticamente al crear" readOnly disabled />
          </label>

          <ScoreCheckboxGroup
            label="Perfil"
            name="perfil"
            value={form.perfil}
            onChange={handleCreateScoreChange}
            prefix="create"
          />

          <ScoreCheckboxGroup
            label="Interés"
            name="interes"
            value={form.interes}
            onChange={handleCreateScoreChange}
            prefix="create"
          />

          <ScoreCheckboxGroup
            label="Decisión"
            name="decision"
            value={form.decision}
            onChange={handleCreateScoreChange}
            prefix="create"
          />

          <label>
            Próximo contacto
            <input
              type="date"
              name="proximo_contacto"
              value={form.proximo_contacto}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Comentarios
            <textarea
              name="comentarios"
              value={form.comentarios}
              onChange={handleInputChange}
              rows={3}
            />
          </label>

          <label>
            Comprobante
            <input type="file" name="comprobante" onChange={handleFileChange} />
          </label>

          <label>
            Identificación
            <input type="file" name="identificacion" onChange={handleFileChange} />
          </label>

          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Crear prospecto'}
          </button>
        </form>
      </section>
    </main>
  )
}
