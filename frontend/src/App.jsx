import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Invites from './pages/Invites';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import SelfService from './pages/SelfService';
import ScheduleBuilder from './pages/ScheduleBuilder';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/self-service" replace />;

  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/app"
        element={
          <AdminRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </AdminRoute>
        }
      />
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
      <Route
        path="/schedule-builder"
        element={
          <AdminRoute>
            <Layout>
              <ScheduleBuilder />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <AdminRoute>
            <Layout>
              <SelfService />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/schedule-builder"
        element={
          <AdminRoute>
            <Layout>
              <ScheduleBuilder />
            </Layout>
          </AdminRoute>
        }
      />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
