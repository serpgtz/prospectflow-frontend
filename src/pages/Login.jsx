import { useState } from 'react'

export default function Login({ auth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const isRegisterMode = mode === 'register'

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setError('')
    setStatus('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')

    if (isRegisterMode) {
      if (!form.nombre || !form.email || !form.password || !form.confirmPassword) {
        setError('Completa nombre, email, password y confirmación.')
        return
      }

      if (form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        return
      }

      if (form.password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden.')
        return
      }

      const result = await auth.register({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      if (!result.success) {
        setError(result.message)
        return
      }

      setStatus(result.message || 'Cuenta creada correctamente.')
      setMode('login')
      setForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }))
      return
    }

    if (!form.email || !form.password) {
      setError('Completa email y password.')
      return
    }

    const result = await auth.login({
      email: form.email.trim(),
      password: form.password,
    })

    if (!result.success) {
      setError(result.message)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="auth-brand">
          <img className="app-logo app-logo-login" src="/logo-prospecthub.png" alt="ProspectHub" />
          <div className="auth-brand-text">
            <h1>CRM de Prospectos</h1>
            <p>
              {isRegisterMode
                ? 'Crea tu cuenta para empezar a gestionar prospectos.'
                : 'Inicia sesión para gestionar tus prospectos.'}
            </p>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          {isRegisterMode && (
            <label>
              Nombre
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="usuario@correo.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="********"
            />
          </label>

          {isRegisterMode && (
            <label>
              Confirmar password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="********"
              />
            </label>
          )}

          {status && <p className="status-text">{status}</p>}
          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={auth.isLoading}>
            {auth.isLoading ? 'Procesando...' : isRegisterMode ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>

          <button className="btn btn-secondary auth-mode-btn" type="button" onClick={toggleMode} disabled={auth.isLoading}>
            {isRegisterMode ? 'Ya tengo cuenta' : 'Quiero registrarme'}
          </button>
        </form>
      </section>
    </main>
  )
}
