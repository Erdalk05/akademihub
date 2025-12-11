'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';

interface OrganizationStats {
  id: string;
  name: string;
  slug: string;
  studentCount: number;
  totalRevenue: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
}

interface ConsolidatedStats {
  totalOrganizations: number;
  totalStudents: number;
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  avgCollectionRate: number;
}

export default function FranchiseDashboardPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: permissionLoading } = usePermission();
  const { organizations, fetchOrganizations, setCurrentOrganization } = useOrganizationStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [orgStats, setOrgStats] = useState<OrganizationStats[]>([]);
  const [consolidated, setConsolidated] = useState<ConsolidatedStats | null>(null);

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
      
      // Kurumları yükle
      if (organizations.length === 0) {
        await fetchOrganizations();
      }
      
      // Her kurum için istatistikleri çek
      const stats: OrganizationStats[] = [];
      
      for (const org of organizations) {
        try {
          const [studentsRes, installmentsRes] = await Promise.all([
            fetch(`/api/students?organization_id=${org.id}`),
            fetch(`/api/installments?organization_id=${org.id}`)
          ]);
          
          const studentsData = await studentsRes.json();
          const installmentsData = await installmentsRes.json();
          
          const students = studentsData.data || [];
          const installments = installmentsData.data || [];
          
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
            studentCount: students.filter((s: any) => s.status !== 'deleted').length,
            totalRevenue,
            collectedAmount,
            pendingAmount,
            overdueAmount,
            collectionRate: totalRevenue > 0 ? (collectedAmount / totalRevenue) * 100 : 0
          });
        } catch (error) {
          console.error(`Error loading stats for ${org.name}:`, error);
        }
      }
      
      setOrgStats(stats);
      
      // Konsolide istatistikler
      const consolidated: ConsolidatedStats = {
        totalOrganizations: stats.length,
        totalStudents: stats.reduce((sum, s) => sum + s.studentCount, 0),
        totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
        totalCollected: stats.reduce((sum, s) => sum + s.collectedAmount, 0),
        totalPending: stats.reduce((sum, s) => sum + s.pendingAmount, 0),
        totalOverdue: stats.reduce((sum, s) => sum + s.overdueAmount, 0),
        avgCollectionRate: stats.length > 0 
          ? stats.reduce((sum, s) => sum + s.collectionRate, 0) / stats.length 
          : 0
      };
      
      setConsolidated(consolidated);
      setIsLoading(false);
    };
    
    if (isSuperAdmin && organizations.length >= 0) {
      loadData();
    }
  }, [isSuperAdmin, organizations, fetchOrganizations]);

  const handleGoToOrganization = (org: OrganizationStats) => {
    const fullOrg = organizations.find(o => o.id === org.id);
    if (fullOrg) {
      setCurrentOrganization(fullOrg);
      toast.success(`${org.name} kurumuna geçildi`);
      router.push('/dashboard');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  // Yükleniyor
  if (permissionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Franchise verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Yetki yok
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Franchise Yönetim Paneli</h1>
            <p className="text-slate-500">Tüm kurumlarınızın konsolide görünümü</p>
          </div>
        </div>
      </div>

      {/* Konsolide İstatistikler */}
      {consolidated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Toplam Kurum */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                Kurumlar
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{consolidated.totalOrganizations}</p>
            <p className="text-sm text-slate-500 mt-1">Aktif Kurum</p>
          </div>

          {/* Toplam Öğrenci */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Öğrenciler
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{consolidated.totalStudents}</p>
            <p className="text-sm text-slate-500 mt-1">Toplam Öğrenci</p>
          </div>

          {/* Toplam Tahsilat */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {consolidated.avgCollectionRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(consolidated.totalCollected)}</p>
            <p className="text-sm text-slate-500 mt-1">Toplam Tahsilat</p>
          </div>

          {/* Bekleyen + Gecikmiş */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                Gecikmiş: {formatCurrency(consolidated.totalOverdue)}
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(consolidated.totalPending + consolidated.totalOverdue)}</p>
            <p className="text-sm text-slate-500 mt-1">Bekleyen Alacak</p>
          </div>
        </div>
      )}

      {/* Kurum Kartları */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Kurum Detayları</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orgStats.map((org) => (
          <div 
            key={org.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Kurum Header */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{org.name}</h3>
                    <p className="text-xs text-slate-500">/login/{org.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleGoToOrganization(org)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Kuruma Git"
                >
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* İstatistikler */}
            <div className="p-5 space-y-4">
              {/* Öğrenci Sayısı */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Öğrenci</span>
                <span className="font-semibold text-slate-900">{org.studentCount}</span>
              </div>

              {/* Tahsilat Oranı */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Tahsilat Oranı</span>
                  <span className={`font-semibold ${
                    org.collectionRate >= 80 ? 'text-emerald-600' :
                    org.collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    %{org.collectionRate.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      org.collectionRate >= 80 ? 'bg-emerald-500' :
                      org.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(org.collectionRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Finansal Detaylar */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400">Tahsil Edilen</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(org.collectedAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Bekleyen</p>
                  <p className="text-sm font-semibold text-amber-600">{formatCurrency(org.pendingAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Gecikmiş</p>
                  <p className="text-sm font-semibold text-red-600">{formatCurrency(org.overdueAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Toplam Gelir</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(org.totalRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => handleGoToOrganization(org)}
                className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Bu Kuruma Git
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Boş State */}
      {orgStats.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Henüz Kurum Yok</h3>
          <p className="text-slate-500">Ayarlar → Kurum Yönetimi'nden yeni kurum ekleyebilirsiniz.</p>
        </div>
      )}
    </div>
  );
}

