import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useRoles } from './hooks/useRoles';
import Header from './components/Header/Header';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import './App.css';

const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Login/Register'));
const ObsHome = lazy(() => import('./pages/ObsHome'));
const InsHome = lazy(() => import('./pages/InsHome/InsHome'));
const InstructorIntro = lazy(() => import('./pages/InstructorIntro/InstructorIntro'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Evaluate = lazy(() => import('./pages/Evaluate/Evaluate'));
const Recommendations = lazy(() => import('./pages/Recommendations/Recommendations'));
const ReportViewer = lazy(() => import('./pages/ReportViewer/ReportViewer'));
const ReportsList = lazy(() => import('./pages/ReportsList/ReportsList'));
const AdminManagement = lazy(() => import('./pages/AdminManagement/AdminManagement'));
const Help = lazy(() => import('./pages/Help/Help'));

function App() {
  const { isAuthenticated } = useAuthStore();
  const { hasRole } = useRoles();
  const location = useLocation();

  const showHeader = isAuthenticated && location.pathname !== '/login' && location.pathname !== '/signup';

  const getHomePath = () => {
    if (hasRole('ADMIN') || hasRole('OBSERVER')) return '/obs-home';
    if (hasRole('INSTRUCTOR')) return '/ins-home';
    return '/login';
  };

  return (
    <SimpleBar style={{ maxHeight: '100vh', width: '100%' }}>
      <div className={showHeader ? 'app-main-layout' : ''}>
        {showHeader && <Header />}

        <main className={showHeader ? 'main-content-padded' : ''}>
          <Suspense fallback={<div className="page-loading"><div className="spinner-border text-warning page-loading-spinner" role="status" /></div>}>
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
          </Suspense>
        </main>
      </div>
    </SimpleBar>
  );
}

export default App;
