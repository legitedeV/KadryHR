/**
 * Permission helper utilities
 * Centralized permission checking and validation logic
 */

const UserPermission = require('../models/UserPermission');

/**
 * Module-based permission keys
 * Maps application modules to their permission keys
 */
const PERMISSION_KEYS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Self-service panel
  SELF_SERVICE_VIEW: 'self_service.view',
  
  // Time tracking
  TIME_TRACKING_USE: 'time_tracking.view',
  TIME_TRACKING_MANAGE: 'time_tracking.manage',
  
  // Chat / Messages
  CHAT_USE: 'chat.view',
  
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
 * Check if user has a specific permission
 * @param {Object} user - User object with id and role
 * @param {string} permissionKey - Permission key to check
 * @returns {Promise<boolean>}
 */
const hasPermission = async (user, permissionKey) => {
  if (!user) return false;
  
  // Super admin and admin have all permissions
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }
  
  const userPermission = await UserPermission.findOne({
    user: user.id,
    isActive: true,
  });
  
  if (!userPermission) return false;
  if (userPermission.expiresAt && userPermission.expiresAt < new Date()) return false;
  
  return userPermission.permissions.includes(permissionKey);
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {string[]} permissionKeys - Array of permission keys
 * @returns {Promise<boolean>}
 */
const hasAnyPermission = async (user, permissionKeys) => {
  if (!user) return false;
  
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }
  
  const userPermission = await UserPermission.findOne({
    user: user.id,
    isActive: true,
  });
  
  if (!userPermission) return false;
  if (userPermission.expiresAt && userPermission.expiresAt < new Date()) return false;
  
  return permissionKeys.some(key => userPermission.permissions.includes(key));
};

/**
 * Check if user has all specified permissions
 * @param {Object} user - User object
 * @param {string[]} permissionKeys - Array of permission keys
 * @returns {Promise<boolean>}
 */
const hasAllPermissions = async (user, permissionKeys) => {
  if (!user) return false;
  
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }
  
  const userPermission = await UserPermission.findOne({
    user: user.id,
    isActive: true,
  });
  
  if (!userPermission) return false;
  if (userPermission.expiresAt && userPermission.expiresAt < new Date()) return false;
  
  return permissionKeys.every(key => userPermission.permissions.includes(key));
};

/**
 * Check if current user can manage target user's permissions
 * @param {Object} currentUser - Current user making the request
 * @param {Object} targetUser - Target user whose permissions are being managed
 * @returns {boolean}
 */
const canManageUserPermissions = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;
  
  // Super admin can manage everyone
  if (currentUser.role === 'super_admin') {
    return true;
  }
  
  // Admin can manage regular users and other admins, but NOT super admins
  if (currentUser.role === 'admin') {
    return targetUser.role !== 'super_admin';
  }
  
  // Regular users cannot manage permissions
  return false;
};

/**
 * Check if user is super admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
const isSuperAdmin = (user) => {
  return user?.role === 'super_admin';
};

/**
 * Check if user is admin (including super admin)
 * @param {Object} user - User object
 * @returns {boolean}
 */
const isAdmin = (user) => {
  return user?.role === 'admin' || user?.role === 'super_admin';
};

module.exports = {
  PERMISSION_KEYS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canManageUserPermissions,
  isSuperAdmin,
  isAdmin,
};
