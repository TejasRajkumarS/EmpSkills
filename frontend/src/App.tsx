import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SkillAudits } from './pages/employee/SkillAudits';
import { RoleReadiness } from './pages/employee/RoleReadiness';
import { TrainingPathways } from './pages/employee/TrainingPathways';
import { IndividualReport } from './pages/IndividualReport';
import { Reports } from './pages/Reports';
import { WorkforceStaffing } from './pages/hr/WorkforceStaffing';
import { HRAnalyticsPortal } from './pages/hr/HRAnalyticsPortal';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: ('employee' | 'hr')[] }) {
  const { role, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role!)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function RoleBasedRoutes() {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        {role === 'employee' && (
          <>
            <Route path="/skill-audits" element={
              <PrivateRoute allowedRoles={['employee']}><SkillAudits /></PrivateRoute>
            } />
            <Route path="/role-readiness" element={
              <PrivateRoute allowedRoles={['employee']}><RoleReadiness /></PrivateRoute>
            } />
            <Route path="/training-pathways" element={
              <PrivateRoute allowedRoles={['employee']}><TrainingPathways /></PrivateRoute>
            } />
            <Route path="/my-report" element={
              <PrivateRoute allowedRoles={['employee']}><IndividualReport /></PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/skill-audits" replace />} />
            <Route path="*" element={<Navigate to="/skill-audits" replace />} />
          </>
        )}

        {role === 'hr' && (
          <>
            <Route path="/workforce-staffing" element={
              <PrivateRoute allowedRoles={['hr']}><WorkforceStaffing /></PrivateRoute>
            } />
            <Route path="/hr-analytics" element={
              <PrivateRoute allowedRoles={['hr']}><HRAnalyticsPortal /></PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute allowedRoles={['hr']}><Reports /></PrivateRoute>
            } />
            <Route path="/reports/employee/:employeeId" element={
              <PrivateRoute allowedRoles={['hr']}><IndividualReport /></PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/workforce-staffing" replace />} />
            <Route path="*" element={<Navigate to="/workforce-staffing" replace />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <RoleBasedRoutes />
    </AuthProvider>
  );
}

export default App;