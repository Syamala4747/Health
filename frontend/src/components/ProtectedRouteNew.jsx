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
        const roleResult = await getUserRole(user.uid)
        console.log('✅ ProtectedRoute: User role result:', roleResult)
        
        // Handle both string and object returns from getUserRole
        const role = typeof roleResult === 'string' ? roleResult : roleResult?.role
        console.log('✅ ProtectedRoute: Extracted role:', role)
        setUserRole(role)
        
        // Check if user has required role
        if (requiredRole && role !== requiredRole) {
          console.log('❌ ProtectedRoute: Access denied. Required:', requiredRole, 'User has:', role)
          setAccessDenied(true)
        }
      } catch (error) {
        console.error('❌ ProtectedRoute: Error checking user role:', error)
        console.error('❌ Full error details:', error)
        
        // Handle approval-related errors specially
        if (error.message.includes('not approved') || error.message.includes('pending approval')) {
          // In development mode, allow counselor access with warning
          if (process.env.NODE_ENV === 'development' && requiredRole === 'counsellor') {
            console.warn('⚠️ Development mode: Allowing unapproved counselor access')
            setUserRole('counsellor')
            setAccessDenied(false)
            return
          }
          
          // Show approval pending message and redirect to login
          setAccessDenied(true)
          setUserRole('pending')
          
          // Show the error message and redirect after a delay
          setTimeout(() => {
            alert(error.message)
            window.location.href = '/login'
          }, 500)
        } else if (error.message.includes('blocked')) {
          // Show blocked message and redirect to login
          setAccessDenied(true)
          setTimeout(() => {
            alert(error.message)
            window.location.href = '/login'
          }, 500)
        } else {
          setAccessDenied(true)
        }
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
    
    // Handle pending approval case
    if (userRole === 'pending') {
      return <ApprovalPendingPage />
    }
    
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

// Component for users whose accounts are pending approval
const ApprovalPendingPage = () => {
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
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
        <p className="text-gray-600 mb-6">
          Your counsellor account is not approved by the admin yet. Please wait for approval before you can access the system.
        </p>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>What happens next?</strong><br />
              • An administrator will review your application<br />
              • You'll receive access once approved<br />
              • Please check back later or contact support
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
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