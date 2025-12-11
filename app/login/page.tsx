'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, Building2, ChevronDown } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { setCurrentUser } = useRole();
  const { organizations, fetchOrganizations, setCurrentOrganization } = useOrganizationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Kullanıcı listesi
  const [users, setUsers] = useState<StoredUser[]>(DEFAULT_USERS);
  const [isReady, setIsReady] = useState(false);

  // Kurumları yükle
  useEffect(() => {
    fetchOrganizations().then(() => {
      // Varsayılan olarak ilk kurumu seç
      if (organizations.length > 0 && !selectedOrg) {
        setSelectedOrg(organizations[0]);
      }
    });
  }, []);
  
  // Varsayılan kullanıcıları yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('akademi_users');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Varsayılan kullanıcıları mevcut listeye ekle (yoksa)
            const mergedUsers = [...parsed];
            DEFAULT_USERS.forEach(defaultUser => {
              if (!mergedUsers.find(u => u.email === defaultUser.email)) {
                mergedUsers.push(defaultUser);
              }
            });
            setUsers(mergedUsers);
            localStorage.setItem('akademi_users', JSON.stringify(mergedUsers));
          } else {
            setUsers(DEFAULT_USERS);
            localStorage.setItem('akademi_users', JSON.stringify(DEFAULT_USERS));
          }
        } catch {
          setUsers(DEFAULT_USERS);
          localStorage.setItem('akademi_users', JSON.stringify(DEFAULT_USERS));
        }
      } else {
        setUsers(DEFAULT_USERS);
        localStorage.setItem('akademi_users', JSON.stringify(DEFAULT_USERS));
      }
      setIsReady(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // 1. Önce API'yi dene (Supabase bağlantısı)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // API başarılı - Supabase'den kullanıcı geldi
        const authData = data.data;
        
        // Rol dönüşümü
        const roleMap: Record<string, UserRole> = {
          'admin': UserRole.ADMIN,
          'ADMIN': UserRole.ADMIN,
          'accounting': UserRole.ACCOUNTING,
          'ACCOUNTING': UserRole.ACCOUNTING,
          'accountant': UserRole.ACCOUNTING,
          'staff': UserRole.STAFF,
          'STAFF': UserRole.STAFF,
          'registrar': UserRole.STAFF,
        };
        
        // RoleContext için kullanıcı
        const roleUser: User = {
          id: authData.user.id,
          name: authData.user.name,
          email: authData.user.email,
          role: roleMap[authData.user.role] || UserRole.STAFF,
        };
        
        // Her iki store'u da güncelle
        setCurrentUser(roleUser);
        setUser(authData.user);
        
        // localStorage'a da kaydet (uyumluluk için)
        localStorage.setItem('akademi_current_user', JSON.stringify(roleUser));
        
        // Seçilen kurumu kaydet
        if (selectedOrg) {
          setCurrentOrganization(selectedOrg);
        }
        
        toast.success(`Hoş geldiniz, ${authData.user.name}!`);
        router.push('/dashboard');
        return;
      }
      
      // 2. API başarısız - Fallback olarak localStorage'ı dene
      const userList = users.length > 0 ? users : DEFAULT_USERS;
      const foundUser = userList.find(
        u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      
      if (!foundUser) {
        setError(data.error || 'Geçersiz e-posta veya şifre!');
        setIsLoading(false);
        return;
      }
      
      // Status kontrolü
      if (foundUser.status && foundUser.status !== 'active') {
        setError('Bu hesap pasif durumda. Yönetici ile iletişime geçin.');
        setIsLoading(false);
        return;
      }
      
      // Rol dönüşümü
      const roleMap: Record<string, UserRole> = {
        'admin': UserRole.ADMIN,
        'accounting': UserRole.ACCOUNTING,
        'staff': UserRole.STAFF,
      };
      
      // RoleContext için kullanıcı
      const roleUser: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: roleMap[foundUser.role] || UserRole.STAFF,
      };
      
      // AuthStore için kullanıcı
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
      
      // Her iki store'u da güncelle
      setCurrentUser(roleUser);
      setUser(authUser);
      
      // localStorage'a da kaydet
      localStorage.setItem('akademi_current_user', JSON.stringify(roleUser));
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: authUser,
          token: 'secure_token_' + Date.now(),
          isAuthenticated: true,
        },
        version: 0,
      }));
      
      toast.success(`Hoş geldiniz, ${foundUser.name}!`);
      router.push('/dashboard');
      
    } catch (error) {
      // Ağ hatası - Fallback olarak localStorage'ı dene
      const userList = users.length > 0 ? users : DEFAULT_USERS;
      const foundUser = userList.find(
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
        localStorage.setItem('akademi_current_user', JSON.stringify(roleUser));
        
        toast.success(`Hoş geldiniz, ${foundUser.name}! (Offline mod)`);
        router.push('/dashboard');
      } else {
        setError('Geçersiz e-posta veya şifre!');
      }
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
          <p className="text-[#DCF8C6] text-lg">AI Destekli Eğitim Yönetim Sistemi</p>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 justify-center mb-6">
            <Shield className="w-6 h-6 text-[#25D366]" />
            <h2 className="text-xl font-semibold text-white">Güvenli Giriş</h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            
            {/* Kurum Seçimi - Birden fazla kurum varsa göster */}
            {organizations.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Kurum Seçin
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <button
                    type="button"
                    onClick={() => setShowOrgSelector(!showOrgSelector)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white text-left focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/50 outline-none transition flex items-center justify-between"
                  >
                    <span>{selectedOrg?.name || 'Kurum Seçiniz'}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showOrgSelector ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showOrgSelector && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => {
                            setSelectedOrg(org);
                            setShowOrgSelector(false);
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#DCF8C6] transition ${
                            selectedOrg?.id === org.id ? 'bg-[#DCF8C6]' : ''
                          }`}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-[#075E54] to-[#25D366] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{org.name}</p>
                            <p className="text-xs text-gray-500">{org.slug}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
                  placeholder="ornek@akademihub.com"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
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
                  data-form-type="other"
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
              <span className="text-[#25D366]">sistem yöneticinize</span> başvurun.
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
