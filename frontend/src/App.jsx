import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Invites from './pages/Invites';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import SelfService from './pages/SelfService';
import ScheduleBuilder from './pages/ScheduleBuilder';
import ScheduleBuilderV2 from './pages/ScheduleBuilderV2';
import TimeTracking from './pages/TimeTracking';
import QRCodeGenerator from './pages/QRCodeGenerator';
import QRStart from './pages/QRStart';
import Chat from './pages/Chat';
import AdminRequests from './pages/AdminRequests';
import AllLeaves from './pages/AllLeaves';
import AllNotifications from './pages/AllNotifications';
import Permissions from './pages/Permissions';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-loading">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-loading">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/app" replace />;
  }

  return children;
};

const App = () => {
  return (
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
      
      {/* Admin-only routes */}
      <Route
        path="/employees"
        element={
          <AdminRoute>
            <Layout>
              <Employees />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <AdminRoute>
            <Layout>
              <Payroll />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <AdminRoute>
            <Layout>
              <Reports />
            </Layout>
          </AdminRoute>
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
          <AdminRoute>
            <Layout>
              <AdminRequests />
            </Layout>
          </AdminRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
