/**
 * Permission constants and utilities for frontend
 * Maps application modules to their permission keys
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Self-service panel
  SELF_SERVICE_VIEW: 'self_service.view',
  
  // Time tracking
  TIME_TRACKING_VIEW: 'time_tracking.view',
  TIME_TRACKING_MANAGE: 'time_tracking.manage',
  
  // Chat / Messages
  CHAT_VIEW: 'chat.view',
  
  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_EDIT: 'employees.edit',
  EMPLOYEES_DELETE: 'employees.delete',
  
  // Schedule
  SCHEDULE_VIEW: 'schedule.view',
  SCHEDULE_CREATE: 'schedule.create',
  SCHEDULE_EDIT: 'schedule.edit',
  SCHEDULE_DELETE: 'schedule.delete',
  
  // Requests / Leaves
  REQUESTS_VIEW: 'requests.view',
  REQUESTS_MANAGE: 'requests.manage',
  LEAVES_VIEW: 'leaves.view',
  LEAVES_CREATE: 'leaves.create',
  
  // Payroll calculator
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_CALCULATE: 'payroll.calculate',
  PAYROLL_MANAGE: 'payroll.manage',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  
  // Notifications
  NOTIFICATIONS_VIEW: 'notifications.view',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
  
  // Permissions management
  PERMISSIONS_MANAGE: 'permissions.manage',
};

/**
 * Module to permission mapping
 * Used for route guards and navigation visibility
 */
export const MODULE_PERMISSIONS = {
  '/app': [PERMISSIONS.DASHBOARD_VIEW],
  '/self-service': [PERMISSIONS.SELF_SERVICE_VIEW],
  '/time-tracking': [PERMISSIONS.TIME_TRACKING_VIEW],
  '/chat': [PERMISSIONS.CHAT_VIEW],
  '/employees': [PERMISSIONS.EMPLOYEES_VIEW],
  '/schedule-builder': [PERMISSIONS.SCHEDULE_VIEW],
  '/admin/requests': [PERMISSIONS.REQUESTS_MANAGE],
  '/leaves': [PERMISSIONS.LEAVES_VIEW],
  '/payroll': [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_CALCULATE],
  '/reports': [PERMISSIONS.REPORTS_VIEW],
  '/permissions': [PERMISSIONS.PERMISSIONS_MANAGE],
  '/settings': [PERMISSIONS.SETTINGS_VIEW],
};

/**
 * Check if user has permission (client-side helper)
 * @param {Object} user - User object with role
 * @param {Array} userPermissions - Array of permission strings
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (user, userPermissions, permission) => {
  if (!user) return false;
  
  // Super admin and admin have all permissions
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }
  
  return userPermissions?.includes(permission) || false;
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} userPermissions - Array of permission strings
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (user, userPermissions, permissions) => {
  if (!user) return false;
  
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }
  
  return permissions.some(perm => userPermissions?.includes(perm)) || false;
};

/**
 * Check if user can access a route
 * @param {Object} user - User object
 * @param {Array} userPermissions - Array of permission strings
 * @param {string} route - Route path
 * @returns {boolean}
 */
export const canAccessRoute = (user, userPermissions, route) => {
  if (!user) return false;
  
  // Admin and super admin can access everything
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }
  
  // Check if route requires specific permissions
  const requiredPermissions = MODULE_PERMISSIONS[route];
  if (!requiredPermissions) {
    // No specific permissions required, allow access
    return true;
  }
  
  // User needs at least one of the required permissions
  return hasAnyPermission(user, userPermissions, requiredPermissions);
};
