/**
 * API Role Guard Middleware
 * Backend güvenliği için rol kontrolü
 * 
 * Tüm DELETE ve UPDATE işlemleri için admin yetkisi gerektirir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/types/role-types';

// API Response Types
export interface ApiRoleCheckResult {
  allowed: boolean;
  error?: string;
  statusCode: number;
}

/**
 * Request'ten rol bilgisini al
 * Not: Gerçek uygulamada bu JWT token veya session'dan alınır
 */
export function getRoleFromRequest(request: NextRequest): UserRole {
  // Header'dan rol bilgisini al
  const roleHeader = request.headers.get('x-user-role');
  
  if (roleHeader && Object.values(UserRole).includes(roleHeader as UserRole)) {
    return roleHeader as UserRole;
  }
  
  // Cookie'den al
  const roleCookie = request.cookies.get('userRole')?.value;
  if (roleCookie && Object.values(UserRole).includes(roleCookie as UserRole)) {
    return roleCookie as UserRole;
  }
  
  // Varsayılan olarak staff (en düşük yetki)
  return UserRole.STAFF;
}

/**
 * Admin yetkisi kontrolü
 */
export function requireAdmin(role: UserRole): ApiRoleCheckResult {
  if (role !== UserRole.ADMIN) {
    return {
      allowed: false,
      error: 'Bu işlem sadece Admin tarafından yapılabilir',
      statusCode: 403,
    };
  }
  return { allowed: true, statusCode: 200 };
}

/**
 * Admin veya Muhasebe yetkisi kontrolü
 */
export function requireAdminOrAccounting(role: UserRole): ApiRoleCheckResult {
  if (role !== UserRole.ADMIN && role !== UserRole.ACCOUNTING) {
    return {
      allowed: false,
      error: 'Bu işlem sadece Admin veya Muhasebe tarafından yapılabilir',
      statusCode: 403,
    };
  }
  return { allowed: true, statusCode: 200 };
}

/**
 * DELETE işlemi için yetki kontrolü - Sadece Admin
 */
export function checkDeletePermission(role: UserRole): ApiRoleCheckResult {
  return requireAdmin(role);
}

/**
 * UPDATE işlemi için yetki kontrolü - Sadece Admin
 */
export function checkUpdatePermission(role: UserRole): ApiRoleCheckResult {
  return requireAdmin(role);
}

/**
 * CREATE işlemi için yetki kontrolü - Admin, Muhasebe veya Staff
 */
export function checkCreatePermission(role: UserRole): ApiRoleCheckResult {
  // Herkes oluşturabilir (rol bazlı ek kontroller yapılabilir)
  return { allowed: true, statusCode: 200 };
}

/**
 * Hata response oluştur
 */
export function createForbiddenResponse(message: string = 'Yetkisiz erişim') {
  return NextResponse.json(
    { 
      success: false, 
      error: message,
      code: 'FORBIDDEN'
    }, 
    { status: 403 }
  );
}

/**
 * API Route için rol guard wrapper
 */
export function withRoleGuard(
  handler: (request: NextRequest, role: UserRole) => Promise<NextResponse>,
  requiredRoles?: UserRole[]
) {
  return async (request: NextRequest) => {
    const role = getRoleFromRequest(request);
    
    // Belirli roller gerekliyse kontrol et
    if (requiredRoles && !requiredRoles.includes(role)) {
      return createForbiddenResponse(
        `Bu işlem için ${requiredRoles.join(' veya ')} yetkisi gereklidir`
      );
    }
    
    return handler(request, role);
  };
}

/**
 * DELETE işlemi için guard
 */
export function withDeleteGuard(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const role = getRoleFromRequest(request);
    const check = checkDeletePermission(role);
    
    if (!check.allowed) {
      return createForbiddenResponse(check.error);
    }
    
    return handler(request);
  };
}

/**
 * UPDATE işlemi için guard
 */
export function withUpdateGuard(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const role = getRoleFromRequest(request);
    const check = checkUpdatePermission(role);
    
    if (!check.allowed) {
      return createForbiddenResponse(check.error);
    }
    
    return handler(request);
  };
}

/**
 * Sadece Admin için guard
 */
export function withAdminGuard(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const role = getRoleFromRequest(request);
    const check = requireAdmin(role);
    
    if (!check.allowed) {
      return createForbiddenResponse(check.error);
    }
    
    return handler(request);
  };
}




