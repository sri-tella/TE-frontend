import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login/Login'
import Register from './pages/Login/Register'
import ObsHome from './pages/ObsHome'
import InsHome from './pages/InsHome/InsHome'
import InstructorIntro from './pages/InstructorIntro/InstructorIntro'
import Profile from './pages/Profile/Profile'
import Evaluate from './pages/Evaluate/Evaluate'
import Recommendations from './pages/Recommendations/Recommendations'
import ReportViewer from './pages/ReportViewer/ReportViewer'
import ReportsList from './pages/ReportsList/ReportsList'
import AdminManagement from './pages/AdminManagement/AdminManagement'
import Help from './pages/Help/Help'
import Header from './components/Header/Header'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import './App.css'

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  
  const showHeader = isAuthenticated && location.pathname !== '/login' && location.pathname !== '/signup';

  // Helper to check roles
  const hasRole = (role) => {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    return roles.includes(role);
  };

  // Determine home path based on role
  const getHomePath = () => {
    if (hasRole('ADMIN')) return '/obs-home'; // Admins usually see everything
    if (hasRole('OBSERVER')) return '/obs-home';
    if (hasRole('INSTRUCTOR')) return '/ins-home';
    return '/login';
  };

  return (
    <SimpleBar style={{ maxHeight: '100vh', width: '100%' }}>
      <div className={showHeader ? "app-main-layout" : ""}>
        {showHeader && <Header />}
        
        <main className={showHeader ? "main-content-padded" : ""}>
          <Routes>
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to={getHomePath()} />} 
            />

            <Route 
              path="/signup" 
              element={!isAuthenticated ? <Register /> : <Navigate to={getHomePath()} />} 
            />

            <Route 
              path="/obs-home" 
              element={
                isAuthenticated && (hasRole('OBSERVER') || hasRole('ADMIN'))
                  ? <ObsHome /> 
                  : <Navigate to="/login" />
              } 
            />

            <Route 
              path="/ins-home" 
              element={
                isAuthenticated && hasRole('INSTRUCTOR')
                  ? <InsHome /> 
                  : <Navigate to="/login" />
              } 
            />

            <Route 
              path="/instructor-intro" 
              element={
                isAuthenticated && hasRole('INSTRUCTOR')
                  ? <InstructorIntro /> 
                  : <Navigate to="/login" />
              } 
            />

            <Route 
              path="/evaluate" 
              element={isAuthenticated ? <Evaluate /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/recommendations" 
              element={isAuthenticated ? <Recommendations /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/report-viewer" 
              element={isAuthenticated ? <ReportViewer /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/reports" 
              element={isAuthenticated ? <ReportsList /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/admin-management" 
              element={
                isAuthenticated && hasRole('ADMIN')
                  ? <AdminManagement /> 
                  : <Navigate to="/login" />
              } 
            />

            <Route 
              path="/profile" 
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/help" 
              element={isAuthenticated ? <Help /> : <Navigate to="/login" />} 
            />

            <Route path="/" element={<Navigate to={getHomePath()} />} />
          </Routes>
        </main>
      </div>
    </SimpleBar>
  )
}

export default App
