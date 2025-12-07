'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/contexts/RoleContext';
import { useAuthStore } from '@/lib/store';
import { UserRole, User } from '@/lib/types/role-types';
import { 
  Shield, 
  ChevronDown, 
  User as UserIcon, 
  DollarSign, 
  Briefcase,
  LogOut,
  Settings,
  Key
} from 'lucide-react';
import toast from 'react-hot-toast';

// Sadece aktif roller: Admin, Muhasebe, Personel
const ACTIVE_ROLES = [UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.STAFF];

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.ACCOUNTING]: 'Muhasebe',
  [UserRole.TEACHER]: 'Öğretmen',
  [UserRole.PARENT]: 'Veli',
  [UserRole.STAFF]: 'Personel',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Tüm yetkilere sahip',
  [UserRole.ACCOUNTING]: 'Finansal işlemler',
  [UserRole.TEACHER]: 'Eğitim işlemleri',
  [UserRole.PARENT]: 'Veli paneli',
  [UserRole.STAFF]: 'Kayıt işlemleri',
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  [UserRole.ADMIN]: <Shield className="w-4 h-4" />,
  [UserRole.ACCOUNTING]: <DollarSign className="w-4 h-4" />,
  [UserRole.TEACHER]: <UserIcon className="w-4 h-4" />,
  [UserRole.PARENT]: <UserIcon className="w-4 h-4" />,
  [UserRole.STAFF]: <Briefcase className="w-4 h-4" />,
};

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string; icon: string }> = {
  [UserRole.ADMIN]: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    border: 'border-purple-200',
    icon: 'bg-purple-500'
  },
  [UserRole.ACCOUNTING]: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    icon: 'bg-emerald-500'
  },
  [UserRole.TEACHER]: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    icon: 'bg-blue-500'
  },
  [UserRole.PARENT]: { 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    border: 'border-orange-200',
    icon: 'bg-orange-500'
  },
  [UserRole.STAFF]: { 
    bg: 'bg-sky-50', 
    text: 'text-sky-700', 
    border: 'border-sky-200',
    icon: 'bg-sky-500'
  },
};

export default function RoleSwitcher() {
  const router = useRouter();
  const { currentUser, setCurrentUser, isAdmin } = useRole();
  const { logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const colors = ROLE_COLORS[currentUser.role];

  // Sadece admin rol değiştirebilir
  const handleRoleSwitch = (role: UserRole) => {
    if (!isAdmin) {
      toast.error('Rol değiştirme yetkisi sadece Admin\'e aittir');
      return;
    }
    
    const newUser: User = {
      ...currentUser,
      role,
    };
    setCurrentUser(newUser);
    setIsOpen(false);
    toast.success(`Rol değiştirildi: ${ROLE_LABELS[role]}`);
  };

  // Çıkış yap
  const handleLogout = () => {
    // localStorage'ı temizle
    localStorage.removeItem('akademi_current_user');
    localStorage.removeItem('auth-storage');
    
    // Store'ları temizle
    setCurrentUser(null);
    logout();
    
    toast.success('Başarıyla çıkış yapıldı');
    router.push('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition shadow-sm hover:shadow-md ${colors.bg} ${colors.text} ${colors.border}`}
      >
        {/* Kullanıcı Avatarı */}
        <div className={`w-8 h-8 ${colors.icon} rounded-lg flex items-center justify-center text-white`}>
          {currentUser.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        
        {/* Kullanıcı Bilgisi */}
        <div className="hidden sm:block text-left">
          <p className="font-bold text-sm leading-tight">{currentUser.name}</p>
          <p className="text-xs opacity-70">{ROLE_LABELS[currentUser.role]}</p>
        </div>
        
        <ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#075E54] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#25D366]/30 overflow-hidden z-50">
          {/* Kullanıcı Bilgi Başlığı */}
          <div className={`p-4 ${colors.bg} border-b ${colors.border}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                {currentUser.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className={`font-bold ${colors.text}`}>{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {ROLE_ICONS[currentUser.role]}
                  <span>{ROLE_LABELS[currentUser.role]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rol Değiştirme (Sadece Admin için) */}
          {isAdmin && (
            <div className="p-2 border-b border-slate-100">
              <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                Giriş Türü Değiştir
              </p>
              {ACTIVE_ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition text-sm flex items-center gap-3 ${
                    currentUser.role === role 
                      ? `${ROLE_COLORS[role].bg} ${ROLE_COLORS[role].text}` 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ROLE_COLORS[role].icon} text-white`}>
                    {ROLE_ICONS[role]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{ROLE_LABELS[role]}</p>
                    <p className="text-[10px] text-slate-400">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                  {currentUser.role === role && (
                    <div className="w-2 h-2 rounded-full bg-[#25D366]"></div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Menü Seçenekleri */}
          <div className="p-2">
            {isAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/settings');
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition text-sm flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-slate-500" />
                </div>
                <span>Sistem Ayarları</span>
              </button>
            )}
            
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/profile/settings');
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition text-sm flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Key className="w-4 h-4 text-slate-500" />
              </div>
              <span>Şifre Değiştir</span>
            </button>
          </div>

          {/* Çıkış Butonu */}
          <div className="p-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition text-sm flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="font-medium">Çıkış Yap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
