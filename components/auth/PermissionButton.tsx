'use client';

import React from 'react';
import { Permission } from '@/lib/types/role-types';
import { useRole } from '@/lib/contexts/RoleContext';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  showLockIcon?: boolean;
  hideIfNoAccess?: boolean;
  onUnauthorizedClick?: () => void;
}

/**
 * Button component that respects permissions
 * - If user has permission: renders normal button
 * - If user doesn't have permission: renders disabled button with lock icon (or hides it)
 */
export default function PermissionButton({
  permission,
  permissions,
  requireAll = false,
  showLockIcon = true,
  hideIfNoAccess = false,
  onUnauthorizedClick,
  children,
  className = '',
  onClick,
  ...props
}: PermissionButtonProps) {
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

  if (hideIfNoAccess && !hasAccess) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasAccess) {
      e.preventDefault();
      if (onUnauthorizedClick) {
        onUnauthorizedClick();
      } else {
        toast.error('Bu işlem için yetkiniz yok');
      }
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={!hasAccess || props.disabled}
      className={`${className} ${
        !hasAccess ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={!hasAccess ? 'Yetkiniz yok' : props.title}
    >
      {!hasAccess && showLockIcon && (
        <Lock className="w-4 h-4 inline-block mr-1" />
      )}
      {children}
    </button>
  );
}





