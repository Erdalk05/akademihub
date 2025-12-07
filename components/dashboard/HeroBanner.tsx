'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, Users, FileText, ArrowRight, MessageCircle, Shield } from 'lucide-react';
import { useRole } from '@/lib/contexts/RoleContext';

interface HeroBannerProps {
  userName?: string;
  onAIReport?: () => void;
  stats?: {
    revenue: number;
    activeStudents: number;
    paymentRate: number;
  };
}

export default function HeroBanner({ userName, onAIReport, stats }: HeroBannerProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { currentUser, isAdmin, isAccounting, isStaff } = useRole();
  
  // Kullanıcı adını al - öncelik: prop > currentUser > fallback
  const displayName = userName || currentUser?.name || 'Misafir';
  
  // Rol bazlı karşılama
  const getRoleGreeting = () => {
    if (isAdmin) return '👑 Admin Paneli';
    if (isAccounting) return '💰 Muhasebe Paneli';
    if (isStaff) return '📋 Personel Paneli';
    return '👋 Hoş geldiniz';
  };

  // Rol badge rengi
  const getRoleBadgeClass = () => {
    if (isAdmin) return 'bg-purple-500/30 text-purple-100 border-purple-400/50';
    if (isAccounting) return 'bg-emerald-500/30 text-emerald-100 border-emerald-400/50';
    return 'bg-sky-500/30 text-sky-100 border-sky-400/50';
  };
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `₺${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `₺${(value / 1000).toFixed(0)}K`;
    return `₺${value.toLocaleString('tr-TR')}`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] p-8 mb-8 shadow-2xl">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
      </div>
      
      {/* WhatsApp pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4">
          <MessageCircle className="w-16 h-16" />
        </div>
        <div className="absolute top-20 right-20">
          <MessageCircle className="w-12 h-12" />
        </div>
        <div className="absolute bottom-10 left-1/3">
          <MessageCircle className="w-10 h-10" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-white/80 text-sm">Hoş geldiniz,</p>
              {currentUser && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass()}`}>
                  <Shield className="w-3 h-3" />
                  {isAdmin ? 'Admin' : isAccounting ? 'Muhasebe' : 'Personel'}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {displayName}! 👋
            </h1>
            <p className="text-white/70">
              AkademiHub AI sistemi ile yönetim kolaylaştırıldı
            </p>
          </div>

          {/* AI Report Button */}
          <button
            onClick={onAIReport}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`flex items-center gap-2 px-6 py-3 bg-white rounded-2xl font-semibold text-[#075E54] transition-all transform hover:scale-105 ${
              isHovering ? 'shadow-2xl' : 'shadow-lg'
            }`}
          >
            <Sparkles className="w-5 h-5 text-[#25D366]" />
            AI Raporu Oluştur
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stats - Gerçek Veriler */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-sm">Toplam Sözleşme</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.revenue)}</p>
              <p className="text-white/50 text-xs mt-1">Canlı veri</p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-sm">Aktif Öğrenci</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.activeStudents}</p>
              <p className="text-white/50 text-xs mt-1">Kayıtlı öğrenci</p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#075E54]" />
                </div>
                <span className="text-white/80 text-sm">Ödeme Oranı</span>
              </div>
              <p className="text-2xl font-bold text-white">%{stats.paymentRate.toFixed(1)}</p>
              <p className="text-white/50 text-xs mt-1">Gerçek oran</p>
            </div>
          </div>
        )}
      </div>

      {/* Decorative circles - WhatsApp themed */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#25D366]/20 rounded-full -mr-36 -mt-36" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#DCF8C6]/10 rounded-full -ml-32 -mb-32" />
    </div>
  );
}
