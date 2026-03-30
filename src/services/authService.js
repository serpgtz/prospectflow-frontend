import api from '../api/axios'

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  return data
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}
