import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '../../../shared/types'
import { Alert } from '@/components/ui'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading, checkAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      checkAuth()
    }
  }, [isAuthenticated, loading, checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4" />
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <Alert
            variant="danger"
            title="访问被拒绝"
            message="您没有权限访问此页面。如需访问，请联系系统管理员获取相应权限。"
          />
          <div className="mt-4 text-center">
            <button
              onClick={() => window.history.back()}
              className="text-primary-700 hover:text-primary-800 font-medium"
            >
              ← 返回上一页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
