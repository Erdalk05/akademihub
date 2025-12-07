'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  User, 
  DynamicRolePermissions,
  updateRolePermissions,
  DEFAULT_ROLE_PERMISSIONS
} from '@/lib/types/role-types';

interface RoleContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isAdmin: boolean;
  isAccounting: boolean;
  isStaff: boolean;
  isTeacher: boolean;
  isParent: boolean;
  reloadPermissions: () => void;
  isHydrated: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Client-side initialization
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') {
      setIsHydrated(true);
      return;
    }

    try {
      // Load permissions
      const savedPermissions = localStorage.getItem('akademi_role_permissions');
      if (savedPermissions) {
        const parsed = JSON.parse(savedPermissions);
        if (parsed.accounting) updateRolePermissions('accounting', parsed.accounting);
        if (parsed.staff) updateRolePermissions('staff', parsed.staff);
      } else {
        updateRolePermissions('accounting', DEFAULT_ROLE_PERMISSIONS.accounting);
        updateRolePermissions('staff', DEFAULT_ROLE_PERMISSIONS.staff);
      }

      // Load user
      const storedUser = localStorage.getItem('akademi_current_user');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('RoleContext init error:', error);
    }

    setIsHydrated(true);
  }, []);

  // Save user changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) return;

    try {
      if (currentUser) {
        localStorage.setItem('akademi_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('akademi_current_user');
      }
    } catch (error) {
      console.error('Save user error:', error);
    }
  }, [currentUser, isHydrated]);

  // Simple permission check
  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    const permissions = ROLE_PERMISSIONS[currentUser.role];
    return permissions?.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  const reloadPermissions = () => {
    if (typeof window === 'undefined') return;
    try {
      const savedPermissions = localStorage.getItem('akademi_role_permissions');
      if (savedPermissions) {
        const parsed = JSON.parse(savedPermissions);
        if (parsed.accounting) updateRolePermissions('accounting', parsed.accounting);
        if (parsed.staff) updateRolePermissions('staff', parsed.staff);
      }
    } catch (error) {
      console.error('Reload permissions error:', error);
    }
  };

  // Role checks
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isAccounting = currentUser?.role === UserRole.ACCOUNTING;
  const isStaff = currentUser?.role === UserRole.STAFF;
  const isTeacher = currentUser?.role === UserRole.TEACHER;
  const isParent = currentUser?.role === UserRole.PARENT;

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAdmin,
        isAccounting,
        isStaff,
        isTeacher,
        isParent,
        reloadPermissions,
        isHydrated,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}

export { RoleContext };
