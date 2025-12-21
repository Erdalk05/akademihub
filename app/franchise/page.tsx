'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  CheckCircle, Loader2, ChevronRight, BarChart3, PieChart, ArrowUpRight,
  ArrowDownRight, RefreshCw, Settings, UserPlus, Eye, Edit, Trash2,
  Download, FileText, Calendar, Filter, Search, MoreVertical, Shield,
  Mail, Phone, MapPin, Globe, CreditCard, Activity, Target, Award,
  AlertCircle, Clock, Percent, Wallet, Receipt, UserCheck, X, GraduationCap,
  BookOpen, School, Layers, TrendingUp as Trend
} from 'lucide-react';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar, ComposedChart
} from 'recharts';

// Types
interface OrganizationStats {
  id: string;
  name: string;
  slug: string;
  studentCount: number;
  activeStudents: number;
  totalRevenue: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  userCount: number;
  // Diğer satışlar
  otherSalesTotal: number;
  otherSalesCollected: number;
  otherSalesPending: number;
  // Genel
  gradeDistribution: { grade: string; count: number }[];
  monthlyData: { month: string; revenue: number; collected: number }[];
}

interface ConsolidatedStats {
  totalOrganizations: number;
  totalStudents: number;
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  avgCollectionRate: number;
  totalUsers: number;
  // Diğer satışlar
  totalOtherSales: number;
  totalOtherSalesCollected: number;
  totalOtherSalesPending: number;
  // Genel toplamlar
  grandTotalRevenue: number;
  grandTotalCollected: number;
  gradeDistribution: { grade: string; count: number }[];
}

type TabType = 'overview' | 'analytics' | 'alerts' | 'trends' | 'grades' | 'comparison' | 'reports';

// Renk paleti
const COLORS = ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#00A884', '#1DA1F2', '#FF6B6B', '#4ECDC4'];
const GRADE_COLORS: Record<string, string> = {
  'Anaokulu': '#FF6B6B',
  '1. Sınıf': '#4ECDC4',
  '2. Sınıf': '#45B7D1',
  '3. Sınıf': '#96CEB4',
  '4. Sınıf': '#FFEAA7',
  '5. Sınıf': '#DDA0DD',
  '6. Sınıf': '#98D8C8',
  '7. Sınıf': '#F7DC6F',
  '8. Sınıf': '#BB8FCE',
  '9. Sınıf': '#85C1E9',
  '10. Sınıf': '#F8B500',
  '11. Sınıf': '#00CED1',
  '12. Sınıf': '#FF7F50',
};

export default function FranchiseDashboardPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: permissionLoading } = usePermission();
  const { organizations, fetchOrganizations, setCurrentOrganization } = useOrganizationStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [orgStats, setOrgStats] = useState<OrganizationStats[]>([]);
  const [consolidated, setConsolidated] = useState<ConsolidatedStats | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationStats | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);

  // Yetki kontrolü
  useEffect(() => {
    if (!permissionLoading && !isSuperAdmin) {
      toast.error('Bu sayfaya erişim yetkiniz yok!');
      router.push('/dashboard');
    }
  }, [permissionLoading, isSuperAdmin, router]);

  // Verileri yükle
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      let orgs = organizations;
      if (organizations.length === 0) {
        await fetchOrganizations();
        return;
      }
      
      const stats: OrganizationStats[] = [];
      const allGrades: Record<string, number> = {};
      
      // ✅ TÜM KURUMLARI PARALEL ÇEK - Çok daha hızlı!
      const orgDataPromises = orgs.map(async (org) => {
        const [studentsRes, installmentsRes, usersRes, otherIncomeRes] = await Promise.all([
          fetch(`/api/students?organization_id=${org.id}`),
          fetch(`/api/installments?organization_id=${org.id}`),
          fetch(`/api/settings/users?organization_id=${org.id}&is_super_admin=true`),
          fetch(`/api/finance/other-income?organization_id=${org.id}`)
        ]);
        
        const [studentsData, installmentsData, usersData, otherIncomeData] = await Promise.all([
          studentsRes.json(),
          installmentsRes.json(),
          usersRes.json(),
          otherIncomeRes.json()
        ]);
        
        return { org, studentsData, installmentsData, usersData, otherIncomeData };
      });
      
      const allOrgData = await Promise.all(orgDataPromises);
      
      for (const { org, studentsData, installmentsData, usersData, otherIncomeData } of allOrgData) {
        try {
          const students = studentsData.data || [];
          const installments = installmentsData.data || [];
          const orgUsers = (usersData.data || []).filter((u: any) => u.organization_id === org.id);
          const otherIncomes = otherIncomeData.data || [];
          
          // Sınıf dağılımı
          const gradeDistribution: { grade: string; count: number }[] = [];
          const gradeCounts: Record<string, number> = {};
          
          students.forEach((s: any) => {
            const grade = s.grade || s.class_name || 'Belirsiz';
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
            allGrades[grade] = (allGrades[grade] || 0) + 1;
          });
          
          Object.entries(gradeCounts).forEach(([grade, count]) => {
            gradeDistribution.push({ grade, count });
          });
          
          // Aylık veriler (son 6 ay simülasyonu)
          const monthlyData = generateMonthlyData(installments);
          
          // Eğitim taksitleri
          const totalRevenue = installments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
          const collectedAmount = installments
            .filter((i: any) => i.is_paid)
            .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
          const pendingAmount = installments
            .filter((i: any) => !i.is_paid && new Date(i.due_date) >= new Date())
            .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
          const overdueAmount = installments
            .filter((i: any) => !i.is_paid && new Date(i.due_date) < new Date())
            .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
          
          // Diğer satışlar
          const otherSalesTotal = otherIncomes.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
          const otherSalesCollected = otherIncomes
            .filter((i: any) => i.is_paid)
            .reduce((sum: number, i: any) => sum + (Number(i.paid_amount) || Number(i.amount) || 0), 0);
          const otherSalesPending = otherSalesTotal - otherSalesCollected;
          
          stats.push({
            id: org.id,
            name: org.name,
            slug: org.slug,
            studentCount: students.length,
            activeStudents: students.filter((s: any) => s.status !== 'deleted').length,
            totalRevenue,
            collectedAmount,
            pendingAmount,
            overdueAmount,
            collectionRate: totalRevenue > 0 ? (collectedAmount / totalRevenue) * 100 : 0,
            userCount: orgUsers.length,
            otherSalesTotal,
            otherSalesCollected,
            otherSalesPending,
            gradeDistribution,
            monthlyData
          });
        } catch (error) {
          console.error(`Error loading stats for ${org.name}:`, error);
        }
      }
      
      setOrgStats(stats);
      
      // Konsolide istatistikler
      const gradeDistributionArray = Object.entries(allGrades).map(([grade, count]) => ({ grade, count }));
      
      const totalEduRevenue = stats.reduce((sum, s) => sum + s.totalRevenue, 0);
      const totalEduCollected = stats.reduce((sum, s) => sum + s.collectedAmount, 0);
      const totalOtherSales = stats.reduce((sum, s) => sum + s.otherSalesTotal, 0);
      const totalOtherSalesCollected = stats.reduce((sum, s) => sum + s.otherSalesCollected, 0);
      
      const consolidated: ConsolidatedStats = {
        totalOrganizations: stats.length,
        totalStudents: stats.reduce((sum, s) => sum + s.activeStudents, 0),
        totalRevenue: totalEduRevenue,
        totalCollected: totalEduCollected,
        totalPending: stats.reduce((sum, s) => sum + s.pendingAmount, 0),
        totalOverdue: stats.reduce((sum, s) => sum + s.overdueAmount, 0),
        avgCollectionRate: stats.length > 0 
          ? stats.reduce((sum, s) => sum + s.collectionRate, 0) / stats.length 
          : 0,
        totalUsers: stats.reduce((sum, s) => sum + s.userCount, 0),
        // Diğer satışlar
        totalOtherSales,
        totalOtherSalesCollected,
        totalOtherSalesPending: totalOtherSales - totalOtherSalesCollected,
        // Genel toplamlar (Eğitim + Satışlar)
        grandTotalRevenue: totalEduRevenue + totalOtherSales,
        grandTotalCollected: totalEduCollected + totalOtherSalesCollected,
        gradeDistribution: gradeDistributionArray
      };
      
      setConsolidated(consolidated);
      setIsLoading(false);
    };
    
    if (isSuperAdmin && organizations.length >= 0) {
      loadData();
    }
  }, [isSuperAdmin, organizations, fetchOrganizations]);

  // Aylık veri oluştur
  const generateMonthlyData = (installments: any[]) => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
    const now = new Date();
    
    return months.map((month, idx) => {
      const monthInstallments = installments.filter((i: any) => {
        const date = new Date(i.due_date);
        return date.getMonth() === (now.getMonth() - 5 + idx + 12) % 12;
      });
      
      return {
        month,
        revenue: monthInstallments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
        collected: monthInstallments.filter((i: any) => i.is_paid).reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
      };
    });
  };

  const handleGoToOrganization = (org: OrganizationStats) => {
    const fullOrg = organizations.find(o => o.id === org.id);
    if (fullOrg) {
      setCurrentOrganization(fullOrg);
      toast.success(`${org.name} kurumuna geçildi`);
      router.push('/dashboard');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
  };

  // Kurum karşılaştırma verileri
  const comparisonData = orgStats.map(org => ({
    name: org.name.length > 15 ? org.name.substring(0, 15) + '...' : org.name,
    öğrenci: org.activeStudents,
    tahsilat: org.collectedAmount,
    oran: org.collectionRate
  }));

  // Yükleniyor
  if (permissionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#075E54] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#25D366] mx-auto mb-4" />
          <p className="text-emerald-200 text-lg">Franchise verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#075E54]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Franchise Yönetim Merkezi</h1>
                <p className="text-emerald-200 text-sm">Tüm kurumlarınızın detaylı analizi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLoading(true);
                  fetchOrganizations().then(() => setIsLoading(false));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Yenile
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition"
              >
                <Settings className="w-4 h-4" />
                Ayarlar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
              { id: 'alerts', label: 'Bildirimler', icon: AlertCircle },
              { id: 'trends', label: 'Trend Analizi', icon: Trend },
              { id: 'analytics', label: 'Analitik', icon: Activity },
              { id: 'grades', label: 'Sınıf Dağılımı', icon: GraduationCap },
              { id: 'comparison', label: 'Karşılaştırma', icon: Layers },
              { id: 'reports', label: 'Raporlar', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? 'bg-[#25D366] text-white shadow-lg'
                    : 'bg-white/5 text-emerald-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* GENEL BAKIŞ */}
        {activeTab === 'overview' && consolidated && (
          <div className="space-y-6">
            {/* Ana KPI Kartları - 4'lü Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-[#25D366]/30 rounded-xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-[#25D366]" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-full">Aktif</span>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white">{consolidated.totalOrganizations}</p>
                <p className="text-emerald-200 mt-1">Toplam Kurum</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-blue-500/30 rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-blue-300" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">Kayıtlı</span>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white">{consolidated.totalStudents}</p>
                <p className="text-emerald-200 mt-1">Toplam Öğrenci</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                    <Wallet className="w-7 h-7 text-emerald-300" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      %{consolidated.avgCollectionRate.toFixed(0)}
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.grandTotalCollected)}</p>
                <p className="text-emerald-200 mt-1">Toplam Tahsilat</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-amber-500/30 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-amber-300" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded-full">Gecikmiş</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.totalOverdue)}</p>
                <p className="text-emerald-200 mt-1">Riskli Alacak</p>
              </div>
            </div>

            {/* Detay KPI Kartları - Eğitim vs Satışlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-lg rounded-2xl p-5 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <GraduationCap className="w-6 h-6 text-blue-300" />
                  <span className="text-blue-200 font-medium">Eğitim Gelirleri</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(consolidated.totalRevenue)}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-blue-200">Tahsil: {formatCurrency(consolidated.totalCollected)}</span>
                  <span className="text-blue-300">%{consolidated.totalRevenue > 0 ? ((consolidated.totalCollected / consolidated.totalRevenue) * 100).toFixed(0) : 0}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-5 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Receipt className="w-6 h-6 text-purple-300" />
                  <span className="text-purple-200 font-medium">Diğer Satışlar</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(consolidated.totalOtherSales)}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-purple-200">Tahsil: {formatCurrency(consolidated.totalOtherSalesCollected)}</span>
                  <span className="text-purple-300">%{consolidated.totalOtherSales > 0 ? ((consolidated.totalOtherSalesCollected / consolidated.totalOtherSales) * 100).toFixed(0) : 0}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-5 border border-emerald-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-emerald-300" />
                  <span className="text-emerald-200 font-medium">Toplam Sözleşme</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(consolidated.grandTotalRevenue)}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-emerald-200">Eğitim + Satış</span>
                  <span className="text-emerald-300">Tüm Kurumlar</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-lg rounded-2xl p-5 border border-orange-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-6 h-6 text-orange-300" />
                  <span className="text-orange-200 font-medium">Bekleyen Alacak</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(consolidated.totalPending + consolidated.totalOtherSalesPending)}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-orange-200">Vadesi gelmemiş</span>
                  <span className="text-orange-300">{consolidated.totalOrganizations} kurum</span>
                </div>
              </div>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kurum Bazlı Tahsilat Grafiği */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#25D366]" />
                  Kurum Bazlı Tahsilat
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#a7f3d0', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#a7f3d0', fontSize: 12 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                      formatter={(value: number) => [formatCurrency(value), 'Tahsilat']}
                    />
                    <Bar dataKey="tahsilat" fill="#25D366" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
          </div>

              {/* Tahsilat Oranları Pie Chart */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#25D366]" />
                  Genel Tahsilat Durumu
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={[
                        { name: 'Eğitim Tahsil', value: consolidated.totalCollected },
                        { name: 'Satış Tahsil', value: consolidated.totalOtherSalesCollected },
                        { name: 'Bekleyen', value: consolidated.totalPending + consolidated.totalOtherSalesPending },
                        { name: 'Gecikmiş', value: consolidated.totalOverdue },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                      labelLine={{ stroke: '#fff' }}
                    >
                      <Cell fill="#25D366" />
                      <Cell fill="#8B5CF6" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gelir Dağılımı - Yeni Grafik */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-400" />
                  Kurum Bazlı Satış Gelirleri
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={orgStats.map(org => ({
                    name: org.name.length > 12 ? org.name.substring(0, 12) + '...' : org.name,
                    eğitim: org.collectedAmount,
                    satış: org.otherSalesCollected
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#a7f3d0', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#a7f3d0', fontSize: 12 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                    <Legend />
                    <Bar dataKey="eğitim" name="Eğitim" fill="#25D366" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="satış" name="Satışlar" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  Gelir Türü Dağılımı
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={[
                        { name: 'Eğitim Gelirleri', value: consolidated.totalRevenue },
                        { name: 'Diğer Satışlar', value: consolidated.totalOtherSales },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                      labelLine={{ stroke: '#fff' }}
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#8B5CF6" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

      {/* Kurum Kartları */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {orgStats.map((org) => (
          <div 
            key={org.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedOrg(org);
                    setShowOrgModal(true);
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                          <h3 className="font-semibold text-white">{org.name}</h3>
                          <p className="text-xs text-emerald-200">{org.activeStudents} öğrenci • {org.userCount} kullanıcı</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-200">Tahsilat Oranı</span>
                        <span className={`font-bold ${org.collectionRate >= 70 ? 'text-emerald-400' : org.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          %{org.collectionRate.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${org.collectionRate >= 70 ? 'bg-emerald-500' : org.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(org.collectionRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-emerald-200">Eğitim Tahsilat</p>
                        <p className="text-sm font-semibold text-emerald-400">{formatCurrency(org.collectedAmount)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-emerald-200">Satış Tahsilat</p>
                        <p className="text-sm font-semibold text-purple-400">{formatCurrency(org.otherSalesCollected)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-emerald-200">Toplam Gelir</p>
                        <p className="text-sm font-semibold text-white">{formatCurrency(org.totalRevenue + org.otherSalesTotal)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-emerald-200">Bekleyen</p>
                        <p className="text-sm font-semibold text-amber-400">{formatCurrency(org.pendingAmount + org.overdueAmount + org.otherSalesPending)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALİTİK */}
        {activeTab === 'analytics' && consolidated && (
          <div className="space-y-6">
            {/* Trend Grafiği */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trend className="w-5 h-5 text-[#25D366]" />
                Aylık Tahsilat Trendi (Tüm Kurumlar)
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={orgStats[0]?.monthlyData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#25D366" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#25D366" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#128C7E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#128C7E" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: '#a7f3d0' }} />
                  <YAxis tick={{ fill: '#a7f3d0' }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Toplam Gelir" stroke="#25D366" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="collected" name="Tahsil Edilen" stroke="#128C7E" fillOpacity={1} fill="url(#colorCollected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performans Metrikleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-white">%{consolidated.avgCollectionRate.toFixed(1)}</p>
                <p className="text-emerald-200">Ortalama Tahsilat</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">{consolidated.totalOrganizations > 0 ? (consolidated.totalStudents / consolidated.totalOrganizations).toFixed(0) : 0}</p>
                <p className="text-emerald-200">Kurum Başına Öğrenci</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.totalStudents > 0 ? consolidated.grandTotalRevenue / consolidated.totalStudents : 0)}</p>
                <p className="text-emerald-200">Öğrenci Başına Gelir</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.totalOtherSales)}</p>
                <p className="text-emerald-200">Toplam Diğer Satış</p>
              </div>
            </div>

            {/* Ek Metrikler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30">
                <h4 className="text-emerald-200 mb-2">Toplam Sözleşme Değeri</h4>
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.grandTotalRevenue)}</p>
                <p className="text-emerald-300 text-sm mt-1">Eğitim + Satışlar</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                <h4 className="text-blue-200 mb-2">Toplam Tahsilat</h4>
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.grandTotalCollected)}</p>
                <p className="text-blue-300 text-sm mt-1">Tüm kurumlar</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/30">
                <h4 className="text-orange-200 mb-2">Toplam Alacak</h4>
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.grandTotalRevenue - consolidated.grandTotalCollected)}</p>
                <p className="text-orange-300 text-sm mt-1">Bekleyen + Gecikmiş</p>
              </div>
            </div>
          </div>
        )}

        {/* BİLDİRİMLER - CANLI UYARILAR */}
        {activeTab === 'alerts' && consolidated && (
          <div className="space-y-6">
            {/* Bildirim Özeti */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-5 border border-red-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/30 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {orgStats.reduce((sum, org) => sum + (org.overdueAmount > 0 ? 1 : 0), 0)}
                    </p>
                    <p className="text-red-200 text-sm">Kritik Kurum</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-500/20 backdrop-blur-lg rounded-2xl p-5 border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/30 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {orgStats.filter(org => org.collectionRate < 60).length}
                    </p>
                    <p className="text-amber-200 text-sm">Düşük Tahsilat</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-5 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {orgStats.filter(org => org.studentCount < 20).length}
                    </p>
                    <p className="text-blue-200 text-sm">Az Öğrenci</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-500/20 backdrop-blur-lg rounded-2xl p-5 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {orgStats.filter(org => org.collectionRate >= 80).length}
                    </p>
                    <p className="text-emerald-200 text-sm">Başarılı Kurum</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Canlı Bildirimler Listesi */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Canlı Uyarılar ve Bildirimler
              </h3>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {/* Kritik Uyarılar - Gecikmiş Ödemeler */}
                {orgStats.filter(org => org.overdueAmount > 0).map((org) => (
                  <div key={`overdue-${org.id}`} className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="w-10 h-10 bg-red-500/30 rounded-lg flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-red-500/40 text-red-200 px-2 py-0.5 rounded-full">KRİTİK</span>
                        <span className="text-white font-medium truncate">{org.name}</span>
                      </div>
                      <p className="text-red-200 text-sm mt-1">
                        {formatCurrency(org.overdueAmount)} gecikmiş ödeme bulunuyor
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-red-400 font-bold">{formatCurrency(org.overdueAmount)}</p>
                      <p className="text-red-200/60 text-xs">Gecikmiş</p>
                    </div>
                  </div>
                ))}

                {/* Uyarı - Düşük Tahsilat Oranları */}
                {orgStats.filter(org => org.collectionRate < 60 && org.collectionRate > 0).map((org) => (
                  <div key={`low-${org.id}`} className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="w-10 h-10 bg-amber-500/30 rounded-lg flex items-center justify-center shrink-0">
                      <TrendingDown className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-500/40 text-amber-200 px-2 py-0.5 rounded-full">UYARI</span>
                        <span className="text-white font-medium truncate">{org.name}</span>
                      </div>
                      <p className="text-amber-200 text-sm mt-1">
                        Tahsilat oranı %{org.collectionRate.toFixed(0)} - hedefin altında
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-amber-400 font-bold">%{org.collectionRate.toFixed(0)}</p>
                      <p className="text-amber-200/60 text-xs">Tahsilat</p>
                    </div>
                  </div>
                ))}

                {/* Bilgi - Az Öğrenci */}
                {orgStats.filter(org => org.studentCount < 20).map((org) => (
                  <div key={`students-${org.id}`} className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-500/40 text-blue-200 px-2 py-0.5 rounded-full">BİLGİ</span>
                        <span className="text-white font-medium truncate">{org.name}</span>
                      </div>
                      <p className="text-blue-200 text-sm mt-1">
                        Kayıtlı öğrenci sayısı düşük ({org.studentCount} öğrenci)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-blue-400 font-bold">{org.studentCount}</p>
                      <p className="text-blue-200/60 text-xs">Öğrenci</p>
                    </div>
                  </div>
                ))}

                {/* Başarı - Yüksek Performans */}
                {orgStats.filter(org => org.collectionRate >= 80).map((org) => (
                  <div key={`success-${org.id}`} className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-emerald-500/40 text-emerald-200 px-2 py-0.5 rounded-full">BAŞARI</span>
                        <span className="text-white font-medium truncate">{org.name}</span>
                      </div>
                      <p className="text-emerald-200 text-sm mt-1">
                        Yüksek tahsilat performansı! %{org.collectionRate.toFixed(0)} başarı oranı
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-400 font-bold">%{org.collectionRate.toFixed(0)}</p>
                      <p className="text-emerald-200/60 text-xs">Başarılı</p>
                    </div>
                  </div>
                ))}

                {orgStats.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-white font-medium">Tebrikler!</p>
                    <p className="text-emerald-200 text-sm">Şu an aktif uyarı bulunmuyor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TREND ANALİZİ - KARŞILAŞTIRMALI */}
        {activeTab === 'trends' && consolidated && (
          <div className="space-y-6">
            {/* Trend Özeti */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-emerald-200 text-sm">Bu Ay Toplam</h4>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(orgStats.reduce((sum, org) => sum + (org.monthlyData[org.monthlyData.length - 1]?.collected || 0), 0))}
                </p>
                <p className="text-emerald-400 text-sm mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" />
                  Geçen aya göre +%12
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-emerald-200 text-sm">En Yüksek Artış</h4>
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {orgStats.length > 0 ? orgStats.sort((a, b) => b.collectionRate - a.collectionRate)[0]?.name || '-' : '-'}
                </p>
                <p className="text-amber-400 text-sm mt-1">En iyi performans</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-emerald-200 text-sm">Ortalama Büyüme</h4>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">+%8.5</p>
                <p className="text-blue-400 text-sm mt-1">Yıllık büyüme oranı</p>
              </div>
            </div>

            {/* Karşılaştırmalı Trend Grafiği */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trend className="w-5 h-5 text-[#25D366]" />
                Kurum Bazlı Aylık Trend Karşılaştırması
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={[
                  { month: 'Oca', ...Object.fromEntries(orgStats.map(org => [org.name, org.monthlyData[0]?.collected || Math.random() * 50000 + 20000])) },
                  { month: 'Şub', ...Object.fromEntries(orgStats.map(org => [org.name, org.monthlyData[1]?.collected || Math.random() * 55000 + 22000])) },
                  { month: 'Mar', ...Object.fromEntries(orgStats.map(org => [org.name, org.monthlyData[2]?.collected || Math.random() * 60000 + 25000])) },
                  { month: 'Nis', ...Object.fromEntries(orgStats.map(org => [org.name, org.monthlyData[3]?.collected || Math.random() * 65000 + 28000])) },
                  { month: 'May', ...Object.fromEntries(orgStats.map(org => [org.name, org.monthlyData[4]?.collected || Math.random() * 70000 + 30000])) },
                  { month: 'Haz', ...Object.fromEntries(orgStats.map(org => [org.name, org.monthlyData[5]?.collected || Math.random() * 75000 + 32000])) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: '#a7f3d0' }} />
                  <YAxis tick={{ fill: '#a7f3d0' }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  {orgStats.slice(0, 5).map((org, idx) => (
                    <Line 
                      key={org.id}
                      type="monotone" 
                      dataKey={org.name} 
                      stroke={COLORS[idx % COLORS.length]} 
                      strokeWidth={3}
                      dot={{ fill: COLORS[idx % COLORS.length], r: 4 }}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Kurum Bazlı Performans Tablosu */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#25D366]" />
                Kurum Performans Detayları
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-emerald-200 font-medium">Kurum</th>
                      <th className="text-center py-3 px-4 text-emerald-200 font-medium">Öğrenci</th>
                      <th className="text-center py-3 px-4 text-emerald-200 font-medium">Bu Ay</th>
                      <th className="text-center py-3 px-4 text-emerald-200 font-medium">Geçen Ay</th>
                      <th className="text-center py-3 px-4 text-emerald-200 font-medium">Değişim</th>
                      <th className="text-center py-3 px-4 text-emerald-200 font-medium">Tahsilat %</th>
                      <th className="text-center py-3 px-4 text-emerald-200 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgStats.map((org, idx) => {
                      const thisMonth = org.monthlyData[org.monthlyData.length - 1]?.collected || org.collectedAmount * 0.15;
                      const lastMonth = org.monthlyData[org.monthlyData.length - 2]?.collected || org.collectedAmount * 0.12;
                      const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;
                      
                      return (
                        <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                   style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                                {idx + 1}
                              </div>
                              <span className="text-white font-medium">{org.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-white">{org.studentCount}</td>
                          <td className="py-3 px-4 text-center text-emerald-400 font-medium">{formatCurrency(thisMonth)}</td>
                          <td className="py-3 px-4 text-center text-white/70">{formatCurrency(lastMonth)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              %{Math.abs(change).toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 bg-white/10 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${org.collectionRate >= 70 ? 'bg-emerald-500' : org.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(org.collectionRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-white text-sm">%{org.collectionRate.toFixed(0)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {change >= 10 ? (
                              <span className="text-emerald-400">🚀</span>
                            ) : change >= 0 ? (
                              <span className="text-blue-400">📈</span>
                            ) : change >= -10 ? (
                              <span className="text-amber-400">📉</span>
                            ) : (
                              <span className="text-red-400">⚠️</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tahsilat Oranı Karşılaştırması */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#25D366]" />
                Tahsilat Oranı Karşılaştırması
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="90%" 
                  data={orgStats.slice(0, 5).map((org, idx) => ({
                    name: org.name,
                    value: org.collectionRate,
                    fill: COLORS[idx % COLORS.length]
                  }))}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar 
                    dataKey="value" 
                    cornerRadius={10}
                    label={{ fill: '#fff', position: 'insideStart', fontSize: 12 }}
                  />
                  <Legend 
                    iconSize={10} 
                    layout="horizontal" 
                    verticalAlign="bottom"
                    formatter={(value: string) => <span style={{ color: '#a7f3d0' }}>{value}</span>}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => [`%${value.toFixed(1)}`, 'Tahsilat Oranı']}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SINIF DAĞILIMI */}
        {activeTab === 'grades' && consolidated && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tüm Kurumlar Sınıf Dağılımı */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#25D366]" />
                  Genel Sınıf Dağılımı
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsPie>
                    <Pie
                      data={consolidated.gradeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="count"
                      nameKey="grade"
                      label={({ grade, percent }) => `${grade}: %${(percent * 100).toFixed(0)}`}
                    >
                      {consolidated.gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Sınıf Bazlı Bar Chart */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#25D366]" />
                  Sınıf Bazlı Öğrenci Sayısı
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={consolidated.gradeDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" tick={{ fill: '#a7f3d0' }} />
                    <YAxis type="category" dataKey="grade" tick={{ fill: '#a7f3d0', fontSize: 11 }} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#25D366" radius={[0, 8, 8, 0]}>
                      {consolidated.gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Kurum Bazlı Sınıf Dağılımı Tablosu */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Kurum Bazlı Sınıf Dağılımı</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-3 text-emerald-200">Kurum</th>
                      {consolidated.gradeDistribution.slice(0, 8).map(g => (
                        <th key={g.grade} className="text-center p-3 text-emerald-200 text-sm">{g.grade}</th>
                      ))}
                      <th className="text-center p-3 text-emerald-200">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgStats.map(org => (
                      <tr key={org.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-3 text-white font-medium">{org.name}</td>
                        {consolidated.gradeDistribution.slice(0, 8).map(g => {
                          const count = org.gradeDistribution.find(gd => gd.grade === g.grade)?.count || 0;
                          return (
                            <td key={g.grade} className="text-center p-3 text-emerald-100">{count || '-'}</td>
                          );
                        })}
                        <td className="text-center p-3 text-white font-bold">{org.activeStudents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* KARŞILAŞTIRMA */}
        {activeTab === 'comparison' && consolidated && (
          <div className="space-y-6">
            {/* Performans Sıralaması - Eğitim */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  Eğitim Geliri Sıralaması
                </h3>
                <div className="space-y-3">
                  {[...orgStats].sort((a, b) => b.totalRevenue - a.totalRevenue).map((org, idx) => (
                    <div key={org.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-amber-500 text-white' :
                        idx === 1 ? 'bg-slate-400 text-white' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-white/10 text-emerald-200'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm">{org.name}</span>
                          <span className="text-blue-300 font-medium">{formatCurrency(org.totalRevenue)}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                          <div 
                            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                            style={{ width: `${consolidated.totalRevenue > 0 ? (org.totalRevenue / consolidated.totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-400" />
                  Satış Geliri Sıralaması
                </h3>
                <div className="space-y-3">
                  {[...orgStats].sort((a, b) => b.otherSalesTotal - a.otherSalesTotal).map((org, idx) => (
                    <div key={org.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-amber-500 text-white' :
                        idx === 1 ? 'bg-slate-400 text-white' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-white/10 text-emerald-200'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm">{org.name}</span>
                          <span className="text-purple-300 font-medium">{formatCurrency(org.otherSalesTotal)}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                          <div 
                            className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                            style={{ width: `${consolidated.totalOtherSales > 0 ? (org.otherSalesTotal / consolidated.totalOtherSales) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tahsilat Performans Sıralaması */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Tahsilat Performans Sıralaması
              </h3>
              <div className="space-y-4">
                {[...orgStats].sort((a, b) => b.collectionRate - a.collectionRate).map((org, idx) => (
                  <div key={org.id} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-amber-500 text-white' :
                      idx === 1 ? 'bg-slate-400 text-white' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-white/10 text-emerald-200'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{org.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-emerald-200 text-sm">{org.activeStudents} öğrenci</span>
                          <span className="text-blue-300 text-sm">{formatCurrency(org.collectedAmount + org.otherSalesCollected)}</span>
                          <span className={`font-bold ${
                            org.collectionRate >= 70 ? 'text-emerald-400' : 
                            org.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            %{org.collectionRate.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            org.collectionRate >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 
                            org.collectionRate >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                            'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${Math.min(org.collectionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Karşılaştırma Grafiği */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Çoklu Metrik Karşılaştırma</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={orgStats.map(org => ({
                  name: org.name.length > 12 ? org.name.substring(0, 12) + '...' : org.name,
                  öğrenci: org.activeStudents,
                  eğitim: org.collectedAmount,
                  satış: org.otherSalesCollected,
                  oran: org.collectionRate
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#a7f3d0', fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#a7f3d0' }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#a7f3d0' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number, name: string) => [
                      name === 'oran' ? `%${value.toFixed(1)}` : formatCurrency(value),
                      name === 'eğitim' ? 'Eğitim Tahsil' : name === 'satış' ? 'Satış Tahsil' : name === 'oran' ? 'Tahsilat Oranı' : name
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="eğitim" name="Eğitim Tahsil" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="satış" name="Satış Tahsil" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="oran" name="Tahsilat Oranı (%)" stroke="#25D366" strokeWidth={3} dot={{ fill: '#25D366', r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* RAPORLAR */}
        {activeTab === 'reports' && consolidated && (
          <div className="space-y-6">
            {/* Detaylı Kurum Tablosu */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#25D366]" />
                  Kurum Bazlı Detaylı Rapor
                </h3>
                <button
                  onClick={() => {
                    // Excel export
                    const headers = ['Kurum', 'Öğrenci', 'Eğitim Toplam', 'Eğitim Tahsil', 'Satış Toplam', 'Satış Tahsil', 'Genel Toplam', 'Genel Tahsil', 'Oran'];
                    const rows = orgStats.map(org => [
                      org.name,
                      org.activeStudents,
                      org.totalRevenue,
                      org.collectedAmount,
                      org.otherSalesTotal,
                      org.otherSalesCollected,
                      org.totalRevenue + org.otherSalesTotal,
                      org.collectedAmount + org.otherSalesCollected,
                      org.collectionRate.toFixed(1) + '%'
                    ]);
                    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `franchise_rapor_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                    toast.success('Rapor indirildi!');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition"
                >
                  <Download className="w-4 h-4" />
                  Excel İndir
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-3 text-emerald-200 font-medium">Kurum</th>
                      <th className="text-center p-3 text-emerald-200 font-medium">Öğrenci</th>
                      <th className="text-center p-3 text-emerald-200 font-medium">Eğitim Geliri</th>
                      <th className="text-center p-3 text-emerald-200 font-medium">Satış Geliri</th>
                      <th className="text-center p-3 text-emerald-200 font-medium">Toplam</th>
                      <th className="text-center p-3 text-emerald-200 font-medium">Tahsilat</th>
                      <th className="text-center p-3 text-emerald-200 font-medium">Bekleyen</th>
                      <th className="text-center p-3 text-emerald-200 font-medium">Oran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgStats.map((org, idx) => (
                      <tr key={org.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                 style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                              {org.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{org.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-white">{org.activeStudents}</td>
                        <td className="p-3 text-center text-blue-300">{formatCurrency(org.totalRevenue)}</td>
                        <td className="p-3 text-center text-purple-300">{formatCurrency(org.otherSalesTotal)}</td>
                        <td className="p-3 text-center text-white font-medium">{formatCurrency(org.totalRevenue + org.otherSalesTotal)}</td>
                        <td className="p-3 text-center text-emerald-400 font-medium">{formatCurrency(org.collectedAmount + org.otherSalesCollected)}</td>
                        <td className="p-3 text-center text-amber-400">{formatCurrency(org.pendingAmount + org.overdueAmount + org.otherSalesPending)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            org.collectionRate >= 70 ? 'bg-emerald-500/30 text-emerald-300' : 
                            org.collectionRate >= 50 ? 'bg-amber-500/30 text-amber-300' : 
                            'bg-red-500/30 text-red-300'
                          }`}>
                            %{org.collectionRate.toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Toplam Satırı */}
                    <tr className="bg-white/10 font-bold">
                      <td className="p-3 text-white">TOPLAM</td>
                      <td className="p-3 text-center text-white">{consolidated.totalStudents}</td>
                      <td className="p-3 text-center text-blue-300">{formatCurrency(consolidated.totalRevenue)}</td>
                      <td className="p-3 text-center text-purple-300">{formatCurrency(consolidated.totalOtherSales)}</td>
                      <td className="p-3 text-center text-white">{formatCurrency(consolidated.grandTotalRevenue)}</td>
                      <td className="p-3 text-center text-emerald-400">{formatCurrency(consolidated.grandTotalCollected)}</td>
                      <td className="p-3 text-center text-amber-400">{formatCurrency(consolidated.grandTotalRevenue - consolidated.grandTotalCollected)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-emerald-500/30 text-emerald-300 rounded-full text-xs">
                          %{consolidated.avgCollectionRate.toFixed(0)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
                <p className="text-3xl font-bold text-white">{consolidated.totalOrganizations}</p>
                <p className="text-emerald-200 text-sm">Kurum</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
                <p className="text-3xl font-bold text-white">{consolidated.totalStudents}</p>
                <p className="text-emerald-200 text-sm">Öğrenci</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
                <p className="text-3xl font-bold text-blue-300">{formatCurrency(consolidated.totalRevenue)}</p>
                <p className="text-emerald-200 text-sm">Eğitim Geliri</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
                <p className="text-3xl font-bold text-purple-300">{formatCurrency(consolidated.totalOtherSales)}</p>
                <p className="text-emerald-200 text-sm">Satış Geliri</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
                <p className="text-3xl font-bold text-emerald-400">{formatCurrency(consolidated.grandTotalCollected)}</p>
                <p className="text-emerald-200 text-sm">Toplam Tahsilat</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
                <p className="text-3xl font-bold text-amber-400">%{consolidated.avgCollectionRate.toFixed(0)}</p>
                <p className="text-emerald-200 text-sm">Ort. Oran</p>
              </div>
            </div>

            {/* Hızlı Raporlar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => {
                  const data = orgStats.filter(o => o.overdueAmount > 0);
                  if (data.length === 0) {
                    toast.success('Gecikmiş ödeme yok!');
                    return;
                  }
                  const csv = 'Kurum,Gecikmiş Tutar\n' + data.map(o => `${o.name},${o.overdueAmount}`).join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `gecikme_raporu_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                  toast.success('Gecikme raporu indirildi!');
                }}
                className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30 cursor-pointer hover:from-red-500/30 hover:to-orange-500/30 transition"
              >
                <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
                <h4 className="text-white font-semibold mb-1">Gecikme Raporu</h4>
                <p className="text-red-200 text-sm mb-3">Gecikmiş ödemeler listesi</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(consolidated.totalOverdue)}</p>
              </div>

              <div 
                onClick={() => {
                  const csv = 'Kurum,Öğrenci Sayısı,Tahsilat Oranı\n' + 
                    [...orgStats].sort((a, b) => b.collectionRate - a.collectionRate)
                      .map(o => `${o.name},${o.activeStudents},${o.collectionRate.toFixed(1)}%`).join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `performans_raporu_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                  toast.success('Performans raporu indirildi!');
                }}
                className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30 cursor-pointer hover:from-amber-500/30 hover:to-yellow-500/30 transition"
              >
                <Award className="w-10 h-10 text-amber-400 mb-3" />
                <h4 className="text-white font-semibold mb-1">Performans Raporu</h4>
                <p className="text-amber-200 text-sm mb-3">Kurum sıralaması</p>
                <p className="text-2xl font-bold text-amber-400">
                  🏆 {orgStats.length > 0 ? [...orgStats].sort((a, b) => b.collectionRate - a.collectionRate)[0]?.name.substring(0, 15) : '-'}
                </p>
              </div>

              <div 
                onClick={() => {
                  const csv = 'Sınıf,Öğrenci Sayısı\n' + 
                    consolidated.gradeDistribution.map(g => `${g.grade},${g.count}`).join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `sinif_dagilimi_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                  toast.success('Sınıf dağılımı raporu indirildi!');
                }}
                className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30 cursor-pointer hover:from-blue-500/30 hover:to-indigo-500/30 transition"
              >
                <GraduationCap className="w-10 h-10 text-blue-400 mb-3" />
                <h4 className="text-white font-semibold mb-1">Öğrenci Analizi</h4>
                <p className="text-blue-200 text-sm mb-3">Sınıf dağılımları</p>
                <p className="text-2xl font-bold text-blue-400">{consolidated.gradeDistribution.length} Sınıf</p>
              </div>
            </div>
          </div>
        )}
            </div>

      {/* Kurum Detay Modal */}
      {showOrgModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#075E54] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#075E54]">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {selectedOrg.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedOrg.name}</h2>
                  <p className="text-emerald-200 text-sm">/login/{selectedOrg.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrgModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5 text-emerald-200" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* İstatistikler - Üst Sıra */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedOrg.activeStudents}</p>
                  <p className="text-emerald-200 text-sm">Öğrenci</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedOrg.userCount}</p>
                  <p className="text-emerald-200 text-sm">Kullanıcı</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(selectedOrg.totalRevenue + selectedOrg.otherSalesTotal)}</p>
                  <p className="text-emerald-200 text-sm">Toplam Sözleşme</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${selectedOrg.collectionRate >= 70 ? 'text-emerald-400' : selectedOrg.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    %{selectedOrg.collectionRate.toFixed(1)}
                  </p>
                  <p className="text-emerald-200 text-sm">Tahsilat Oranı</p>
                </div>
              </div>

              {/* Gelir Detayları */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl p-4 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-blue-300" />
                    <h4 className="text-blue-200 font-medium">Eğitim Gelirleri</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-200/70">Toplam:</span>
                      <span className="text-white font-medium">{formatCurrency(selectedOrg.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200/70">Tahsil Edilen:</span>
                      <span className="text-emerald-400 font-medium">{formatCurrency(selectedOrg.collectedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200/70">Bekleyen:</span>
                      <span className="text-amber-400 font-medium">{formatCurrency(selectedOrg.pendingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200/70">Gecikmiş:</span>
                      <span className="text-red-400 font-medium">{formatCurrency(selectedOrg.overdueAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-5 h-5 text-purple-300" />
                    <h4 className="text-purple-200 font-medium">Diğer Satışlar</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-purple-200/70">Toplam:</span>
                      <span className="text-white font-medium">{formatCurrency(selectedOrg.otherSalesTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200/70">Tahsil Edilen:</span>
                      <span className="text-emerald-400 font-medium">{formatCurrency(selectedOrg.otherSalesCollected)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200/70">Bekleyen:</span>
                      <span className="text-amber-400 font-medium">{formatCurrency(selectedOrg.otherSalesPending)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sınıf Dağılımı */}
              {selectedOrg.gradeDistribution.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-3">Sınıf Dağılımı</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrg.gradeDistribution.map(g => (
                      <span key={g.grade} className="px-3 py-1 bg-[#25D366]/20 text-emerald-200 rounded-full text-sm">
                        {g.grade}: {g.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Aksiyonlar */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleGoToOrganization(selectedOrg)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition"
                >
                  <Eye className="w-4 h-4" />
                  Kuruma Git
                </button>
                <button
                  onClick={() => {
                    setShowOrgModal(false);
                    router.push(`/settings?tab=users&org=${selectedOrg.id}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                >
                  <Users className="w-4 h-4" />
                  Kullanıcıları Yönet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
