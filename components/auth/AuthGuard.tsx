'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/contexts/RoleContext';
import { useAuthStore } from '@/lib/store';
import { Permission, UserRole } from '@/lib/types/role-types';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission | Permission[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo = '/login',
}: AuthGuardProps) {
  const router = useRouter();
  const { currentUser, hasPermission, hasAnyPermission, isAdmin } = useRole();
  const { isAuthenticated, token } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // Auth store kontrolü
      if (!isAuthenticated || !token) {
        router.push(redirectTo);
        return;
      }

      // Kullanıcı kontrolü
      if (!currentUser) {
        router.push(redirectTo);
        return;
      }

      // Admin her şeye erişebilir
      if (isAdmin) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // Rol kontrolü
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(currentUser.role)) {
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
      }

      // Permission kontrolü
      if (requiredPermission) {
        const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
        if (!hasAnyPermission(permissions)) {
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
      }

      setHasAccess(true);
      setIsChecking(false);
    };

    // Biraz gecikme ile kontrol et (localStorage yüklenmesi için)
    const timer = setTimeout(checkAccess, 100);
    return () => clearTimeout(timer);
  }, [currentUser, isAuthenticated, token, requiredRole, requiredPermission, isAdmin, hasAnyPermission, router, redirectTo]);

  // Kontrol devam ediyor
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#075E54] to-[#128C7E]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Erişim yok
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Erişim Engellendi</h1>
          <p className="text-slate-600 mb-6">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. 
            Lütfen yöneticinizle iletişime geçin.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
            >
              Geri Dön
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-medium transition"
            >
              Ana Sayfa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Admin Only Guard
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole={UserRole.ADMIN}>
      {children}
    </AuthGuard>
  );
}

// Finance Guard (Admin veya Muhasebe)
export function FinanceGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole={[UserRole.ADMIN, UserRole.ACCOUNTING]}>
      {children}
    </AuthGuard>
  );
}




