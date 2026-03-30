import { useState } from 'react'

export default function Login({ auth }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Completa email y password.')
      return
    }

    const result = await auth.login(form)

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
            <p>Inicia sesión para gestionar tus prospectos.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
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

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={auth.isLoading}>
            {auth.isLoading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  )
}
