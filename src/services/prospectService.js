import api from '../api/axios'

export async function getProspects({ page = 1, limit = 5 } = {}) {
  const { data } = await api.get('/prospects', {
    params: { page, limit },
  })
  return data
}

export async function searchProspects(query, { page = 1, limit = 5 } = {}) {
  const { data } = await api.get('/prospects/search', {
    params: { q: query, page, limit },
  })
  return data
}

export async function getProspectById(id) {
  const { data } = await api.get(`/prospects/${id}`)
  return data
}

export async function createProspect(formData) {
  const { data } = await api.post('/prospects', formData)
  return data
}

export async function updateProspect(id, payload) {
  const { data } = await api.put(`/prospects/${id}`, payload)
  return data
}

export async function deleteProspect(id) {
  const { data } = await api.delete(`/prospects/${id}`)
  return data
}

export async function downloadProspectDocument(url) {
  const { data, headers } = await api.get(url, { responseType: 'blob' })
  return { blob: data, contentType: headers?.['content-type'] || '' }
}
