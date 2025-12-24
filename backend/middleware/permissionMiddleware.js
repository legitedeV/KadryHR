const UserPermission = require('../models/UserPermission');

/**
 * Middleware do sprawdzania uprawnień użytkownika
 * 
 * @param {string|string[]} requiredPermissions - Wymagane uprawnienie(a)
 * @returns {Function} Express middleware
 * 
 * Przykład użycia:
 * router.get('/employees', checkPermission('employees.view'), getEmployees);
 * router.post('/employees', checkPermission(['employees.create']), createEmployee);
 */
const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const { id: userId, role } = req.user;

      // Super admin i admin mają dostęp do wszystkiego
      if (role === 'super_admin' || role === 'admin') {
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

/**
 * Middleware do sprawdzania czy użytkownik ma przynajmniej jedno z uprawnień
 * 
 * @param {string[]} permissions - Lista uprawnień (wystarczy jedno)
 * @returns {Function} Express middleware
 */
const checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const { id: userId, role } = req.user;

      // Super admin i admin mają dostęp do wszystkiego
      if (role === 'super_admin' || role === 'admin') {
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
  checkPermission,
  checkAnyPermission,
  hasPermission,
};
