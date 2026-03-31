import { useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'

export default function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [token])

  const login = async (credentials) => {
    setIsLoading(true)

    try {
      const data = await authService.login(credentials)
      const nextToken = data?.token

      if (!nextToken) {
        throw new Error('Respuesta inválida del servidor: no se recibió token.')
      }

      setToken(nextToken)
      setUser(data?.user ?? null)
      return { success: true }
    } catch (error) {
      const apiMessage = error.response?.data?.message
      const message = apiMessage || 'No se pudo iniciar sesión.'
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload) => {
    setIsLoading(true)

    try {
      await authService.register(payload)
      return { success: true, message: 'Cuenta creada. Ahora inicia sesión.' }
    } catch (error) {
      const apiMessage = error.response?.data?.message
      const message = apiMessage || 'No se pudo completar el registro.'
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  return {
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  }
}
