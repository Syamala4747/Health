import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'

// Components
import Layout from './components/Layout.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import QuickDashboard from './components/QuickDashboard.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import CollegeHeadRegistration from './pages/CollegeHeadRegistration.jsx'
import CounselorRegistration from './pages/CounselorRegistration.jsx'
import ProtectedRoute from './components/ProtectedRouteNew.jsx'

// Lazy load essential admin components only
const UserApprovalUtility = lazy(() => import('./pages/admin/UserApprovalUtility.jsx'))
const SimplifiedAdminDashboard = lazy(() => import('./pages/admin/SimplifiedAdminDashboard.jsx'))
const AdminReportsPage = lazy(() => import('./pages/admin/Reports.jsx'))

// College Head components
const CollegeHeadDashboard = lazy(() => import('./pages/college_head/CollegeHeadDashboard.jsx'))
const CollegeHeadCounsellors = lazy(() => import('./pages/college_head/Counsellors.jsx'))
const CollegeHeadStudents = lazy(() => import('./pages/college_head/Students.jsx'))
const CollegeHeadAnalytics = lazy(() => import('./pages/college_head/Analytics.jsx'))
const CollegeHeadProfile = lazy(() => import('./pages/college_head/Profile.jsx'))
const StudentsManagement = lazy(() => import('./pages/college_head/StudentsManagement.jsx'))
const CounsellorsManagement = lazy(() => import('./pages/college_head/CounsellorsManagement.jsx'))
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'))

const CounsellorDashboard = lazy(() => import('./pages/counsellor/Dashboard.jsx'))
const MyStudents = lazy(() => import('./pages/counsellor/MyStudents.jsx'))
const ChatInterface = lazy(() => import('./pages/counsellor/ChatInterface.jsx'))
const CounsellorProfile = lazy(() => import('./pages/counsellor/Profile.jsx'))

const StudentDashboard = lazy(() => import('./pages/student/Dashboard.jsx'))
const StudentProfile = lazy(() => import('./pages/student/Profile.jsx'))
const StudentResources = lazy(() => import('./pages/student/Resources.jsx'))
const AssessmentScreen = lazy(() => import('./pages/student/AssessmentScreen.jsx'))
const ComprehensiveMoodAssessment = lazy(() => import('./pages/student/ComprehensiveMoodAssessment.jsx'))
const ComprehensiveAssessment = lazy(() => import('./pages/student/ComprehensiveAssessment.jsx'))
const AICounselor = lazy(() => import('./pages/student/AICounselor.jsx'))
const CounselorBooking = lazy(() => import('./pages/student/CounselorBooking.jsx'))
const StudentChatInterface = lazy(() => import('./pages/student/ChatInterface.jsx'))

// Simple redirect based on user role
const UserRedirect = () => {
  const { user, getUserRole } = useAuth()
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const role = await getUserRole(user.uid)
        setUserRole(role)
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [user, getUserRole])

  // Wait for role to load
  if (loading || !userRole) {
    return <LoadingScreen message="Loading dashboard..." showProgress={true} />
  }

  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />
  } else if (userRole === 'college_head') {
    return <Navigate to="/college-head" replace />
  } else if (userRole === 'counsellor') {
    return <Navigate to="/counsellor" replace />
  } else if (userRole === 'student') {
    return <Navigate to="/student" replace />
  } else {
    // If no role yet, go to student as default
    return <Navigate to="/student" replace />
  }
}

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <UserRedirect /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <UserRedirect /> : <RegisterPage />}
      />
      <Route
        path="/register/college-head"
        element={user ? <UserRedirect /> : <CollegeHeadRegistration />}
      />
      <Route
        path="/register/counselor"
        element={user ? <UserRedirect /> : <CounselorRegistration />}
      />




      {/* Admin Routes - Simplified for College Head Management Only */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<LoadingScreen message="Loading..." showProgress={true} />}>
            <Layout userRole="admin" />
          </Suspense>
        </ProtectedRoute>
      }>
        <Route index element={
          <Suspense fallback={<LoadingScreen message="Loading admin dashboard..." />}>
            <SimplifiedAdminDashboard />
          </Suspense>
        } />
        <Route path="user-approval" element={
          <Suspense fallback={<LoadingScreen message="Loading user approval utility..." />}>
            <UserApprovalUtility />
          </Suspense>
        } />
        <Route path="reports" element={
          <Suspense fallback={<LoadingScreen message="Loading reports..." />}>
            <AdminReportsPage />
          </Suspense>
        } />
      </Route>

      {/* College Head Routes */}
      <Route path="/college-head" element={
        <ProtectedRoute requiredRole="college_head">
          <Suspense fallback={<LoadingScreen message="Loading..." showProgress={true} />}>
            <Layout userRole="college_head" />
          </Suspense>
        </ProtectedRoute>
      }>
        <Route index element={
          <Suspense fallback={<LoadingScreen message="Loading college head dashboard..." />}>
            <CollegeHeadDashboard />
          </Suspense>
        } />
        <Route path="counsellors" element={
          <Suspense fallback={<LoadingScreen message="Loading counsellors..." />}>
            <CollegeHeadCounsellors />
          </Suspense>
        } />
        <Route path="students" element={
          <Suspense fallback={<LoadingScreen message="Loading students..." />}>
            <CollegeHeadStudents />
          </Suspense>
        } />
        <Route path="analytics" element={
          <Suspense fallback={<LoadingScreen message="Loading analytics..." />}>
            <CollegeHeadAnalytics />
          </Suspense>
        } />
        <Route path="students-management" element={
          <Suspense fallback={<LoadingScreen message="Loading students management..." />}>
            <StudentsManagement />
          </Suspense>
        } />
        <Route path="counsellors-management" element={
          <Suspense fallback={<LoadingScreen message="Loading counsellors management..." />}>
            <CounsellorsManagement />
          </Suspense>
        } />
        <Route path="reports" element={
          <Suspense fallback={<LoadingScreen message="Loading reports management..." />}>
            <AdminReports />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<LoadingScreen message="Loading profile..." />}>
            <CollegeHeadProfile />
          </Suspense>
        } />
      </Route>

      {/* Counsellor Routes */}
      <Route path="/counsellor" element={
        <ProtectedRoute requiredRole="counsellor">
          <Suspense fallback={<LoadingScreen message="Loading..." showProgress={true} />}>
            <Layout userRole="counsellor" />
          </Suspense>
        </ProtectedRoute>
      }>
        <Route path="quick" element={<QuickDashboard userRole="counsellor" />} />
        <Route index element={
          <Suspense fallback={<LoadingScreen message="Loading counsellor dashboard..." />}>
            <CounsellorDashboard />
          </Suspense>
        } />
        <Route path="students" element={
          <Suspense fallback={<LoadingScreen message="Loading students..." />}>
            <MyStudents />
          </Suspense>
        } />
        <Route path="chat/:studentId?" element={
          <Suspense fallback={<LoadingScreen message="Loading chat..." />}>
            <ChatInterface />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<LoadingScreen message="Loading profile..." />}>
            <CounsellorProfile />
          </Suspense>
        } />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute requiredRole="student">
          <Suspense fallback={<LoadingScreen message="Loading..." showProgress={true} />}>
            <Layout userRole="student" />
          </Suspense>
        </ProtectedRoute>
      }>
        <Route path="quick" element={<QuickDashboard userRole="student" />} />
        <Route index element={
          <Suspense fallback={<LoadingScreen message="Loading student dashboard..." />}>
            <StudentDashboard />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<LoadingScreen message="Loading profile..." />}>
            <StudentProfile />
          </Suspense>
        } />
        <Route path="resources" element={
          <Suspense fallback={<LoadingScreen message="Loading resources..." />}>
            <StudentResources />
          </Suspense>
        } />
        <Route path="assessment" element={
          <Suspense fallback={<LoadingScreen message="Loading assessment..." />}>
            <AssessmentScreen />
          </Suspense>
        } />
        <Route path="mood-assessment" element={
          <Suspense fallback={<LoadingScreen message="Loading comprehensive mood assessment..." />}>
            <ComprehensiveMoodAssessment />
          </Suspense>
        } />
        <Route path="comprehensive-assessment" element={
          <Suspense fallback={<LoadingScreen message="Loading mental health assessment..." />}>
            <ComprehensiveAssessment />
          </Suspense>
        } />
        <Route path="ai-counselor" element={
          <Suspense fallback={<LoadingScreen message="Loading AI counselor..." />}>
            <AICounselor />
          </Suspense>
        } />
        <Route path="counselor-booking" element={
          <Suspense fallback={<LoadingScreen message="Loading counselor booking..." />}>
            <CounselorBooking />
          </Suspense>
        } />
        <Route path="chat/:sessionId?" element={
          <Suspense fallback={<LoadingScreen message="Loading chat..." />}>
            <StudentChatInterface />
          </Suspense>
        } />
      </Route>

      {/* Default redirect based on authentication */}
      <Route path="/" element={
        user ? <UserRedirect /> : <Navigate to="/login" replace />
      } />

      <Route path="/unauthorized" element={
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2>Unauthorized Access</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      } />
    </Routes>
  )
}

export default App