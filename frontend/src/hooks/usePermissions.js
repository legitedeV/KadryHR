import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

/**
 * Hook do sprawdzania uprawnień użytkownika
 * 
 * @returns {Object} - { permissions, hasPermission, isLoading, isAdmin }
 * 
 * Przykład użycia:
 * const { hasPermission, isAdmin } = usePermissions();
 * 
 * if (hasPermission('employees.create')) {
 *   // Pokaż przycisk dodawania pracownika
 * }
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const { data: userPermissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await api.get(`/permissions/user/${user.id}`);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  /**
   * Sprawdź czy użytkownik ma dane uprawnienie
   * Admin i super_admin mają zawsze dostęp
   */
  const hasPermission = (permissionName) => {
    if (isAdmin) return true;
    if (!userPermissions?.permissions) return false;
    return userPermissions.permissions.includes(permissionName);
  };

  /**
   * Sprawdź czy użytkownik ma przynajmniej jedno z uprawnień
   */
  const hasAnyPermission = (permissionNames) => {
    if (isAdmin) return true;
    if (!userPermissions?.permissions) return false;
    return permissionNames.some((perm) => userPermissions.permissions.includes(perm));
  };

  /**
   * Sprawdź czy użytkownik ma wszystkie uprawnienia
   */
  const hasAllPermissions = (permissionNames) => {
    if (isAdmin) return true;
    if (!userPermissions?.permissions) return false;
    return permissionNames.every((perm) => userPermissions.permissions.includes(perm));
  };

  return {
    permissions: userPermissions?.permissions || [],
    restrictions: userPermissions?.restrictions || {},
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    isAdmin,
  };
};
