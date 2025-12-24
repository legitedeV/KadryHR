import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { PERMISSIONS } from './utils/permissions';
import { PageSkeleton } from './components/Skeleton';

// Eager load critical pages (login, landing)
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import QRStart from './pages/QRStart';

// Lazy load heavy pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Reports = lazy(() => import('./pages/Reports'));
const Invites = lazy(() => import('./pages/Invites'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const SelfService = lazy(() => import('./pages/SelfService'));
const ScheduleBuilder = lazy(() => import('./pages/ScheduleBuilder'));
const ScheduleBuilderV2 = lazy(() => import('./pages/ScheduleBuilderV2'));
const TimeTracking = lazy(() => import('./pages/TimeTracking'));
const QRCodeGenerator = lazy(() => import('./pages/QRCodeGenerator'));
const Chat = lazy(() => import('./pages/Chat'));
const AdminRequests = lazy(() => import('./pages/AdminRequests'));
const AllLeaves = lazy(() => import('./pages/AllLeaves'));
const AllNotifications = lazy(() => import('./pages/AllNotifications'));
const Permissions = lazy(() => import('./pages/Permissions'));
const Webhooks = lazy(() => import('./pages/Webhooks'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-loading">
    <div className="text-center">
      <div className="spinner h-12 w-12 mx-auto"></div>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie...</p>
    </div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/app" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/qr/start" element={<QRStart />} />
      
      {/* Dashboard - accessible to all logged-in users */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Self-service panel */}
      <Route
        path="/self-service"
        element={
          <PrivateRoute>
            <Layout>
              <SelfService />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Schedule builder - accessible to all */}
      <Route
        path="/schedule-builder"
        element={
          <PrivateRoute>
            <Layout>
              <ScheduleBuilderV2 />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Old schedule builder (deprecated) */}
      <Route
        path="/schedule-builder-old"
        element={
          <AdminRoute>
            <Layout>
              <ScheduleBuilder />
            </Layout>
          </AdminRoute>
        }
      />
      
      {/* Time tracking - accessible to all */}
      <Route
        path="/time-tracking"
        element={
          <PrivateRoute>
            <Layout>
              <TimeTracking />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Chat - accessible to all */}
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Layout>
              <Chat />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* All Leaves - accessible to all */}
      <Route
        path="/leaves"
        element={
          <PrivateRoute>
            <Layout>
              <AllLeaves />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* All Notifications - accessible to all */}
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Layout>
              <AllNotifications />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Profile - accessible to all logged-in users */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout>
              <Profile />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Settings - accessible to all logged-in users */}
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Admin-only routes with permission support */}
      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredPermissions={[PERMISSIONS.EMPLOYEES_VIEW]}>
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute requiredPermissions={[PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_CALCULATE]}>
            <Layout>
              <Payroll />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_VIEW]}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invites"
        element={
          <AdminRoute>
            <Layout>
              <Invites />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/permissions"
        element={
          <AdminRoute>
            <Layout>
              <Permissions />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/webhooks"
        element={
          <AdminRoute>
            <Layout>
              <Webhooks />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/qr-generator"
        element={
          <AdminRoute>
            <Layout>
              <QRCodeGenerator />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute requiredPermissions={[PERMISSIONS.REQUESTS_MANAGE]}>
            <Layout>
              <AdminRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
