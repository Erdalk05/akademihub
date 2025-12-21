'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, lazy, Suspense, useCallback, useRef, memo } from 'react';
import { useAuthStore } from '@/lib/store';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore, getCurrentAcademicYear } from '@/lib/store/academicYearStore';
import HeroBanner from '@/components/dashboard/HeroBanner';
import QuickAccessPanel from '@/components/layout/QuickAccessPanel';
import { LazyDashboardSection } from '@/components/dashboard/LazyDashboardSection';
import { useMobileOptimization } from '@/lib/hooks/useMobileOptimization';
import { 
  Loader2, 
  AlertTriangle, 
  Users, 
  TrendingDown, 
  RefreshCw, 
  TrendingUp
} from 'lucide-react';

// ✅ LAZY LOADING - Componentler sadece viewport'a girince yüklenir
const TodayCollectionWidget = lazy(() => import('@/components/dashboard/TodayCollectionWidget'));
const PendingPaymentsWidget = lazy(() => import('@/components/dashboard/PendingPaymentsWidget'));
const GraphicsTabPanel = lazy(() => import('@/components/dashboard/GraphicsTabPanel'));

// ✅ SKELETON LOADER - Mobil uyumlu
const WidgetSkeleton = memo(() => (
  <div className="animate-pulse bg-emerald-50 rounded-2xl p-4 md:p-6 h-40 md:h-48 border border-emerald-100">
    <div className="h-3 md:h-4 bg-emerald-200/50 rounded w-3/4 mb-3 md:mb-4"></div>
    <div className="h-6 md:h-8 bg-emerald-100 rounded w-1/2 mb-2"></div>
    <div className="h-3 md:h-4 bg-emerald-50 rounded w-full"></div>
  </div>
));
WidgetSkeleton.displayName = 'WidgetSkeleton';

// ✅ KPI Card Skeleton - Mobil uyumlu  
const KPICardSkeleton = memo(() => (
  <div className="animate-pulse bg-white rounded-xl md:rounded-2xl p-3 md:p-5 border border-slate-100">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="h-2 md:h-3 bg-gray-200 rounded w-16 md:w-20 mb-2"></div>
        <div className="h-5 md:h-8 bg-gray-100 rounded w-12 md:w-16"></div>
      </div>
      <div className="w-9 h-9 md:w-12 md:h-12 bg-gray-100 rounded-lg md:rounded-xl"></div>
    </div>
  </div>
));
KPICardSkeleton.displayName = 'KPICardSkeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, _hasHydrated } = useAuthStore();
  const { currentOrganization, isAllOrganizations = false } = useOrganizationStore();
  const { selectedYear } = useAcademicYearStore();
  const [isClient, setIsClient] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Mobile optimization
  const { isMobile, shouldDeferHeavyCalc } = useMobileOptimization();
  
  // ✅ AbortController for API calls
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setIsClient(true);
    console.debug('[DASHBOARD] 📱 Mobile:', isMobile, 'DeferHeavy:', shouldDeferHeavyCalc);
  }, [isMobile, shouldDeferHeavyCalc]);

  // ✅ Memoized fetch function
  const fetchDashboardData = useCallback(async (academicYear: string) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsLoading(true);
    console.debug('[DASHBOARD] 🔄 Fetching data...');
    
    try {
      const orgParam = !isAllOrganizations && currentOrganization?.id ? `&organization_id=${currentOrganization.id}` : '';
      
      const response = await fetch(
        `/api/dashboard/stats?academicYear=${academicYear}${orgParam}`,
        { signal: controller.signal }
      );
      
      if (controller.signal.aborted) return;
      
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
        console.debug('[DASHBOARD] ✅ Data loaded');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('[DASHBOARD] ❌ Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAllOrganizations, currentOrganization?.id]);

  // ✅ Fetch on mount and dependency change
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboardData(selectedYear);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [_hasHydrated, token, router, selectedYear, fetchDashboardData]);


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
          isAllOrganizations={isAllOrganizations}
          stats={dashboardData?.kpi ? {
            revenue: dashboardData.kpi.totalRevenue || 0,
            totalContract: dashboardData.kpi.totalContract || 0,
            totalSales: dashboardData.kpi.otherIncomeContract || 0,
            activeStudents: dashboardData.kpi.activeStudents || 0,
            paymentRate: dashboardData.kpi.paymentRate || 0,
            cashBalance: dashboardData.kpi.cashBalance || 0,
            dailyIncome: dashboardData.kpi.dailyIncome || 0,
          } : undefined}
        />

        {/* Hızlı Erişim */}
        <QuickAccessPanel />

        {/* Özet Kartlar - Mobil uyumlu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {/* Toplam Öğrenci */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide">Aktif Öğrenci</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1">{kpi.activeStudents || 0}</p>
              </div>
              <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Borçlu Öğrenci */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-amber-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide">Borçlu Öğrenci</p>
                <p className="text-xl md:text-3xl font-bold text-amber-600 mt-1">{kpi.debtorStudents || 0}</p>
              </div>
              <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Toplam Alacak */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-red-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide">Toplam Alacak</p>
                <p className="text-lg md:text-3xl font-bold text-red-600 mt-1 truncate">
                  ₺{(kpi.totalDebt || 0).toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <TrendingDown className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Bu Ay Tahsilat */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-emerald-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide">Bu Ay Tahsilat</p>
                <p className="text-lg md:text-3xl font-bold text-emerald-600 mt-1 truncate">
                  ₺{(kpi.monthlyCollection || 0).toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Widget'lar - Lazy loaded, mobilde scroll'da yüklenir */}
        <LazyDashboardSection 
          id="widgets-section" 
          minHeight={isMobile ? 160 : 200}
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <WidgetSkeleton />
              <WidgetSkeleton />
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Suspense fallback={<WidgetSkeleton />}>
              <TodayCollectionWidget onRefresh={() => fetchDashboardData(selectedYear)} academicYear={selectedYear} />
            </Suspense>
            <Suspense fallback={<WidgetSkeleton />}>
              <PendingPaymentsWidget onRefresh={() => fetchDashboardData(selectedYear)} academicYear={selectedYear} />
            </Suspense>
          </div>
        </LazyDashboardSection>

        {/* ✅ Grafikler - Ağır component, lazy load ile yüklenir */}
        <LazyDashboardSection 
          id="charts-section" 
          minHeight={isMobile ? 300 : 400}
          rootMargin={isMobile ? '100px' : '300px'} // Mobilde daha yakın, masaüstünde daha erken
          fallback={
            <div className="animate-pulse bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4 md:p-6" style={{ minHeight: isMobile ? 300 : 400 }}>
              <div className="h-4 bg-emerald-200/50 rounded w-1/4 mb-6"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-8 bg-emerald-100 rounded-lg w-24"></div>
                <div className="h-8 bg-emerald-50 rounded-lg w-24"></div>
              </div>
              <div className="h-48 md:h-64 bg-emerald-100/30 rounded-xl"></div>
            </div>
          }
        >
          <GraphicsTabPanel academicYear={selectedYear} />
        </LazyDashboardSection>

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
