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
  Receipt,
} from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
  description: string;
}

const QuickAccessPanel: React.FC = () => {
  // 1. Satır - 4 kart
  const row1Actions: QuickAction[] = [
    {
      label: 'Yeni Öğrenci',
      href: '/enrollment/new',
      icon: <UserPlus size={24} />,
      gradient: 'from-[#075E54] to-[#128C7E]',
      description: 'Kayıt formu',
    },
    {
      label: 'Ödeme Al',
      href: '/students',
      icon: <CreditCard size={24} />,
      gradient: 'from-[#25D366] to-[#128C7E]',
      description: 'Öğrenci seçerek ödeme al',
    },
    {
      label: 'Öğrenci Listesi',
      href: '/students',
      icon: <Users size={24} />,
      gradient: 'from-[#128C7E] to-[#075E54]',
      description: 'Tüm öğrenciler',
    },
    {
      label: 'Finans',
      href: '/finance',
      icon: <BarChart3 size={24} />,
      gradient: 'from-[#075E54] to-[#25D366]',
      description: 'Mali özet',
    },
  ];

  // 2. Satır - 4 kart
  const row2Actions: QuickAction[] = [
    {
      label: 'Rapor Oluştur',
      href: '/finance/reports/builder',
      icon: <FileText size={24} />,
      gradient: 'from-[#128C7E] to-[#25D366]',
      description: 'Detaylı raporlar',
    },
    {
      label: 'Sözleşmeler',
      href: '/finance/reports/contracts',
      icon: <FileSignature size={24} />,
      gradient: 'from-[#075E54] to-[#128C7E]',
      description: 'Sözleşme arşivi',
    },
    {
      label: 'Kaydı Silinen',
      href: '/students?filter=deleted',
      icon: <UserX size={24} />,
      gradient: 'from-red-500 to-rose-600',
      description: 'Silinen öğrenciler',
    },
    {
      label: 'Gider Ekle',
      href: '/finance/expenses/new',
      icon: <Receipt size={24} />,
      gradient: 'from-amber-500 to-orange-600',
      description: 'Yeni gider kaydı',
    },
  ];

  const renderCard = (action: QuickAction, idx: number) => (
    <Link key={idx} href={action.href}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg border-2 border-[#25D366]/20 transition-all transform hover:scale-[1.02] hover:border-[#25D366] cursor-pointer p-4 h-full group">
        <div className={`bg-gradient-to-br ${action.gradient} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-md group-hover:shadow-lg transition-all`}>
          {action.icon}
        </div>
        <h3 className="font-bold text-[#075E54] text-sm group-hover:text-[#128C7E] transition-colors">{action.label}</h3>
        <p className="text-xs text-gray-500 mt-1">{action.description}</p>
      </div>
    </Link>
  );

  return (
    <div className="space-y-3">
      {/* 1. Satır - 4 kart */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {row1Actions.map(renderCard)}
      </div>
      
      {/* 2. Satır - 4 kart */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {row2Actions.map(renderCard)}
      </div>
    </div>
  );
};

export default QuickAccessPanel;
