'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Shield, Loader, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useRole } from '@/lib/contexts/RoleContext';
import { UserRole, User } from '@/lib/types/role-types';
import { useOrganizationStore, Organization } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';

// Varsayılan kullanıcılar (eğer localStorage boşsa)
const DEFAULT_USERS = [
  {
    id: 'admin_001',
    name: 'Sistem Admin',
    email: 'admin@akademihub.com',
    password: 'admin123',
    phone: '0532 000 0001',
    role: 'admin' as const,
    status: 'active' as const,
  },
  {
    id: 'muhasebe_001',
    name: 'Muhasebe Uzmanı',
    email: 'muhasebe@akademihub.com',
    password: 'muhasebe123',
    phone: '0532 000 0002',
    role: 'accounting' as const,
    status: 'active' as const,
  },
  {
    id: 'personel_001',
    name: 'Kayıt Personeli',
    email: 'personel@akademihub.com',
    password: 'personel123',
    phone: '0532 000 0003',
    role: 'staff' as const,
    status: 'active' as const,
  },
];

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'admin' | 'accounting' | 'staff';
  status?: 'active' | 'inactive';
}

export default function OrganizationLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const { setUser } = useAuthStore();
  const { setCurrentUser } = useRole();
  const { organizations, fetchOrganizations, setCurrentOrganization } = useOrganizationStore();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);
  const [orgNotFound, setOrgNotFound] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Kullanıcı listesi
  const [users, setUsers] = useState<StoredUser[]>(DEFAULT_USERS);

  // Kurum bilgisini slug'dan al
  useEffect(() => {
    const loadOrganization = async () => {
      setIsLoadingOrg(true);
      
      // Önce store'daki organizasyonları kontrol et
      if (organizations.length === 0) {
        await fetchOrganizations();
      }
      
      // Slug'a göre kurumu bul
      const org = organizations.find(o => o.slug === slug);
      
      if (org) {
        setOrganization(org);
        setOrgNotFound(false);
      } else {
        // API'den direkt çek
        try {
          const res = await fetch(`/api/organizations?slug=${slug}`);
          const data = await res.json();
          
          if (data.success && data.data && data.data.length > 0) {
            setOrganization(data.data[0]);
            setOrgNotFound(false);
          } else {
            setOrgNotFound(true);
          }
        } catch {
          setOrgNotFound(true);
        }
      }
      
      setIsLoadingOrg(false);
    };
    
    if (slug) {
      loadOrganization();
    }
  }, [slug, organizations, fetchOrganizations]);

  // Varsayılan kullanıcıları yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('akademi_users');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mergedUsers = [...parsed];
            DEFAULT_USERS.forEach(defaultUser => {
              if (!mergedUsers.find(u => u.email === defaultUser.email)) {
                mergedUsers.push(defaultUser);
              }
            });
            setUsers(mergedUsers);
          } else {
            setUsers(DEFAULT_USERS);
          }
        } catch {
          setUsers(DEFAULT_USERS);
        }
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!organization) {
      setError('Kurum bilgisi bulunamadı.');
      setIsLoading(false);
      return;
    }
    
    try {
      // API'yi dene
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password,
          organization_id: organization.id 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const authData = data.data;
        
        const roleMap: Record<string, UserRole> = {
          'super_admin': UserRole.SUPER_ADMIN,
          'SUPER_ADMIN': UserRole.SUPER_ADMIN,
          'franchise': UserRole.SUPER_ADMIN,
          'admin': UserRole.ADMIN,
          'ADMIN': UserRole.ADMIN,
          'accounting': UserRole.ACCOUNTING,
          'ACCOUNTING': UserRole.ACCOUNTING,
          'accountant': UserRole.ACCOUNTING,
          'staff': UserRole.STAFF,
          'STAFF': UserRole.STAFF,
          'registrar': UserRole.STAFF,
        };
        
        const roleUser: User = {
          id: authData.user.id,
          name: authData.user.name,
          email: authData.user.email,
          role: roleMap[authData.user.role] || UserRole.STAFF,
        };
        
        setCurrentUser(roleUser);
        setUser(authData.user);
        localStorage.setItem('akademi_current_user', JSON.stringify(roleUser));
        
        // Kurumu kaydet
        setCurrentOrganization(organization);
        
        toast.success(`Hoş geldiniz, ${authData.user.name}! (${organization.name})`);
        router.push('/dashboard');
        return;
      }
      
      // Fallback: localStorage
      const foundUser = users.find(
        u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      
      if (!foundUser) {
        setError(data.error || 'Geçersiz e-posta veya şifre!');
        setIsLoading(false);
        return;
      }
      
      if (foundUser.status && foundUser.status !== 'active') {
        setError('Bu hesap pasif durumda.');
        setIsLoading(false);
        return;
      }
      
      const roleMap: Record<string, UserRole> = {
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setCurrentUser(roleUser);
      setUser(authUser);
      localStorage.setItem('akademi_current_user', JSON.stringify(roleUser));
      
      // Kurumu kaydet
      setCurrentOrganization(organization);
      
      toast.success(`Hoş geldiniz, ${foundUser.name}! (${organization.name})`);
      router.push('/dashboard');
      
    } catch (error) {
      // Ağ hatası - Fallback
      const foundUser = users.find(
        u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      
      if (foundUser && (!foundUser.status || foundUser.status === 'active')) {
        const roleMap: Record<string, UserRole> = {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setCurrentUser(roleUser);
        setUser(authUser);
        setCurrentOrganization(organization!);
        
        toast.success(`Hoş geldiniz, ${foundUser.name}! (Offline mod)`);
        router.push('/dashboard');
      } else {
        setError('Geçersiz e-posta veya şifre!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Kurum yüklenirken
  if (isLoadingOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Kurum bilgisi yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Kurum bulunamadı
  if (orgNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-300" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Kurum Bulunamadı</h1>
          <p className="text-white/70 mb-6">
            &quot;{slug}&quot; adresine ait kurum sistemde kayıtlı değil.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition"
          >
            Ana Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center p-4">
      {/* Dekoratif Elementler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Kurum Logosu ve Başlık */}
        <div className="text-center mb-8">
          {organization?.logo_url ? (
            <img 
              src={organization.logo_url} 
              alt={organization.name} 
              className="w-24 h-24 object-contain mx-auto mb-6 rounded-2xl bg-white/10 p-2"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm mb-6 shadow-2xl border border-white/20">
              <Building2 className="w-12 h-12 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">{organization?.name}</h1>
          <p className="text-[#DCF8C6] text-lg">Eğitim Yönetim Sistemi</p>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 justify-center mb-6">
            <Shield className="w-6 h-6 text-[#25D366]" />
            <h2 className="text-xl font-semibold text-white">Personel Girişi</h2>
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
                  className="w-full pl-12 pr-12 py-3.5 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#25D366] transition"
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
          © 2025 AkademiHub. Powered by AI.
        </p>
      </div>
    </div>
  );
}
