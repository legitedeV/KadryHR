const UserPermission = require('../models/UserPermission');

/**
 * Middleware do sprawdzania uprawnień użytkownika
 * 
 * @param {string|string[]} requiredPermissions - Wymagane uprawnienie(a)
 * @param {Object} options - Opcje: { allowAdmin: boolean } - czy admin ma automatyczny dostęp (domyślnie: false)
 * @returns {Function} Express middleware
 * 
 * Przykład użycia:
 * router.get('/employees', requirePermission('employees.view'), getEmployees);
 * router.post('/employees', requirePermission(['employees.create']), createEmployee);
 * router.get('/admin-only', requirePermission('some.permission', { allowAdmin: true }), handler);
 */
const requirePermission = (requiredPermissions, options = {}) => {
  const { allowAdmin = false } = options;
  
  return async (req, res, next) => {
    try {
      const { id: userId, role } = req.user;

      // Super admin zawsze ma dostęp
      if (role === 'super_admin') {
        return next();
      }

      // Admin ma dostęp tylko jeśli allowAdmin = true
      if (role === 'admin' && allowAdmin) {
        return next();
      }

      // Normalizuj do tablicy
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // Pobierz uprawnienia użytkownika
      const userPermission = await UserPermission.findOne({
        user: userId,
        isActive: true,
      });

      // Jeśli brak uprawnień, odmów dostępu
      if (!userPermission) {
        return res.status(403).json({
          message: 'Brak wymaganych uprawnień',
          required: permissions,
        });
      }

      // Sprawdź czy uprawnienia nie wygasły
      if (userPermission.expiresAt && userPermission.expiresAt < new Date()) {
        return res.status(403).json({
          message: 'Uprawnienia wygasły',
        });
      }

      // Sprawdź czy użytkownik ma wszystkie wymagane uprawnienia
      const hasAllPermissions = permissions.every((perm) =>
        userPermission.permissions.includes(perm)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          message: 'Brak wymaganych uprawnień',
          required: permissions,
          current: userPermission.permissions,
        });
      }

      // Dodaj uprawnienia do req dla dalszego użycia
      req.userPermissions = userPermission;

      next();
    } catch (err) {
      next(err);
    }
  };
};

// Alias dla kompatybilności wstecznej
const checkPermission = requirePermission;

/**
 * Middleware do sprawdzania czy użytkownik ma przynajmniej jedno z uprawnień
 * 
 * @param {string[]} permissions - Lista uprawnień (wystarczy jedno)
 * @param {Object} options - Opcje: { allowAdmin: boolean }
 * @returns {Function} Express middleware
 */
const requireAnyPermission = (permissions, options = {}) => {
  const { allowAdmin = false } = options;
  
  return async (req, res, next) => {
    try {
      const { id: userId, role } = req.user;

      // Super admin zawsze ma dostęp
      if (role === 'super_admin') {
        return next();
      }

      // Admin ma dostęp tylko jeśli allowAdmin = true
      if (role === 'admin' && allowAdmin) {
        return next();
      }

      const userPermission = await UserPermission.findOne({
        user: userId,
        isActive: true,
      });

      if (!userPermission) {
        return res.status(403).json({
          message: 'Brak wymaganych uprawnień',
        });
      }

      if (userPermission.expiresAt && userPermission.expiresAt < new Date()) {
        return res.status(403).json({
          message: 'Uprawnienia wygasły',
        });
      }

      const hasAnyPermission = permissions.some((perm) =>
        userPermission.permissions.includes(perm)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          message: 'Brak wymaganych uprawnień',
          required: permissions,
        });
      }

      req.userPermissions = userPermission;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Alias dla kompatybilności wstecznej
const checkAnyPermission = requireAnyPermission;

/**
 * Helper do sprawdzania uprawnień w kontrolerach
 */
const hasPermission = async (userId, permissionName) => {
  const userPermission = await UserPermission.findOne({
    user: userId,
    isActive: true,
  });

  if (!userPermission) return false;
  if (userPermission.expiresAt && userPermission.expiresAt < new Date()) return false;

  return userPermission.permissions.includes(permissionName);
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  checkPermission, // Alias for backward compatibility
  checkAnyPermission, // Alias for backward compatibility
  hasPermission,
};
