'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  CreditCard,
  Users,
  BarChart3,
  FileText,
  FileSignature,
  UserX,
} from 'lucide-react';
import { usePermission } from '@/lib/hooks/usePermission';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
  description: string;
  adminOnly?: boolean;
  accountingOrAdmin?: boolean;
}

const QuickAccessPanel: React.FC = () => {
  const { isAdmin, isAccounting, isLoading } = usePermission();

  // Loading durumunda boş dön
  if (isLoading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-xl h-28" />
      ))}
    </div>;
  }

  // WhatsApp temalı hızlı erişim butonları
  const allQuickActions: QuickAction[] = [
    {
      label: 'Yeni Öğrenci',
      href: '/enrollment/new',
      icon: <UserPlus size={20} />,
      gradient: 'from-[#075E54] to-[#128C7E]',
      description: 'Kayıt formu',
    },
    {
      label: 'Ödeme Al',
      href: '/students',
      icon: <CreditCard size={20} />,
      gradient: 'from-[#25D366] to-[#128C7E]',
      description: 'Öğrenci seçerek ödeme al',
      accountingOrAdmin: true,
    },
    {
      label: 'Öğrenci Listesi',
      href: '/students',
      icon: <Users size={20} />,
      gradient: 'from-[#128C7E] to-[#075E54]',
      description: 'Tüm öğrenciler',
    },
    {
      label: 'Finans',
      href: '/finance',
      icon: <BarChart3 size={20} />,
      gradient: 'from-[#075E54] to-[#25D366]',
      description: 'Mali özet',
      accountingOrAdmin: true,
    },
    {
      label: 'Rapor Oluştur',
      href: '/finance/reports/builder',
      icon: <FileText size={20} />,
      gradient: 'from-[#128C7E] to-[#25D366]',
      description: 'Detaylı raporlar',
      accountingOrAdmin: true,
    },
    {
      label: 'Sözleşmeler',
      href: '/finance/reports/contracts',
      icon: <FileSignature size={20} />,
      gradient: 'from-[#075E54] to-[#128C7E]',
      description: 'Sözleşme arşivi',
    },
    {
      label: 'Kaydı Silinen',
      href: '/students?filter=deleted',
      icon: <UserX size={20} />,
      gradient: 'from-red-500 to-rose-600',
      description: 'Silinen öğrenciler',
    },
  ];

  // Rol bazlı filtreleme - useMemo kaldırıldı
  const quickActions = allQuickActions.filter(action => {
    if (isAdmin) return true;
    if (action.adminOnly) return false;
    if (action.accountingOrAdmin && !isAccounting) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {quickActions.map((action, idx) => (
        <Link key={idx} href={action.href}>
          <div className="bg-white rounded-xl shadow-sm hover:shadow-lg border-2 border-[#25D366]/20 transition-all transform hover:scale-[1.02] hover:border-[#25D366] cursor-pointer p-3 h-full group">
            <div className={`bg-gradient-to-br ${action.gradient} w-11 h-11 rounded-xl flex items-center justify-center text-white mb-2 shadow-md group-hover:shadow-lg transition-all`}>
              {action.icon}
            </div>
            <h3 className="font-bold text-[#075E54] text-xs group-hover:text-[#128C7E] transition-colors leading-tight">{action.label}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default QuickAccessPanel;
