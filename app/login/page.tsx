'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useRole } from '@/lib/contexts/RoleContext';
import { UserRole, User } from '@/lib/types/role-types';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';

// Varsayılan kullanıcılar (geliştirme için)
const DEFAULT_USERS = [
  {
    id: 'admin_001',
    name: 'Sistem Admin',
    email: 'admin@akademihub.com',
    password: 'admin123',
    role: 'super_admin' as const,
    organization_id: null, // Super Admin tüm kurumlara erişir
    status: 'active' as const,
  },
  {
    id: 'muhasebe_001',
    name: 'Muhasebe Uzmanı',
    email: 'muhasebe@akademihub.com',
    password: 'muhasebe123',
    role: 'accounting' as const,
    organization_id: 'merkez', // Slug veya ID
    status: 'active' as const,
  },
  {
    id: 'personel_001',
    name: 'Kayıt Personeli',
    email: 'personel@akademihub.com',
    password: 'personel123',
    role: 'staff' as const,
    organization_id: 'merkez',
    status: 'active' as const,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const authStore = useAuthStore();
  const { setCurrentUser } = useRole();
  const { organizations, fetchOrganizations, setCurrentOrganization } = useOrganizationStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Kurumları yükle (arka planda)
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // 1. API ile giriş dene
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const authData = data.data;
        
        // Rol dönüşümü
        const roleMap: Record<string, UserRole> = {
          'super_admin': UserRole.SUPER_ADMIN,
          'SUPER_ADMIN': UserRole.SUPER_ADMIN,
          'franchise': UserRole.SUPER_ADMIN,
          'admin': UserRole.ADMIN,
          'ADMIN': UserRole.ADMIN,
          'accounting': UserRole.ACCOUNTING,
          'ACCOUNTING': UserRole.ACCOUNTING,
          'staff': UserRole.STAFF,
          'STAFF': UserRole.STAFF,
        };
        
        const roleUser: User = {
          id: authData.user.id,
          name: authData.user.name,
          email: authData.user.email,
          role: roleMap[authData.user.role] || UserRole.STAFF,
        };
        
        setCurrentUser(roleUser);
        // Token ve user'ı kaydet
        authStore.setUser(authData.user);
        useAuthStore.setState({ 
          token: authData.token, 
          isAuthenticated: true 
        });
        localStorage.setItem('akademi_current_user', JSON.stringify(roleUser));
        
        // Kullanıcının kurumunu otomatik seç
        if (authData.organization) {
          setCurrentOrganization(authData.organization);
          toast.success(`Hoş geldiniz, ${authData.user.name}! (${authData.organization.name})`);
        } else if (authData.user.is_super_admin) {
          // Super Admin - ilk kurumu seç veya tüm kurumlara erişim
          toast.success(`Hoş geldiniz, ${authData.user.name}! (Franchise Yöneticisi)`);
        } else {
          toast.success(`Hoş geldiniz, ${authData.user.name}!`);
        }
        
        router.push('/dashboard');
        return;
      }
      
      // 2. Fallback: Varsayılan kullanıcılar
      const foundUser = DEFAULT_USERS.find(
        u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      
      if (!foundUser) {
        setError(data.error || 'Geçersiz e-posta veya şifre!');
        setIsLoading(false);
        return;
      }
      
      if (foundUser.status !== 'active') {
        setError('Bu hesap pasif durumda.');
        setIsLoading(false);
        return;
      }
      
      // Rol dönüşümü
      const roleMap: Record<string, UserRole> = {
        'super_admin': UserRole.SUPER_ADMIN,
        'admin': UserRole.ADMIN,
        'accounting': UserRole.ACCOUNTING,
        'staff': UserRole.STAFF,
      };
      
      const roleUser: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: roleMap[foundUser.role] || UserRole.STAFF,
      };
      
      const authUser = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        surname: '',
        role: foundUser.role.toUpperCase() as any,
        isActive: true,
        is_super_admin: foundUser.role === 'super_admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setCurrentUser(roleUser);
      // Token ve user'ı kaydet (fallback için mock token)
      authStore.setUser(authUser);
      useAuthStore.setState({ 
        token: 'fallback_token_' + Date.now(), 
        isAuthenticated: true 
      });
      localStorage.setItem('akademi_current_user', JSON.stringify(roleUser));
      
      // Kullanıcının kurumunu bul ve seç
      if (foundUser.organization_id && organizations.length > 0) {
        const userOrg = organizations.find(
          o => o.id === foundUser.organization_id || o.slug === foundUser.organization_id
        );
        if (userOrg) {
          setCurrentOrganization(userOrg);
          toast.success(`Hoş geldiniz, ${foundUser.name}! (${userOrg.name})`);
        } else {
          toast.success(`Hoş geldiniz, ${foundUser.name}!`);
        }
      } else if (foundUser.role === 'super_admin') {
        // Super Admin - tüm kurumlara erişim
        if (organizations.length > 0) {
          setCurrentOrganization(organizations[0]);
        }
        toast.success(`Hoş geldiniz, ${foundUser.name}! (Franchise Yöneticisi)`);
      } else {
        toast.success(`Hoş geldiniz, ${foundUser.name}!`);
      }
      
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center p-4">
      {/* Dekoratif Elementler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm mb-6 shadow-2xl border border-white/20">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">AkademiHub</h1>
          <p className="text-[#DCF8C6] text-lg">Eğitim Yönetim Sistemi</p>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 justify-center mb-6">
            <Shield className="w-6 h-6 text-[#25D366]" />
            <h2 className="text-xl font-semibold text-white">Güvenli Giriş</h2>
          </div>

          {/* Bilgi Notu */}
          <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm text-white/70 text-center">
              E-posta adresiniz ile giriş yapın.<br/>
              Sistem kurumunuzu otomatik tespit edecek.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@kurum.com"
                  required
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#25D366] transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  data-password="true"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#25D366] transition no-uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Yardım */}
          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              Giriş bilgilerinizi hatırlamıyorsanız
              <br />
              <span className="text-[#25D366]">kurum yöneticinize</span> başvurun.
            </p>
          </div>
        </div>

        {/* Alt Bilgi */}
        <p className="text-center text-white/50 text-sm mt-8">
          © 2025 AkademiHub. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
