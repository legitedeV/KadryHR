import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Komponent do wyświetlania pojedynczego uprawnienia jako badge
 */
const PermissionBadge = ({ permission, hasPermission, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-all ${
        sizeClasses[size]
      } ${
        hasPermission
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {hasPermission ? (
        <CheckIcon className={iconSizes[size]} />
      ) : (
        <XMarkIcon className={iconSizes[size]} />
      )}
      {permission}
    </span>
  );
};

export default PermissionBadge;
