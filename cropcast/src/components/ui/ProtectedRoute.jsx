import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-forest-700 font-medium text-sm">Loading CropCast...</p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}
