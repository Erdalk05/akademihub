'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, Users, FileText, ArrowRight, Shield, Wallet, CalendarCheck } from 'lucide-react';
import { useRole } from '@/lib/contexts/RoleContext';
import { useOrganizationStore } from '@/lib/store/organizationStore';

interface HeroBannerProps {
  userName?: string;
  onAIReport?: () => void;
  stats?: {
    revenue: number; // Toplam tahsilat
    totalContract: number; // Toplam sözleşme (eğitim)
    totalSales: number; // Toplam satışlar (diğer gelirler)
    activeStudents: number;
    paymentRate: number;
    cashBalance?: number; // Kasa bakiyesi
    dailyIncome?: number; // Günlük gelir
  };
  isAllOrganizations?: boolean;
}

export default function HeroBanner({ userName, onAIReport, stats, isAllOrganizations }: HeroBannerProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { currentUser, isAdmin, isAccounting } = useRole();
  const { currentOrganization } = useOrganizationStore();
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';
  
  // Kullanıcı adını al
  const displayName = userName || currentUser?.name || 'Misafir';
  
  const formatCurrency = (value: number) => {
    return `₺${value.toLocaleString('tr-TR')}`;
  };

  // Rol badge rengi
  const getRoleBadgeClass = () => {
    if (isAdmin) return 'bg-purple-500/30 text-purple-100 border-purple-400/50';
    if (isAccounting) return 'bg-emerald-500/30 text-emerald-100 border-emerald-400/50';
    return 'bg-sky-500/30 text-sky-100 border-sky-400/50';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] p-4 md:p-5 mb-4 shadow-xl">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header - Mobilde dikey, Desktop'ta yatay */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white/80 text-xs">Hoş geldiniz,</p>
              {currentUser && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getRoleBadgeClass()}`}>
                  <Shield className="w-2.5 h-2.5" />
                  {isAdmin ? 'Admin' : isAccounting ? 'Muhasebe' : 'Personel'}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {displayName}! 👋
            </h1>
            <p className="text-white/70 text-xs sm:text-sm">
              {organizationName} - Yönetim sistemi ile işlemler kolaylaştırıldı
            </p>
          </div>

          {/* AI Report Button - Mobilde kompakt */}
          <button
            onClick={onAIReport}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white rounded-xl font-semibold text-xs sm:text-sm text-[#075E54] transition-all transform hover:scale-105 self-start sm:self-auto ${
              isHovering ? 'shadow-xl' : 'shadow-md'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366]" />
            <span className="hidden xs:inline">AI</span> Raporu Oluştur
            <ArrowRight className="w-3 h-3 hidden sm:block" />
          </button>
        </div>

        {/* Quick Stats - Mobilde 2x3, Desktop'ta 6x1 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {/* Toplam Eğitim */}
            <div className="bg-white/15 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <div className="w-6 h-6 md:w-7 md:h-7 bg-[#DCF8C6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-[10px] md:text-[11px] leading-tight">Toplam Eğitim</span>
              </div>
              <p className="text-sm md:text-base font-bold text-white truncate">{formatCurrency(stats.totalContract || 0)}</p>
              <p className="text-white/50 text-[8px] md:text-[9px]">Eğitim sözleşmeleri</p>
            </div>

            {/* Satışlar */}
            <div className="bg-white/15 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <div className="w-6 h-6 md:w-7 md:h-7 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-700" />
                </div>
                <span className="text-white/80 text-[10px] md:text-[11px]">Satışlar</span>
              </div>
              <p className="text-sm md:text-base font-bold text-white truncate">{formatCurrency(stats.totalSales || 0)}</p>
              <p className="text-white/50 text-[8px] md:text-[9px]">Kitap, yemek vb.</p>
            </div>

            {/* 💰 Kasa - YENİ */}
            <div className="bg-white/15 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <div className="w-6 h-6 md:w-7 md:h-7 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-700" />
                </div>
                <span className="text-white/80 text-[10px] md:text-[11px]">Kasa</span>
              </div>
              <p className="text-sm md:text-base font-bold text-white truncate">{formatCurrency(stats.cashBalance || 0)}</p>
              <p className="text-white/50 text-[8px] md:text-[9px]">Mevcut bakiye</p>
            </div>

            {/* 📅 Günlük Gelir - YENİ */}
            <div className="bg-white/15 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <div className="w-6 h-6 md:w-7 md:h-7 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-700" />
                </div>
                <span className="text-white/80 text-[10px] md:text-[11px]">Günlük Gelir</span>
              </div>
              <p className="text-sm md:text-base font-bold text-white truncate">{formatCurrency(stats.dailyIncome || 0)}</p>
              <p className="text-white/50 text-[8px] md:text-[9px]">Bugünkü tahsilat</p>
            </div>

            {/* Aktif Öğrenci */}
            <div className="bg-white/15 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <div className="w-6 h-6 md:w-7 md:h-7 bg-[#DCF8C6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-[10px] md:text-[11px] leading-tight">Aktif Öğrenci</span>
              </div>
              <p className="text-sm md:text-base font-bold text-white">{stats.activeStudents}</p>
              <p className="text-white/50 text-[8px] md:text-[9px]">Kayıtlı öğrenci</p>
            </div>

            {/* Ödeme Oranı */}
            <div className="bg-white/15 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <div className="w-6 h-6 md:w-7 md:h-7 bg-[#DCF8C6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-[10px] md:text-[11px] leading-tight">Ödeme Oranı</span>
              </div>
              <p className="text-sm md:text-base font-bold text-white">%{stats.paymentRate.toFixed(1)}</p>
              <p className="text-white/50 text-[8px] md:text-[9px]">Gerçek oran</p>
            </div>
          </div>
        )}
      </div>

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#25D366]/20 rounded-full -mr-24 -mt-24" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#DCF8C6]/10 rounded-full -ml-20 -mb-20" />
    </div>
  );
}
