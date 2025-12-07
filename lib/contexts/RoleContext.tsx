'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  User, 
  DynamicRolePermissions,
  updateRolePermissions,
  convertToPermissionArray,
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
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Yetkileri localStorage'dan yükle ve ROLE_PERMISSIONS'ı güncelle
  const loadDynamicPermissions = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedPermissions = localStorage.getItem('akademi_role_permissions');
      if (savedPermissions) {
        const parsed = JSON.parse(savedPermissions) as {
          accounting: DynamicRolePermissions;
          staff: DynamicRolePermissions;
        };
        
        // ROLE_PERMISSIONS'ı runtime'da güncelle
        updateRolePermissions('accounting', parsed.accounting);
        updateRolePermissions('staff', parsed.staff);
        
        console.log('✅ Dinamik yetkiler yüklendi');
      } else {
        // Varsayılan yetkileri kullan
        updateRolePermissions('accounting', DEFAULT_ROLE_PERMISSIONS.accounting);
        updateRolePermissions('staff', DEFAULT_ROLE_PERMISSIONS.staff);
      }
      setPermissionsLoaded(true);
    } catch (error) {
      console.error('Yetki yükleme hatası:', error);
      setPermissionsLoaded(true);
    }
  }, []);

  // Load user from localStorage on mount (client-side only)
  useEffect(() => {
    // SSR kontrolü
    if (typeof window === 'undefined') return;
    
    // Önce yetkileri yükle
    loadDynamicPermissions();
    
    // Sonra kullanıcıyı yükle
    try {
      const storedUser = localStorage.getItem('akademi_current_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      }
      // Development'ta varsayılan kullanıcı EKLEME - kullanıcı giriş yapmalı
    } catch (error) {
      console.error('Failed to parse stored user:', error);
    }
    
    // Hydration tamamlandı
    setIsHydrated(true);
  }, [loadDynamicPermissions]);

  // Save user to localStorage when it changes (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (currentUser) {
      try {
        localStorage.setItem('akademi_current_user', JSON.stringify(currentUser));
      } catch (error) {
        console.error('Failed to save user:', error);
      }
    } else {
      try {
        localStorage.removeItem('akademi_current_user');
      } catch (error) {
        console.error('Failed to remove user:', error);
      }
    }
  }, [currentUser]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentUser) return false;
      const permissions = ROLE_PERMISSIONS[currentUser.role];
      return permissions?.includes(permission) ?? false;
    },
    [currentUser, permissionsLoaded]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some(permission => hasPermission(permission));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every(permission => hasPermission(permission));
    },
    [hasPermission]
  );

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
        reloadPermissions: loadDynamicPermissions,
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
