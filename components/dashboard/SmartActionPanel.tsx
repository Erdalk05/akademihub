'use client';

import React, { useMemo } from 'react';
import { 
  Phone, 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare,
  Calendar,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  ArrowRight,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { analyzeRisk, calculateRiskStats as calcStats, type RiskAnalysis } from '@/lib/risk/RiskEngine';

interface ActionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'call' | 'reminder' | 'followup' | 'alert' | 'task';
  title: string;
  description: string;
  count?: number;
  amount?: number;
  actionLabel: string;
  actionLink?: string;
  icon: React.ElementType;
  riskInfo?: {
    trend: 'improving' | 'stable' | 'worsening' | 'unknown';
    topReasons: string[];
  };
}

interface SmartActionPanelProps {
  kpi: {
    activeStudents?: number;
    debtorStudents?: number;
    totalDebt?: number;
    monthlyCollection?: number;
    criticalStudents?: number;
    overdueInstallments?: number;
    todayDueCount?: number;
    weekDueCount?: number;
  };
  riskStudents?: Array<{
    id: string;
    name: string;
    debt: number;
    overdueDays: number;
  }>;
}

const priorityConfig = {
  critical: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-200',
    iconBg: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    text: 'text-red-700',
    glow: 'shadow-red-100'
  },
  high: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    text: 'text-amber-700',
    glow: 'shadow-amber-100'
  },
  medium: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    text: 'text-blue-700',
    glow: 'shadow-blue-100'
  },
  low: {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-700',
    glow: 'shadow-emerald-100'
  }
};

const typeLabels = {
  call: 'Aranacak',
  reminder: 'Hatırlatma',
  followup: 'Takip',
  alert: 'Uyarı',
  task: 'Görev'
};

export default function SmartActionPanel({ kpi, riskStudents = [] }: SmartActionPanelProps) {
  
  // ✅ RiskEngine ile detaylı analiz
  const riskAnalyses = useMemo<RiskAnalysis[]>(() => {
    return riskStudents.map(student => analyzeRisk({
      totalDebt: student.debt,
      overdueDays: student.overdueDays,
      overdueAmount: student.debt
    }));
  }, [riskStudents]);
  
  // ✅ Risk istatistikleri
  const riskStats = useMemo(() => {
    if (riskAnalyses.length === 0) return null;
    return calcStats(riskAnalyses);
  }, [riskAnalyses]);
  
  // ✅ Akıllı aksiyon listesi oluştur
  const actions = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];
    
    // RiskEngine'den gelen verilerle zenginleştirilmiş aksiyonlar
    const criticalAnalyses = riskAnalyses.filter(a => a.level === 'critical');
    const highAnalyses = riskAnalyses.filter(a => a.level === 'high');
    const worseningCount = riskAnalyses.filter(a => a.trend.direction === 'worsening').length;
    
    // 1. KRİTİK: RiskEngine critical seviyesindeki öğrenciler
    if (criticalAnalyses.length > 0) {
      const topReasons = criticalAnalyses.slice(0, 3).flatMap(a => a.reasons.slice(0, 1).map(r => r.title));
      items.push({
        id: 'critical-overdue',
        priority: 'critical',
        type: 'call',
        title: 'Kritik Risk - Acil Arayın',
        description: `${criticalAnalyses.length} öğrenci kritik risk seviyesinde. ${criticalAnalyses[0]?.summary || 'Acil müdahale gerekli.'}`,
        count: criticalAnalyses.length,
        amount: riskStudents.filter(s => s.overdueDays > 30).reduce((s, r) => s + r.debt, 0),
        actionLabel: 'Listeyi Gör',
        actionLink: '/students?filter=critical',
        icon: Phone,
        riskInfo: {
          trend: 'worsening',
          topReasons: [...new Set(topReasons)]
        }
      });
    }
    
    // 2. YÜKSEK: RiskEngine high seviyesindeki öğrenciler
    if (highAnalyses.length > 0) {
      items.push({
        id: 'high-overdue',
        priority: 'high',
        type: 'reminder',
        title: 'Yüksek Risk - Hatırlatma Gönder',
        description: `${highAnalyses.length} öğrenci yüksek risk. Ödeme hatırlatması gönderin.`,
        count: highAnalyses.length,
        actionLabel: 'Hatırlat',
        actionLink: '/students?filter=debt',
        icon: Bell,
        riskInfo: {
          trend: 'stable',
          topReasons: highAnalyses.slice(0, 2).flatMap(a => a.reasons.slice(0, 1).map(r => r.title))
        }
      });
    }
    
    // 3. TREND: Kötüleşen öğrenciler
    if (worseningCount > 0) {
      items.push({
        id: 'worsening-trend',
        priority: 'high',
        type: 'alert',
        title: 'Risk Artışı Uyarısı',
        description: `${worseningCount} öğrencinin risk seviyesi artıyor. Önlem alınmalı.`,
        count: worseningCount,
        actionLabel: 'İncele',
        actionLink: '/finance/reports/founder?tab=risk',
        icon: TrendingUp
      });
    }
    
    // 4. Bu hafta vadesi gelen
    const weekDue = kpi.weekDueCount || Math.round((kpi.debtorStudents || 0) * 0.3);
    if (weekDue > 0) {
      items.push({
        id: 'week-due',
        priority: 'medium',
        type: 'followup',
        title: 'Bu Hafta Vade Takibi',
        description: `${weekDue} taksit bu hafta vadesi geliyor. Önceden bilgilendirme yapın.`,
        count: weekDue,
        actionLabel: 'Takibe Al',
        actionLink: '/finance/installments?filter=this-week',
        icon: Calendar
      });
    }
    
    // 4. Bugün vadesi gelen
    const todayDue = kpi.todayDueCount || Math.round((kpi.debtorStudents || 0) * 0.1);
    if (todayDue > 0) {
      items.push({
        id: 'today-due',
        priority: 'high',
        type: 'task',
        title: 'Bugün Tahsil Edilecek',
        description: `${todayDue} taksit bugün vadesi doluyor. Tahsilat planlaması yapın.`,
        count: todayDue,
        actionLabel: 'Tahsilat Yap',
        actionLink: '/finance/payments',
        icon: Wallet
      });
    }
    
    // 5. Borçlu öğrenci oranı yüksek uyarısı
    const debtorRate = kpi.activeStudents && kpi.activeStudents > 0 
      ? ((kpi.debtorStudents || 0) / kpi.activeStudents) * 100 
      : 0;
    if (debtorRate > 50) {
      items.push({
        id: 'high-debt-rate',
        priority: 'high',
        type: 'alert',
        title: 'Borçlu Oranı Yüksek',
        description: `Öğrencilerin %${debtorRate.toFixed(0)}'si borçlu. Tahsilat stratejisi gözden geçirin.`,
        actionLabel: 'Rapor Gör',
        actionLink: '/finance/reports/founder',
        icon: TrendingDown
      });
    } else if (debtorRate > 30) {
      items.push({
        id: 'medium-debt-rate',
        priority: 'medium',
        type: 'alert',
        title: 'Borçlu Takibi Gerekli',
        description: `Öğrencilerin %${debtorRate.toFixed(0)}'si borçlu. Düzenli takip önerilir.`,
        actionLabel: 'Analiz Et',
        actionLink: '/finance/reports/founder',
        icon: Users
      });
    }
    
    // 6. Toplam alacak yüksek
    const totalDebt = kpi.totalDebt || 0;
    if (totalDebt > 500000) {
      items.push({
        id: 'high-total-debt',
        priority: totalDebt > 1000000 ? 'critical' : 'high',
        type: 'alert',
        title: 'Toplam Alacak Kontrolü',
        description: `₺${totalDebt.toLocaleString('tr-TR')} toplam alacak mevcut. Tahsilat planı oluşturun.`,
        amount: totalDebt,
        actionLabel: 'Plan Oluştur',
        actionLink: '/finance/reports/founder',
        icon: AlertTriangle
      });
    }
    
    // 7. Pozitif: Tahsilat durumu iyi
    const collectionRate = kpi.activeStudents && kpi.debtorStudents 
      ? ((kpi.activeStudents - kpi.debtorStudents) / kpi.activeStudents) * 100 
      : 0;
    if (collectionRate >= 80 && items.length < 3) {
      items.push({
        id: 'good-collection',
        priority: 'low',
        type: 'task',
        title: 'Tahsilat Durumu İyi',
        description: `%${collectionRate.toFixed(0)} tahsilat oranı. Devam eden performansı koruyun.`,
        actionLabel: 'Detay Gör',
        actionLink: '/finance/reports/founder',
        icon: CheckCircle
      });
    }
    
    // Önceliğe göre sırala
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 5);
  }, [kpi, riskStudents, riskAnalyses]);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Bugün Yapılacaklar</h3>
              <p className="text-white/70 text-xs">RiskEngine™ önerileri</p>
            </div>
          </div>
          <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
            {actions.length} aksiyon
          </span>
        </div>
        
        {/* Risk Stats Mini */}
        {riskStats && riskStats.totalAtRisk > 0 && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-white/80 text-xs">{riskStats.critical} kritik</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span className="text-white/80 text-xs">{riskStats.high} yüksek</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span className="text-white/80 text-xs">{riskStats.medium} orta</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="p-3 space-y-2">
        {actions.map((action) => {
          const config = priorityConfig[action.priority];
          const Icon = action.icon;
          
          return (
            <div
              key={action.id}
              className={`${config.bg} ${config.border} border rounded-xl p-3 transition-all hover:shadow-md ${config.glow}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`${config.iconBg} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${config.badge} text-[10px] font-bold px-1.5 py-0.5 rounded uppercase`}>
                      {typeLabels[action.type]}
                    </span>
                    {action.count && (
                      <span className="text-gray-500 text-xs font-medium">
                        {action.count} kişi
                      </span>
                    )}
                  </div>
                  <h4 className={`font-semibold text-sm ${config.text}`}>{action.title}</h4>
                  <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{action.description}</p>
                  
                  {/* Amount if exists */}
                  {action.amount && (
                    <p className={`text-sm font-bold ${config.text} mt-1`}>
                      ₺{action.amount.toLocaleString('tr-TR')}
                    </p>
                  )}
                  
                  {/* Risk Info - Trend & Reasons */}
                  {action.riskInfo && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {action.riskInfo.trend === 'worsening' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          <TrendingUp className="w-3 h-3" /> Artıyor
                        </span>
                      )}
                      {action.riskInfo.trend === 'improving' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <TrendingDown className="w-3 h-3" /> Düşüyor
                        </span>
                      )}
                      {action.riskInfo.topReasons.slice(0, 2).map((reason, idx) => (
                        <span key={idx} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Action Button */}
                {action.actionLink && (
                  <Link
                    href={action.actionLink}
                    className={`flex items-center gap-1 ${config.badge} px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition flex-shrink-0`}
                  >
                    {action.actionLabel}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <Link 
          href="/finance/reports/founder" 
          className="text-xs text-[#075E54] font-medium flex items-center gap-1 hover:underline"
        >
          Tüm raporları gör <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
