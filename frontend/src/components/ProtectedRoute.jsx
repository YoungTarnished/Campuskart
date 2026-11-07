import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, admin = false, verified = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-slate-500">Loading your campus account...</div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (verified && !user.isVerified) return <Navigate to="/dashboard" replace />
  return children
}
