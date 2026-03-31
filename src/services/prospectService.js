import api from '../api/axios'

export async function getProspects() {
  const { data } = await api.get('/api/prospects')
  return data
}

export async function searchProspects(query) {
  const { data } = await api.get('/api/prospects/search', {
    params: { q: query },
  })
  return data
}

export async function getProspectById(id) {
  const { data } = await api.get(`/api/prospects/${id}`)
  return data
}

export async function createProspect(formData) {
  const { data } = await api.post('/api/prospects', formData)
  return data
}

export async function updateProspect(id, payload) {
  const { data } = await api.put(`/api/prospects/${id}`, payload)
  return data
}

export async function deleteProspect(id) {
  const { data } = await api.delete(`/api/prospects/${id}`)
  return data
}

export async function downloadProspectDocument(url) {
  const { data, headers } = await api.get(url, { responseType: 'blob' })
  return { blob: data, contentType: headers?.['content-type'] || '' }
}
