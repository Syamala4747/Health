import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, getUserRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    const checkUserAccess = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        console.log('🔍 ProtectedRoute: Checking access for user:', user.uid)
        const role = await getUserRole(user.uid)
        console.log('✅ ProtectedRoute: User role fetched:', role)
        setUserRole(role)
        
        // Check if user has required role
        if (requiredRole && role !== requiredRole) {
          console.log('❌ ProtectedRoute: Access denied. Required:', requiredRole, 'User has:', role)
          setAccessDenied(true)
        }
      } catch (error) {
        console.error('❌ ProtectedRoute: Error checking user role:', error)
        setAccessDenied(true)
      } finally {
        setLoading(false)
      }
    }

    checkUserAccess()
  }, [user, getUserRole, requiredRole])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('❌ ProtectedRoute: No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Show access denied if user doesn't have required role
  if (accessDenied || (requiredRole && userRole !== requiredRole)) {
    console.log('❌ ProtectedRoute: Access denied for role:', userRole, 'required:', requiredRole)
    return <AccessDeniedPage 
      title="Access Denied"
      message={`This page requires ${requiredRole} access. Your account has ${userRole || 'unknown'} permissions.`}
      userRole={userRole}
    />
  }

  console.log('✅ ProtectedRoute: Access granted for role:', userRole)
  // User is authenticated and has correct role
  return children
}

// Component for redirecting to login
const LoginRedirect = () => {
  useEffect(() => {
    window.location.href = '/login'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  )
}

// Component for pending approval state
const PendingApprovalPage = () => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
        <p className="text-gray-600 mb-6">
          Your account has been created successfully but is waiting for administrator approval. 
          You will be able to access the dashboard once your account is approved.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>What's next?</strong><br />
              Our administrators will review your account within 24-48 hours. 
              You will receive an email notification once approved.
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}

// Component for access denied states
const AccessDeniedPage = ({ title, message, userRole }) => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleGoToDashboard = () => {
    if (userRole === 'admin') {
      window.location.href = '/admin'
    } else if (userRole === 'counsellor') {
      window.location.href = '/counsellor'  
    } else if (userRole === 'student') {
      window.location.href = '/student'
    } else {
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Your Role:</strong> {userRole || 'Unknown'}<br />
              You can access your designated dashboard from the buttons below.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleGoToDashboard}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Go to My Dashboard
            </button>
            
            <button
              onClick={handleLogout}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProtectedRoute