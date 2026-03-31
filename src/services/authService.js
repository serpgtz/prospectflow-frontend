import api from '../api/axios'

export async function login(credentials) {
  const { data } = await api.post('/api/auth/login', credentials)
  return data
}

export async function register(payload) {
  const { data } = await api.post('/api/auth/register', payload)
  return data
}
