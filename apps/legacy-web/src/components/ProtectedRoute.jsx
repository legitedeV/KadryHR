import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { canAccessRoute } from '../utils/permissions';

/**
 * ProtectedRoute component with permission support
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} props.requiredPermissions - Array of required permissions (user needs at least one)
 * @param {boolean} props.requireAdmin - Whether admin role is required
 * @param {string} props.redirectTo - Where to redirect if access denied (default: '/app')
 */
const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requireAdmin = false,
  redirectTo = '/app' 
}) => {
  const { user, loading } = useAuth();
  const { permissions, isLoading: permissionsLoading, isAdmin } = usePermissions();

  // Show loading state
  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-loading">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    // Admin and super admin bypass permission checks
    if (!isAdmin) {
      const hasRequiredPermission = requiredPermissions.some(perm => 
        permissions.includes(perm)
      );

      if (!hasRequiredPermission) {
        return <Navigate to={redirectTo} replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
