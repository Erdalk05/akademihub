'use client';

import React from 'react';
import { Permission } from '@/lib/types/role-types';
import { useRole } from '@/lib/contexts/RoleContext';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires ALL permissions. If false, requires ANY permission.
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean; // If true, renders nothing instead of fallback
}

export default function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback,
  hideIfNoAccess = false,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRole();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (hideIfNoAccess) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
      <Lock className="w-12 h-12 text-gray-400 mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Erişim Yetkiniz Yok</h3>
      <p className="text-sm text-gray-600 text-center">
        Bu özelliği kullanmak için gerekli yetkiye sahip değilsiniz.
        <br />
        Yardım için sistem yöneticinizle iletişime geçin.
      </p>
    </div>
  );
}

/**
 * HOC version for wrapping entire components
 */
export function withPermission(
  Component: React.ComponentType<any>,
  permission: Permission | Permission[],
  requireAll = false
) {
  return function PermissionWrappedComponent(props: any) {
    return (
      <PermissionGuard
        permission={Array.isArray(permission) ? undefined : permission}
        permissions={Array.isArray(permission) ? permission : undefined}
        requireAll={requireAll}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}





