'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  ChevronDown,
  LogOut,
  TrendingUp,
  Zap,
  UserPlus,
  Wallet,
  PieChart,
  BarChart3,
  FileSignature,
  Shield,
  Package,
} from 'lucide-react';
import { usePermission } from '@/lib/hooks/usePermission';
import { useRole } from '@/lib/contexts/RoleContext';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
  badge?: number;
  adminOnly?: boolean; // Sadece admin görebilir
  accountingOrAdmin?: boolean; // Admin veya muhasebe görebilir
}

const Sidebar: React.FC<{ onClose?: () => void; collapsed?: boolean }> = ({
  onClose,
  collapsed = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isAccounting, isLoading } = usePermission();
  const { currentUser, setCurrentUser } = useRole();
  const { logout } = useAuthStore();
  
  // Tüm navigasyon öğeleri
  const allNavigationItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Ogrenciler',
      href: '/students',
      icon: <Users size={20} />,
      submenu: [
        { label: 'Tum Ogrenciler', href: '/students', icon: <Users size={16} /> },
        { label: 'Yeni Kayit', href: '/enrollment', icon: <UserPlus size={16} /> },
      ],
    },
    {
      label: 'Finans',
      href: '/finance',
      icon: <Wallet size={20} />,
      accountingOrAdmin: true, // Admin veya muhasebe görebilir
      submenu: [
        { label: 'Genel Bakis', href: '/finance', icon: <TrendingUp size={16} /> },
        { label: 'Tahsilatlar', href: '/finance/payments', icon: <CreditCard size={16} /> },
        { label: 'Diger Gelirler', href: '/finance/other-income', icon: <Package size={16} /> },
        { label: 'Giderler', href: '/finance/expenses', icon: <Zap size={16} /> },
        { label: 'Kasa & Banka', href: '/finance/cash-bank', icon: <Wallet size={16} /> },
      ],
    },
    {
      label: 'Raporlar',
      href: '/finance/reports',
      icon: <PieChart size={20} />,
      accountingOrAdmin: true, // Admin veya muhasebe görebilir
      submenu: [
        { label: 'Kurucu Raporu', href: '/finance/reports/founder', icon: <BarChart3 size={16} />, adminOnly: true },
        { label: 'Finansal Raporlar', href: '/finance/reports', icon: <TrendingUp size={16} /> },
        { label: 'Sozlesmeler', href: '/finance/reports/contracts', icon: <FileSignature size={16} /> },
        { label: 'Rapor Olusturucu', href: '/finance/reports/builder', icon: <BarChart3 size={16} /> },
      ],
    },
    {
      label: 'Ayarlar',
      href: '/settings',
      icon: <Settings size={20} />,
      adminOnly: true, // Sadece admin görebilir
    },
  ];

  // Rol bazlı filtreleme - useMemo kaldırıldı
  const navigationItems = allNavigationItems
    .filter(item => {
      if (isAdmin) return true;
      if (item.adminOnly) return false;
      if (item.accountingOrAdmin && !isAccounting) return false;
      return true;
    })
    .map(item => {
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(subItem => {
            if (isAdmin) return true;
            if (subItem.adminOnly) return false;
            return true;
          }),
        };
      }
      return item;
    });
  
  const getActiveMenu = () => {
    if (pathname.startsWith('/finance/reports')) return 'Raporlar';
    if (pathname.startsWith('/finance')) return 'Finans';
    if (pathname.startsWith('/students') || pathname.startsWith('/enrollment')) return 'Ogrenciler';
    if (pathname.startsWith('/settings')) return 'Ayarlar';
    return null;
  };
  
  const [expandedMenu, setExpandedMenu] = useState<string | null>(getActiveMenu());

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const handleNavClick = () => {
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  // Çıkış işlemi
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

  // Rol badge renkleri
  const getRoleBadge = () => {
    if (isAdmin) return { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Admin' };
    if (isAccounting) return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Muhasebe' };
    return { bg: 'bg-sky-500/20', text: 'text-sky-300', label: 'Personel' };
  };

  const roleBadge = getRoleBadge();

  // Loading durumunda basit sidebar göster
  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#075E54] via-[#128C7E] to-[#075E54]">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center font-bold text-[#075E54] text-lg shadow-lg">
              AH
            </div>
            {!collapsed && <span className="font-bold text-lg text-white">AkademiHub</span>}
          </div>
        </div>
        <div className="flex-1 p-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded-xl mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#075E54] via-[#128C7E] to-[#075E54]">
      {/* Logo - WhatsApp Style - Dashboard'a yönlendir */}
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={handleNavClick}>
          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center font-bold text-[#075E54] text-lg shadow-lg">
            AH
          </div>
          {!collapsed && <span className="font-bold text-lg text-white">AkademiHub</span>}
        </Link>
      </div>

      {/* Kullanıcı Bilgisi & Rol Göstergesi */}
      {!collapsed && currentUser && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
              isAdmin ? 'bg-purple-500' : isAccounting ? 'bg-emerald-500' : 'bg-sky-500'
            }`}>
              {currentUser.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{currentUser.name}</p>
              <p className="text-white/50 text-xs truncate">{currentUser.email}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}>
            <Shield size={14} />
            <span>{roleBadge.label}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item, idx) => (
          <div key={idx}>
            {item.submenu && item.submenu.length > 0 ? (
              <button
                onClick={() => toggleSubmenu(item.label)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  expandedMenu === item.label || item.submenu.some((sub) => isActive(sub.href))
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>

                {!collapsed && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedMenu === item.label ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>
            ) : (
              <Link
                href={item.href!}
                onClick={handleNavClick}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  isActive(item.href)
                    ? 'bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 font-semibold'
                    : 'hover:bg-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className="bg-white text-[#075E54] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            )}

            {item.submenu && item.submenu.length > 0 && expandedMenu === item.label && !collapsed && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#25D366]/50 pl-3">
                {item.submenu.map((subitem, sidx) => (
                  <Link
                    key={sidx}
                    href={subitem.href!}
                    onClick={handleNavClick}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
                      isActive(subitem.href)
                        ? 'bg-[#25D366] text-white font-medium'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {subitem.icon}
                    {!collapsed && <span>{subitem.label}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer - Çıkış Butonu */}
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-white/80 hover:text-red-300 transition-all"
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Çıkış Yap</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
