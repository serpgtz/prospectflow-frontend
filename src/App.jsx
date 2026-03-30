import { Navigate, Route, Routes } from 'react-router-dom'
import useAuth from './hooks/useAuth'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function PublicRoute({ isAuthenticated, children }) {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  const auth = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute isAuthenticated={auth.isAuthenticated}>
            <Login auth={auth} />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
            <Dashboard auth={auth} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={auth.isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  )
}
