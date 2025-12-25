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

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  /**
   * Sprawdź czy użytkownik ma dane uprawnienie
   * Super admin ma zawsze dostęp
   * Admin i zwykli użytkownicy muszą mieć przypisane uprawnienia
   */
  const hasPermission = (permissionName) => {
    // Super admin ma zawsze dostęp
    if (isSuperAdmin) return true;
    
    // Admin i zwykli użytkownicy muszą mieć uprawnienia w bazie
    if (!userPermissions?.permissions) return false;
    return userPermissions.permissions.includes(permissionName);
  };

  /**
   * Sprawdź czy użytkownik ma przynajmniej jedno z uprawnień
   */
  const hasAnyPermission = (permissionNames) => {
    // Super admin ma zawsze dostęp
    if (isSuperAdmin) return true;
    
    // Admin i zwykli użytkownicy muszą mieć uprawnienia w bazie
    if (!userPermissions?.permissions) return false;
    return permissionNames.some((perm) => userPermissions.permissions.includes(perm));
  };

  /**
   * Sprawdź czy użytkownik ma wszystkie uprawnienia
   */
  const hasAllPermissions = (permissionNames) => {
    // Super admin ma zawsze dostęp
    if (isSuperAdmin) return true;
    
    // Admin i zwykli użytkownicy muszą mieć uprawnienia w bazie
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
    isSuperAdmin,
  };
};
