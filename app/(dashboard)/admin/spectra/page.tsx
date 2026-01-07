'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import {
  Target,
  FileText,
  List,
  Users,
  User,
  BarChart3,
  Building2,
  TrendingUp,
  AlertTriangle,
  Bot,
  FileSpreadsheet,
  Settings,
  Loader2,
  Calendar,
  Award,
  Clock,
  UserCheck,
  UserX,
  Percent,
  FileEdit,
  ChevronRight,
} from 'lucide-react';

// ============================================
// SPECTRA DASHBOARD - Ana Sayfa
// ============================================

interface DashboardStats {
  totalExams: number;
  totalParticipants: number;
  avgNet: number;
  avgNetChange: number;
  topClass: string;
  topClassAvg: number;
  lastExamDate: string;
  lastExamName: string;
  pendingMatches: number;
  asilCount: number;
  misafirCount: number;
  avgSuccess: number;
  thisMonthExams: number;
}

// Aksiyon kartları - array yapısı (kolay ekleme için)
const actionCards = [
  {
    id: 'new-exam',
    icon: FileEdit,
    title: 'Yeni Sınav Ekle',
    description: 'Sınav yükle ve analiz et',
    href: '/admin/spectra/sihirbaz',
    color: 'emerald' as const,
  },
  {
    id: 'exams-list',
    icon: List,
    title: 'Sınavlar Listesi',
    description: 'Tüm sınavları görüntüle',
    href: '/admin/spectra/sinavlar',
    color: 'blue' as const,
  },
  {
    id: 'students-performance',
    icon: Users,
    title: 'Öğrenciler Performans',
    description: 'Asil öğrenci analizleri',
    href: '/admin/spectra/ogrenciler',
    color: 'purple' as const,
  },
  {
    id: 'guest-students',
    icon: User,
    title: 'Misafir Öğrenciler',
    description: 'Misafir liste ve eşleştirme',
    href: '/admin/spectra/misafirler',
    color: 'orange' as const,
  },
  {
    id: 'report-cards',
    icon: FileText,
    title: 'Karneler',
    description: 'Öğrenci karne raporları',
    href: '/admin/spectra/karneler',
    color: 'teal' as const,
  },
  {
    id: 'class-comparison',
    icon: Building2,
    title: 'Sınıf Karşılaştırma',
    description: 'Sınıflar arası performans',
    href: '/admin/spectra/sinif-karsilastirma',
    color: 'indigo' as const,
  },
  {
    id: 'trend-analysis',
    icon: TrendingUp,
    title: 'Trend Analizi',
    description: 'Zaman serisi analizleri',
    href: '/admin/spectra/trend',
    color: 'cyan' as const,
  },
  {
    id: 'target-tracking',
    icon: Target,
    title: 'Hedef Takibi',
    description: 'LGS/YKS hedef takip',
    href: '/admin/spectra/hedefler',
    color: 'rose' as const,
  },
  {
    id: 'risk-students',
    icon: AlertTriangle,
    title: 'Risk Öğrenciler',
    description: 'Düşüş riski olanlar',
    href: '/admin/spectra/risk',
    color: 'red' as const,
  },
  {
    id: 'ai-recommendations',
    icon: Bot,
    title: 'AI Öneriler',
    description: 'Akıllı analiz ve öneriler',
    href: '/admin/spectra/ai',
    color: 'violet' as const,
  },
  {
    id: 'reports',
    icon: FileSpreadsheet,
    title: 'Raporlar',
    description: 'PDF/Excel raporları',
    href: '/admin/spectra/raporlar',
    color: 'amber' as const,
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Ayarlar',
    description: 'Modül ayarları',
    href: '/admin/spectra/ayarlar',
    color: 'slate' as const,
  },
];

// Renk haritası
const colorMap = {
  emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200',
  blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
  purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
  orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200',
  teal: 'bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-200',
  indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200',
  cyan: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-200',
  rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200',
  red: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200',
  violet: 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-200',
  amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200',
  slate: 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200',
};

const iconBgMap = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500',
  rose: 'bg-rose-500',
  red: 'bg-red-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-500',
};

export default function SpectraDashboard() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    // TODO: Gerçek API bağlantısı yapılacak
    // Şimdilik mock data
    const mockStats: DashboardStats = {
      totalExams: 24,
      totalParticipants: 1247,
      avgNet: 67.3,
      avgNetChange: 2.1,
      topClass: '8/A',
      topClassAvg: 72.4,
      lastExamDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastExamName: 'LGS Deneme #5',
      pendingMatches: 12,
      asilCount: 113,
      misafirCount: 34,
      avgSuccess: 72.4,
      thisMonthExams: 5,
    };

    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 500);
  }, [currentOrganization?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    return `${diffDays} gün önce`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ============================================ */}
        {/* HEADER BANNER - Yeşil Gradient */}
        {/* ============================================ */}
        <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black flex items-center gap-2">
                  🎯 Spectra - Sınav Analiz Merkezi
                </h1>
                <p className="text-white/80 mt-1">
                  {currentOrganization?.name || 'Kurum'} - Detaylı sınav analizleri ve performans takibi
                </p>
              </div>
            </div>
            <Link
              href="/admin/spectra/raporlar"
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              Rapor Oluştur
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ============================================ */}
        {/* ÜST İSTATİSTİK KARTLARI - 6 Kart */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {/* Toplam Sınav */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-white/80" />
              <span className="text-xs font-medium text-white/80">Toplam Sınav</span>
            </div>
            <p className="text-2xl font-black">{stats?.totalExams || 0}</p>
            <p className="text-xs text-white/60 mt-1">Bu dönem</p>
          </div>

          {/* Toplam Katılımcı */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-white/80" />
              <span className="text-xs font-medium text-white/80">Toplam Katılımcı</span>
            </div>
            <p className="text-2xl font-black">{stats?.totalParticipants?.toLocaleString('tr-TR') || 0}</p>
            <p className="text-xs text-white/60 mt-1">{stats?.asilCount || 0} asil</p>
          </div>

          {/* Ortalama Net */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-white/80" />
              <span className="text-xs font-medium text-white/80">Ort. Net</span>
            </div>
            <p className="text-2xl font-black">{stats?.avgNet?.toFixed(1) || 0}</p>
            <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
              {(stats?.avgNetChange || 0) > 0 ? '↑' : '↓'}+{stats?.avgNetChange?.toFixed(1) || 0}
            </p>
          </div>

          {/* En İyi Performans */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-white/80" />
              <span className="text-xs font-medium text-white/80">En İyi Performans</span>
            </div>
            <p className="text-2xl font-black">{stats?.topClass || '-'}</p>
            <p className="text-xs text-white/60 mt-1">{stats?.topClassAvg?.toFixed(1) || 0} net</p>
          </div>

          {/* Son Sınav */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-white/80" />
              <span className="text-xs font-medium text-white/80">Son Sınav</span>
            </div>
            <p className="text-lg font-black truncate">{stats?.lastExamDate ? formatDate(stats.lastExamDate) : '-'}</p>
            <p className="text-xs text-white/60 mt-1 truncate">{stats?.lastExamName || '-'}</p>
          </div>

          {/* Bekleyen Eşleşme */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-white/80" />
              <span className="text-xs font-medium text-white/80">Bekleyen Eşleşme</span>
            </div>
            <p className="text-2xl font-black">{stats?.pendingMatches || 0}</p>
            <p className="text-xs text-white/60 mt-1">öğrenci</p>
          </div>
        </div>

        {/* ============================================ */}
        {/* AKSİYON KARTLARI - 4x3 Grid (12 Kart) */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md group ${colorMap[card.color]}`}
              >
                <div className={`w-12 h-12 ${iconBgMap[card.color]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500">{card.description}</p>
              </Link>
            );
          })}
        </div>

        {/* ============================================ */}
        {/* ALT ÖZET KARTLARI - 4 Kart */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Asil Öğrenci */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Asil Öğrenci</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats?.asilCount || 0}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Misafir */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Misafir</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats?.misafirCount || 0}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Ort. Başarı */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Ort. Başarı</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">%{stats?.avgSuccess?.toFixed(1) || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Bu Ay Sınav */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Bu Ay Sınav</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats?.thisMonthExams || 0}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

