'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, Users, FileText, ArrowRight, Shield } from 'lucide-react';
import { useRole } from '@/lib/contexts/RoleContext';

interface HeroBannerProps {
  userName?: string;
  onAIReport?: () => void;
  stats?: {
    revenue: number; // Toplam tahsilat
    totalContract: number; // Toplam sözleşme
    activeStudents: number;
    paymentRate: number;
  };
  isAllOrganizations?: boolean;
}

export default function HeroBanner({ userName, onAIReport, stats, isAllOrganizations }: HeroBannerProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { currentUser, isAdmin, isAccounting } = useRole();
  
  // Kullanıcı adını al
  const displayName = userName || currentUser?.name || 'Misafir';
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `₺${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `₺${(value / 1000).toFixed(0)}K`;
    return `₺${value.toLocaleString('tr-TR')}`;
  };

  // Rol badge rengi
  const getRoleBadgeClass = () => {
    if (isAdmin) return 'bg-purple-500/30 text-purple-100 border-purple-400/50';
    if (isAccounting) return 'bg-emerald-500/30 text-emerald-100 border-emerald-400/50';
    return 'bg-sky-500/30 text-sky-100 border-sky-400/50';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] p-5 mb-4 shadow-xl">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
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
            <h1 className="text-2xl font-bold text-white">
              {displayName}! 👋
            </h1>
            <p className="text-white/70 text-sm">
              AkademiHub AI sistemi ile yönetim kolaylaştırıldı
            </p>
          </div>

          {/* AI Report Button */}
          <button
            onClick={onAIReport}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`flex items-center gap-2 px-4 py-2 bg-white rounded-xl font-semibold text-sm text-[#075E54] transition-all transform hover:scale-105 ${
              isHovering ? 'shadow-xl' : 'shadow-md'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#25D366]" />
            AI Raporu Oluştur
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Stats - Kompakt */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-[#DCF8C6] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-xs">Toplam Sözleşme</span>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(stats.totalContract || 0)}</p>
              <p className="text-white/50 text-[10px]">{isAllOrganizations ? '🌐 Tüm Kurumlar' : 'Canlı veri'}</p>
            </div>

            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-[#DCF8C6] rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-xs">Aktif Öğrenci</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.activeStudents}</p>
              <p className="text-white/50 text-[10px]">Kayıtlı öğrenci</p>
            </div>

            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-[#DCF8C6] rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-xs">Ödeme Oranı</span>
              </div>
              <p className="text-xl font-bold text-white">%{stats.paymentRate.toFixed(1)}</p>
              <p className="text-white/50 text-[10px]">Gerçek oran</p>
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
