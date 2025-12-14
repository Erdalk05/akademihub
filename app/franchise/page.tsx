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
  gradeDistribution: { grade: string; count: number }[];
}

type TabType = 'overview' | 'analytics' | 'grades' | 'comparison' | 'reports';

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
      
      for (const org of orgs) {
        try {
          const [studentsRes, installmentsRes, usersRes] = await Promise.all([
            fetch(`/api/students?organization_id=${org.id}`),
            fetch(`/api/installments?organization_id=${org.id}`),
            fetch(`/api/settings/users?organization_id=${org.id}`)
          ]);
          
          const studentsData = await studentsRes.json();
          const installmentsData = await installmentsRes.json();
          const usersData = await usersRes.json();
          
          const students = studentsData.data || [];
          const installments = installmentsData.data || [];
          const orgUsers = usersData.data || [];
          
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
      
      const consolidated: ConsolidatedStats = {
        totalOrganizations: stats.length,
        totalStudents: stats.reduce((sum, s) => sum + s.activeStudents, 0),
        totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
        totalCollected: stats.reduce((sum, s) => sum + s.collectedAmount, 0),
        totalPending: stats.reduce((sum, s) => sum + s.pendingAmount, 0),
        totalOverdue: stats.reduce((sum, s) => sum + s.overdueAmount, 0),
        avgCollectionRate: stats.length > 0 
          ? stats.reduce((sum, s) => sum + s.collectionRate, 0) / stats.length 
          : 0,
        totalUsers: stats.reduce((sum, s) => sum + s.userCount, 0),
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
            {/* KPI Kartları */}
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
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.totalCollected)}</p>
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
                  Tahsilat Durumu
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={[
                        { name: 'Tahsil Edilen', value: consolidated.totalCollected },
                        { name: 'Bekleyen', value: consolidated.totalPending },
                        { name: 'Gecikmiş', value: consolidated.totalOverdue },
                      ]}
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
                        <p className="text-xs text-emerald-200">Tahsilat</p>
                        <p className="text-sm font-semibold text-emerald-400">{formatCurrency(org.collectedAmount)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-emerald-200">Bekleyen</p>
                        <p className="text-sm font-semibold text-amber-400">{formatCurrency(org.pendingAmount + org.overdueAmount)}</p>
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
                <p className="text-3xl font-bold text-white">{(consolidated.totalStudents / consolidated.totalOrganizations).toFixed(0)}</p>
                <p className="text-emerald-200">Kurum Başına Öğrenci</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-white">{formatCurrency(consolidated.totalRevenue / consolidated.totalStudents || 0)}</p>
                <p className="text-emerald-200">Öğrenci Başına Gelir</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-white">{consolidated.totalUsers}</p>
                <p className="text-emerald-200">Toplam Kullanıcı</p>
              </div>
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
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Performans Sıralaması */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Kurum Performans Sıralaması
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
                <ComposedChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#a7f3d0', fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#a7f3d0' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#a7f3d0' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#075E54', border: 'none', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="öğrenci" name="Öğrenci Sayısı" fill="#34B7F1" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="oran" name="Tahsilat Oranı (%)" stroke="#25D366" strokeWidth={3} dot={{ fill: '#25D366', r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* RAPORLAR */}
        {activeTab === 'reports' && consolidated && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Finansal Özet', desc: 'Tüm kurumların gelir-gider analizi', icon: Wallet, color: 'emerald' },
                { title: 'Tahsilat Raporu', desc: 'Detaylı tahsilat performansı', icon: CreditCard, color: 'blue' },
                { title: 'Öğrenci Analizi', desc: 'Kayıt ve sınıf dağılımları', icon: Users, color: 'purple' },
                { title: 'Gecikme Raporu', desc: 'Riskli alacaklar listesi', icon: AlertTriangle, color: 'red' },
                { title: 'Performans Raporu', desc: 'Kurum karşılaştırması', icon: Award, color: 'amber' },
                { title: 'Aylık Rapor', desc: 'Bu ay özet değerlendirme', icon: Calendar, color: 'teal' },
              ].map((report, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer group">
                  <div className={`w-14 h-14 bg-${report.color}-500/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                    <report.icon className={`w-7 h-7 text-${report.color}-300`} />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{report.title}</h3>
                  <p className="text-emerald-200 text-sm mb-4">{report.desc}</p>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 text-[#25D366] hover:text-emerald-300 text-sm font-medium">
                      <Download className="w-4 h-4" />
                      Excel
                    </button>
                    <button className="flex items-center gap-2 text-[#25D366] hover:text-emerald-300 text-sm font-medium">
                      <FileText className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                </div>
              ))}
              </div>

            {/* Hızlı Özet */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-6">📊 Anlık Durum Özeti</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{consolidated.totalOrganizations}</p>
                  <p className="text-emerald-200">Kurum</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{consolidated.totalStudents}</p>
                  <p className="text-emerald-200">Öğrenci</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-emerald-400">{formatCurrency(consolidated.totalCollected)}</p>
                  <p className="text-emerald-200">Tahsilat</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-amber-400">%{consolidated.avgCollectionRate.toFixed(1)}</p>
                  <p className="text-emerald-200">Ort. Oran</p>
                </div>
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
              {/* İstatistikler */}
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
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(selectedOrg.collectedAmount)}</p>
                  <p className="text-emerald-200 text-sm">Tahsilat</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${selectedOrg.collectionRate >= 70 ? 'text-emerald-400' : selectedOrg.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    %{selectedOrg.collectionRate.toFixed(1)}
                  </p>
                  <p className="text-emerald-200 text-sm">Oran</p>
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
