import { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/types/role-types';

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => roleHasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function roleHasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => roleHasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Get role label in Turkish
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Franchise Yöneticisi',
    [UserRole.ADMIN]: 'Yönetici',
    [UserRole.ACCOUNTING]: 'Muhasebe',
    [UserRole.TEACHER]: 'Öğretmen',
    [UserRole.PARENT]: 'Veli',
    [UserRole.STAFF]: 'Personel',
  };
  return labels[role];
}

/**
 * Get permission label in Turkish
 */
export function getPermissionLabel(permission: Permission): string {
  const labels: Partial<Record<Permission, string>> = {
    [Permission.STUDENTS_VIEW]: 'Öğrenci Görüntüleme',
    [Permission.STUDENTS_CREATE]: 'Öğrenci Ekleme',
    [Permission.STUDENTS_EDIT]: 'Öğrenci Düzenleme',
    [Permission.STUDENTS_DELETE]: 'Öğrenci Silme',
    [Permission.FINANCE_VIEW]: 'Finans Görüntüleme',
    [Permission.FINANCE_COLLECT_PAYMENT]: 'Ödeme Alma',
    [Permission.SEND_WHATSAPP]: 'WhatsApp Gönderme',
    [Permission.SEND_EMAIL]: 'E-posta Gönderme',
    [Permission.USERS_MANAGE]: 'Kullanıcı Yönetimi',
    [Permission.SETTINGS_MANAGE]: 'Ayarlar Yönetimi',
  };
  return labels[permission] || permission;
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
  // Define route-permission mappings
  const routePermissions: Record<string, Permission[]> = {
    '/students': [Permission.STUDENTS_VIEW],
    '/students/register': [Permission.STUDENTS_CREATE],
    '/finance': [Permission.FINANCE_VIEW],
    '/academic': [Permission.ACADEMIC_VIEW],
    '/attendance': [Permission.ATTENDANCE_VIEW],
    '/staff': [Permission.STAFF_VIEW],
    '/settings': [Permission.SETTINGS_MANAGE],
    '/reports': [Permission.REPORTS_VIEW],
  };

  // Check if route requires permissions
  for (const [route, permissions] of Object.entries(routePermissions)) {
    if (path.startsWith(route)) {
      return roleHasAnyPermission(role, permissions);
    }
  }

  // Default: allow access
  return true;
}

/**
 * Filter menu items based on role permissions
 */
export interface MenuItem {
  id: string;
  label: string;
  path: string;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  children?: MenuItem[];
}

export function filterMenuByRole(menu: MenuItem[], role: UserRole): MenuItem[] {
  return menu.filter(item => {
    // Check if item requires permission
    if (item.requiredPermission && !roleHasPermission(role, item.requiredPermission)) {
      return false;
    }

    if (item.requiredPermissions && !roleHasAnyPermission(role, item.requiredPermissions)) {
      return false;
    }

    // Recursively filter children
    if (item.children) {
      item.children = filterMenuByRole(item.children, role);
    }

    return true;
  });
}





