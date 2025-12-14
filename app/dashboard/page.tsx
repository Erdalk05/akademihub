'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore } from '@/lib/store';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import HeroBanner from '@/components/dashboard/HeroBanner';
import QuickAccessPanel from '@/components/layout/QuickAccessPanel';
import { 
  Loader2, 
  AlertTriangle, 
  Users, 
  TrendingDown, 
  RefreshCw, 
  Calendar, 
  ChevronDown,
  TrendingUp
} from 'lucide-react';

// Akademik Yıllar
const ACADEMIC_YEARS = [
  { value: '2023-2024', label: '2023-2024' },
  { value: '2024-2025', label: '2024-2025' },
  { value: '2025-2026', label: '2025-2026' },
  { value: '2026-2027', label: '2026-2027' },
  { value: '2027-2028', label: '2027-2028' },
];

const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// LAZY LOADING
const TodayCollectionWidget = lazy(() => import('@/components/dashboard/TodayCollectionWidget'));
const PendingPaymentsWidget = lazy(() => import('@/components/dashboard/PendingPaymentsWidget'));
const GraphicsTabPanel = lazy(() => import('@/components/dashboard/GraphicsTabPanel'));

// SKELETON LOADER
const WidgetSkeleton = () => (
  <div className="animate-pulse bg-emerald-50 rounded-2xl p-6 h-48 border border-emerald-100">
    <div className="h-4 bg-emerald-200/50 rounded w-3/4 mb-4"></div>
    <div className="h-8 bg-emerald-100 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-emerald-50 rounded w-full"></div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, _hasHydrated } = useAuthStore();
  const { currentOrganization } = useOrganizationStore();
  const [isClient, setIsClient] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboardData(selectedYear);
  }, [_hasHydrated, token, router, selectedYear, currentOrganization]);

  const fetchDashboardData = async (academicYear: string) => {
    setIsLoading(true);
    try {
      // Çoklu kurum desteği: organization_id filtresi
      const orgParam = currentOrganization?.id ? `&organization_id=${currentOrganization.id}` : '';
      const response = await fetch(`/api/dashboard/stats?academicYear=${academicYear}${orgParam}`);
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setIsYearDropdownOpen(false);
  };

  if (!isClient || !_hasHydrated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const kpi = dashboardData?.kpi || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Hero Banner */}
        <HeroBanner 
          userName={user.name} 
          onAIReport={() => router.push('/reports')}
          stats={dashboardData?.kpi ? {
            revenue: dashboardData.kpi.totalRevenue || 0,
            totalContract: dashboardData.kpi.totalContract || 0,
            activeStudents: dashboardData.kpi.activeStudents || 0,
            paymentRate: dashboardData.kpi.paymentRate || 0,
          } : undefined}
        />

        {/* Akademik Yıl Seçici */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Akademik Yıl</p>
                <p className="text-xs text-gray-500">Görüntülemek istediğiniz dönemi seçin</p>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center justify-between gap-3 min-w-[180px] px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition-all font-medium"
              >
                <span className="font-bold">{selectedYear}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isYearDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsYearDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-emerald-100 py-2 z-50">
                    {ACADEMIC_YEARS.map((year) => (
                      <button
                        key={year.value}
                        onClick={() => handleYearChange(year.value)}
                        className={`w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between ${
                          selectedYear === year.value
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{year.label}</span>
                        {selectedYear === year.value && <span className="text-emerald-500">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Farklı Yıl Uyarısı */}
        {selectedYear !== getCurrentAcademicYear() && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{selectedYear}</strong> akademik yılının verilerini görüntülüyorsunuz.
              <button 
                onClick={() => handleYearChange(getCurrentAcademicYear())}
                className="ml-2 text-emerald-600 underline hover:text-emerald-700 font-medium"
              >
                Güncel yıla dön →
              </button>
            </p>
          </div>
        )}

        {/* Hızlı Erişim */}
        <QuickAccessPanel />

        {/* Özet Kartlar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Toplam Öğrenci */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aktif Öğrenci</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.activeStudents || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Borçlu Öğrenci */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Borçlu Öğrenci</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{kpi.debtorStudents || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Toplam Alacak */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Toplam Alacak</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  ₺{((kpi.totalDebt || 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Bu Ay Tahsilat */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bu Ay Tahsilat</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  ₺{((kpi.monthlyCollection || 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Widget'lar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Yenile Butonu */}
        {!isLoading && (
          <div className="flex justify-center pb-4">
            <button
              onClick={() => fetchDashboardData(selectedYear)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all font-medium border border-emerald-200 shadow-sm hover:shadow-md"
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
