'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore } from '@/lib/store';
import HeroBanner from '@/components/dashboard/HeroBanner';
import QuickAccessPanel from '@/components/layout/QuickAccessPanel';
import { Loader2, AlertTriangle, Users, TrendingDown, RefreshCw, Calendar, ChevronDown } from 'lucide-react';

// Akademik Yıllar
const ACADEMIC_YEARS = [
  { value: '2023-2024', label: '2023-2024' },
  { value: '2024-2025', label: '2024-2025' },
  { value: '2025-2026', label: '2025-2026' },
  { value: '2026-2027', label: '2026-2027' },
  { value: '2027-2028', label: '2027-2028' },
];

// Mevcut akademik yılı hesapla (Eylül-Ağustos dönemi)
const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  
  // Eylül ve sonrası: bu yıl - gelecek yıl
  // Ağustos ve öncesi: geçen yıl - bu yıl
  if (month >= 8) { // Eylül = 8
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// LAZY LOADING
const TodayCollectionWidget = lazy(() => import('@/components/dashboard/TodayCollectionWidget'));
const PendingPaymentsWidget = lazy(() => import('@/components/dashboard/PendingPaymentsWidget'));
const GraphicsTabPanel = lazy(() => import('@/components/dashboard/GraphicsTabPanel'));

// SKELETON LOADER - WhatsApp temalı
const WidgetSkeleton = () => (
  <div className="animate-pulse bg-[#DCF8C6]/50 rounded-2xl p-6 h-48 border border-[#25D366]/20">
    <div className="h-4 bg-[#25D366]/30 rounded w-3/4 mb-4"></div>
    <div className="h-8 bg-[#25D366]/20 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-[#25D366]/10 rounded w-full"></div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Akademik Yıl State
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboardData(selectedYear);
  }, [token, router, selectedYear]);

  const fetchDashboardData = async (academicYear: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/stats?academicYear=${academicYear}`);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setIsYearDropdownOpen(false);
  };

  if (!isClient || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E54] to-[#128C7E] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const kpi = dashboardData?.kpi || {};

  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Hero Banner - Temel İstatistikler */}
        <HeroBanner 
          userName={user.name} 
          onAIReport={() => router.push('/reports')}
          stats={dashboardData?.kpi ? {
            revenue: dashboardData.kpi.totalRevenue,
            activeStudents: dashboardData.kpi.activeStudents,
            paymentRate: dashboardData.kpi.paymentRate,
          } : undefined}
        />

        {/* ========== AKADEMİK YIL SEÇİCİ ========== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border-2 border-[#25D366]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#075E54]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#075E54]">Akademik Yıl</p>
              <p className="text-xs text-gray-500">Görüntülemek istediğiniz dönemi seçin</p>
            </div>
          </div>
          
          {/* Yıl Seçici Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="flex items-center justify-between gap-3 min-w-[180px] px-4 py-2.5 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <span className="font-bold text-lg">{selectedYear}</span>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isYearDropdownOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsYearDropdownOpen(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-[#25D366]/20 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {ACADEMIC_YEARS.map((year) => (
                    <button
                      key={year.value}
                      onClick={() => handleYearChange(year.value)}
                      className={`w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between ${
                        selectedYear === year.value
                          ? 'bg-[#DCF8C6] text-[#075E54] font-semibold'
                          : 'text-gray-700 hover:bg-[#E7FFDB]'
                      }`}
                    >
                      <span>{year.label}</span>
                      {selectedYear === year.value && (
                        <span className="text-[#25D366]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Seçilen Yıl Bilgi Bandı */}
        {selectedYear !== getCurrentAcademicYear() && (
          <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{selectedYear}</strong> akademik yılının verilerini görüntülüyorsunuz. 
              <button 
                onClick={() => handleYearChange(getCurrentAcademicYear())}
                className="ml-2 text-[#075E54] underline hover:text-[#128C7E] font-medium"
              >
                Güncel yıla dön →
              </button>
            </p>
          </div>
        )}

        {/* Hızlı Erişim Butonları */}
        <QuickAccessPanel />

        {/* Özet Kartlar - WhatsApp temalı */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Borçlu Öğrenci Sayısı */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-orange-200 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Borçlu Öğrenci</p>
              <p className="text-3xl font-bold text-gray-900">{kpi.debtorStudents || 0}</p>
            </div>
          </div>

          {/* Toplam Borç */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-red-200 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Toplam Alacak</p>
              <p className="text-3xl font-bold text-gray-900">
                ₺{(kpi.totalDebt || 0).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>

          {/* Bu Ay Tahsilat */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-[#25D366]/30 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-[#DCF8C6] to-[#25D366]/30 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-[#075E54]" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Bu Ay Tahsilat</p>
              <p className="text-3xl font-bold text-[#075E54]">
                ₺{(kpi.monthlyCollection || 0).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        {/* Bugünkü Tahsilat & Bekleyen Ödemeler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<WidgetSkeleton />}>
            <TodayCollectionWidget onRefresh={() => fetchDashboardData(selectedYear)} academicYear={selectedYear} />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <PendingPaymentsWidget onRefresh={() => fetchDashboardData(selectedYear)} academicYear={selectedYear} />
          </Suspense>
        </div>

        {/* Grafikler */}
        <Suspense fallback={<WidgetSkeleton />}>
          <GraphicsTabPanel academicYear={selectedYear} />
        </Suspense>

        {/* Yenile Butonu - WhatsApp temalı */}
        {!isLoading && (
          <div className="flex justify-center">
            <button
              onClick={() => fetchDashboardData(selectedYear)}
              className="flex items-center gap-2 px-6 py-3 text-[#075E54] hover:text-white hover:bg-[#25D366] bg-[#DCF8C6] rounded-2xl transition-all font-medium border-2 border-[#25D366]/30 hover:border-[#25D366]"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Verileri Yenile</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
