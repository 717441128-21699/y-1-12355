import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Layout } from "@/components/layout"
import { ProtectedRoute } from "@/components/auth"
import { useAuthStore } from "@/store/authStore"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import Petitions from "@/pages/Petitions"
import Clues from "@/pages/Clues"
import Approvals from "@/pages/Approvals"
import Cases from "@/pages/Cases"
import Trials from "@/pages/Trials"
import Reports from "@/pages/Reports"
import Settings from "@/pages/Settings"
import { UserRole } from "../shared/types"

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      await checkAuth()
      setLoading(false)
    }
    init()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">系统加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="petitions" element={<Petitions />} />
          <Route path="clues" element={<Clues />} />
          <Route
            path="approvals"
            element={
              <ProtectedRoute requiredRoles={['dept_head', 'case_office', 'leader'] as UserRole[]}>
                <Approvals />
              </ProtectedRoute>
            }
          />
          <Route path="cases" element={<Cases />} />
          <Route
            path="trials"
            element={
              <ProtectedRoute requiredRoles={['case_office', 'leader'] as UserRole[]}>
                <Trials />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute requiredRoles={['case_office', 'leader'] as UserRole[]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
