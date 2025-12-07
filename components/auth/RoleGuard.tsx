/**
 * RoleGuard Component
 * Rol bazlı erişim kontrolü için wrapper component
 * 
 * Kullanım:
 * <RoleGuard allowedRoles={['admin']} fallback={<AccessDenied />}>
 *   <AdminOnlyContent />
 * </RoleGuard>
 */

'use client';

import React from 'react';
import { useRole } from '@/lib/contexts/RoleContext';
import { UserRole } from '@/lib/types/role-types';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

// Varsayılan erişim reddedildi component'i
const DefaultAccessDenied: React.FC = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-100 max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
      <p className="text-gray-600 mb-4">
        Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
      </p>
      <p className="text-sm text-gray-500">
        Bu işlem sadece <span className="font-semibold text-red-600">Admin</span> tarafından yapılabilir.
      </p>
    </div>
  </div>
);

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  redirectTo,
  showAccessDenied = true,
}) => {
  const { currentUser } = useRole();
  const router = useRouter();

  // Kullanıcı yüklenene kadar bekle
  if (!currentUser) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  // Rol kontrolü
  const hasAccess = allowedRoles.includes(currentUser.role);

  if (!hasAccess) {
    // Yönlendirme varsa yönlendir
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    // Fallback varsa göster
    if (fallback) {
      return <>{fallback}</>;
    }

    // Varsayılan erişim reddedildi
    if (showAccessDenied) {
      return <DefaultAccessDenied />;
    }

    return null;
  }

  return <>{children}</>;
};

// Admin Only Wrapper
interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={[UserRole.ADMIN]} fallback={fallback} showAccessDenied={false}>
    {children}
  </RoleGuard>
);

// Accounting ve Admin için wrapper
export const AccountingOrAdmin: React.FC<AdminOnlyProps> = ({ children, fallback }) => (
  <RoleGuard 
    allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTING]} 
    fallback={fallback} 
    showAccessDenied={false}
  >
    {children}
  </RoleGuard>
);

// Conditional Render Helper
interface ConditionalRenderProps {
  children: React.ReactNode;
  condition: boolean;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  condition,
  fallback = null,
}) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;




