'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  CheckCircle, Loader2, ChevronRight, BarChart3, PieChart, ArrowUpRight,
  ArrowDownRight, RefreshCw, Settings, UserPlus, Eye, Edit, Trash2,
  Download, FileText, Calendar, Filter, Search, MoreVertical, Shield,
  Mail, Phone, MapPin, Globe, CreditCard, Activity, Target, Award,
  AlertCircle, Clock, Percent, Wallet, Receipt, UserCheck, X
} from 'lucide-react';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';

// Types
interface OrganizationStats {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  studentCount: number;
  activeStudents: number;
  totalRevenue: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  monthlyGrowth: number;
  userCount: number;
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
}

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  organization_id: string;
  organization_name?: string;
  last_login?: string;
}

type TabType = 'overview' | 'organizations' | 'comparison' | 'users' | 'reports';

export default function FranchiseDashboardPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: permissionLoading } = usePermission();
  const { organizations, fetchOrganizations, setCurrentOrganization } = useOrganizationStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [orgStats, setOrgStats] = useState<OrganizationStats[]>([]);
  const [consolidated, setConsolidated] = useState<ConsolidatedStats | null>(null);
  const [allUsers, setAllUsers] = useState<OrgUser[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationStats | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

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
      const users: OrgUser[] = [];
      
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
          
          // Kullanıcıları ekle
          orgUsers.forEach((u: any) => {
            users.push({
              ...u,
              organization_name: org.name
            });
          });
          
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
            email: org.email,
            phone: org.phone,
            address: org.address,
            studentCount: students.length,
            activeStudents: students.filter((s: any) => s.status !== 'deleted').length,
            totalRevenue,
            collectedAmount,
            pendingAmount,
            overdueAmount,
            collectionRate: totalRevenue > 0 ? (collectedAmount / totalRevenue) * 100 : 0,
            monthlyGrowth: Math.random() * 20 - 5, // Placeholder
            userCount: orgUsers.length
          });
        } catch (error) {
          console.error(`Error loading stats for ${org.name}:`, error);
        }
      }
      
      setOrgStats(stats);
      setAllUsers(users);
      
      // Konsolide istatistikler
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
        totalUsers: users.length
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  // Filtrelenmiş kullanıcılar
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // En iyi performans
  const topPerformers = [...orgStats].sort((a, b) => b.collectionRate - a.collectionRate);

  // Yükleniyor
  if (permissionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200 text-lg">Franchise verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  // Tab içerikleri
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'organizations':
        return renderOrganizations();
      case 'comparison':
        return renderComparison();
      case 'users':
        return renderUsers();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  // GENEL BAKIŞ
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Konsolide İstatistikler */}
      {consolidated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Toplam Kurum */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-purple-500/30 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-purple-300" />
              </div>
              <span className="text-xs font-medium text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                Aktif
              </span>
            </div>
            <p className="text-4xl font-bold text-white">{consolidated.totalOrganizations}</p>
            <p className="text-purple-200 mt-1">Toplam Kurum</p>
          </div>

          {/* Toplam Öğrenci */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-500/30 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-300" />
              </div>
              <span className="text-xs font-medium text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">
                Kayıtlı
              </span>
            </div>
            <p className="text-4xl font-bold text-white">{consolidated.totalStudents}</p>
            <p className="text-blue-200 mt-1">Toplam Öğrenci</p>
          </div>

          {/* Toplam Tahsilat */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-emerald-300" />
              </div>
              <span className="text-xs font-medium text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                %{consolidated.avgCollectionRate.toFixed(1)}
              </span>
            </div>
            <p className="text-4xl font-bold text-white">{formatCurrency(consolidated.totalCollected)}</p>
            <p className="text-emerald-200 mt-1">Toplam Tahsilat</p>
          </div>

          {/* Bekleyen Alacak */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-amber-500/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-300" />
              </div>
              <span className="text-xs font-medium text-red-300 bg-red-500/20 px-3 py-1 rounded-full">
                Gecikmiş: {formatCurrency(consolidated.totalOverdue)}
              </span>
            </div>
            <p className="text-4xl font-bold text-white">{formatCurrency(consolidated.totalPending + consolidated.totalOverdue)}</p>
            <p className="text-amber-200 mt-1">Bekleyen Alacak</p>
          </div>
        </div>
      )}

      {/* Hızlı Kurum Kartları */}
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
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{org.name}</h3>
                    <p className="text-xs text-purple-300">{org.activeStudents} öğrenci</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-300 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-purple-300">Tahsilat</p>
                  <p className="text-sm font-semibold text-emerald-400">{formatCurrency(org.collectedAmount)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-purple-300">Oran</p>
                  <p className={`text-sm font-semibold ${org.collectionRate >= 70 ? 'text-emerald-400' : org.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    %{org.collectionRate.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
            </div>

      {/* Kritik Uyarılar */}
      {consolidated && consolidated.totalOverdue > 0 && (
        <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-red-300">Kritik Uyarılar</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orgStats.filter(o => o.overdueAmount > 0).map(org => (
              <div key={org.id} className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-medium">{org.name}</p>
                <p className="text-red-400 text-lg font-bold">{formatCurrency(org.overdueAmount)}</p>
                <p className="text-red-300 text-xs">Gecikmiş ödeme</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // KURUMLAR
  const renderOrganizations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Tüm Kurumlar</h2>
        <button 
          onClick={() => router.push('/settings?tab=organizations')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" />
          Yeni Kurum Ekle
        </button>
              </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4 text-purple-300 font-medium">Kurum</th>
              <th className="text-left p-4 text-purple-300 font-medium">Öğrenci</th>
              <th className="text-left p-4 text-purple-300 font-medium">Tahsilat</th>
              <th className="text-left p-4 text-purple-300 font-medium">Oran</th>
              <th className="text-left p-4 text-purple-300 font-medium">Kullanıcı</th>
              <th className="text-left p-4 text-purple-300 font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {orgStats.map((org, idx) => (
              <tr key={org.id} className={`border-t border-white/10 hover:bg-white/5 ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>
              <div>
                      <p className="text-white font-medium">{org.name}</p>
                      <p className="text-purple-300 text-xs">/login/{org.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-white">{org.activeStudents}</td>
                <td className="p-4 text-emerald-400 font-medium">{formatCurrency(org.collectedAmount)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    org.collectionRate >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 
                    org.collectionRate >= 50 ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-red-500/20 text-red-400'
                  }`}>
                    %{org.collectionRate.toFixed(1)}
                  </span>
                </td>
                <td className="p-4 text-white">{org.userCount}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGoToOrganization(org)}
                      className="p-2 hover:bg-white/10 rounded-lg transition text-purple-300 hover:text-white"
                      title="Kuruma Git"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/settings?tab=users&org=${org.id}`)}
                      className="p-2 hover:bg-white/10 rounded-lg transition text-purple-300 hover:text-white"
                      title="Kullanıcıları Yönet"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrg(org);
                        setShowOrgModal(true);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition text-purple-300 hover:text-white"
                      title="Detay"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // KARŞILAŞTIRMA
  const renderComparison = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">Kurum Karşılaştırması</h2>

      {/* Performans Sıralaması */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Tahsilat Performansı Sıralaması
        </h3>
        <div className="space-y-3">
          {topPerformers.map((org, idx) => (
            <div key={org.id} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                idx === 0 ? 'bg-amber-500 text-white' :
                idx === 1 ? 'bg-slate-400 text-white' :
                idx === 2 ? 'bg-amber-700 text-white' :
                'bg-white/10 text-purple-300'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{org.name}</span>
                  <span className={`font-bold ${
                    org.collectionRate >= 70 ? 'text-emerald-400' : 
                    org.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    %{org.collectionRate.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      org.collectionRate >= 70 ? 'bg-emerald-500' : 
                      org.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(org.collectionRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Karşılaştırma Tablosu */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Detaylı Karşılaştırma</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3 text-purple-300">Metrik</th>
                {orgStats.map(org => (
                  <th key={org.id} className="text-center p-3 text-purple-300">{org.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="p-3 text-purple-200">Öğrenci Sayısı</td>
                {orgStats.map(org => (
                  <td key={org.id} className="text-center p-3 text-white font-medium">{org.activeStudents}</td>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-3 text-purple-200">Toplam Gelir</td>
                {orgStats.map(org => (
                  <td key={org.id} className="text-center p-3 text-white font-medium">{formatCurrency(org.totalRevenue)}</td>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-3 text-purple-200">Tahsilat</td>
                {orgStats.map(org => (
                  <td key={org.id} className="text-center p-3 text-emerald-400 font-medium">{formatCurrency(org.collectedAmount)}</td>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-3 text-purple-200">Gecikmiş</td>
                {orgStats.map(org => (
                  <td key={org.id} className="text-center p-3 text-red-400 font-medium">{formatCurrency(org.overdueAmount)}</td>
                ))}
              </tr>
              <tr>
                <td className="p-3 text-purple-200">Tahsilat Oranı</td>
                {orgStats.map(org => (
                  <td key={org.id} className={`text-center p-3 font-bold ${
                    org.collectionRate >= 70 ? 'text-emerald-400' : 
                    org.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    %{org.collectionRate.toFixed(1)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // KULLANICILAR
  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-white">Tüm Kullanıcılar ({allUsers.length})</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Roller</option>
            <option value="admin">Admin</option>
            <option value="accounting">Muhasebe</option>
            <option value="staff">Personel</option>
          </select>
                </div>
              </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4 text-purple-300 font-medium">Kullanıcı</th>
              <th className="text-left p-4 text-purple-300 font-medium">Kurum</th>
              <th className="text-left p-4 text-purple-300 font-medium">Rol</th>
              <th className="text-left p-4 text-purple-300 font-medium">Durum</th>
              <th className="text-left p-4 text-purple-300 font-medium">Son Giriş</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => (
              <tr key={user.id} className={`border-t border-white/10 hover:bg-white/5`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-purple-300 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-purple-200">{user.organization_name || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                    user.role === 'accounting' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : user.role === 'accounting' ? 'Muhasebe' : 'Personel'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {user.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="p-4 text-purple-300 text-sm">
                  {user.last_login ? formatDate(user.last_login) : 'Hiç giriş yapmadı'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // RAPORLAR
  const renderReports = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">Konsolide Raporlar</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Rapor Kartları */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
          <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-300" />
          </div>
          <h3 className="text-white font-semibold mb-2">Finansal Özet Raporu</h3>
          <p className="text-purple-300 text-sm mb-4">Tüm kurumların finansal durumu</p>
          <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
          <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-emerald-300" />
          </div>
          <h3 className="text-white font-semibold mb-2">Tahsilat Raporu</h3>
          <p className="text-purple-300 text-sm mb-4">Kurum bazlı tahsilat analizi</p>
          <button className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm">
            <Download className="w-4 h-4" />
            PDF İndir
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
          <div className="w-12 h-12 bg-amber-500/30 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-amber-300" />
          </div>
          <h3 className="text-white font-semibold mb-2">Öğrenci Raporu</h3>
          <p className="text-purple-300 text-sm mb-4">Kayıt ve durum analizi</p>
          <button className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm">
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
          <div className="w-12 h-12 bg-red-500/30 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-300" />
          </div>
          <h3 className="text-white font-semibold mb-2">Gecikmiş Ödemeler</h3>
          <p className="text-purple-300 text-sm mb-4">Tüm gecikmiş ödemeler listesi</p>
          <button className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm">
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
          <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-purple-300" />
          </div>
          <h3 className="text-white font-semibold mb-2">Performans Raporu</h3>
          <p className="text-purple-300 text-sm mb-4">Kurum karşılaştırma raporu</p>
          <button className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm">
            <Download className="w-4 h-4" />
            PDF İndir
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
          <div className="w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-indigo-300" />
          </div>
          <h3 className="text-white font-semibold mb-2">Aylık Rapor</h3>
          <p className="text-purple-300 text-sm mb-4">Bu ay özet raporu</p>
          <button className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm">
            <Download className="w-4 h-4" />
            PDF İndir
          </button>
        </div>
      </div>

      {/* Özet Tablo */}
      {consolidated && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Konsolide Özet</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-3xl font-bold text-white">{consolidated.totalOrganizations}</p>
              <p className="text-purple-300 text-sm">Kurum</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-3xl font-bold text-white">{consolidated.totalStudents}</p>
              <p className="text-purple-300 text-sm">Öğrenci</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(consolidated.totalCollected)}</p>
              <p className="text-purple-300 text-sm">Tahsilat</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-3xl font-bold text-amber-400">%{consolidated.avgCollectionRate.toFixed(1)}</p>
              <p className="text-purple-300 text-sm">Ort. Tahsilat Oranı</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                <h1 className="text-2xl font-bold text-white">Franchise Yönetim Paneli</h1>
                <p className="text-purple-300 text-sm">Tüm kurumlarınızı tek noktadan yönetin</p>
              </div>
            </div>
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
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Genel Bakış', icon: PieChart },
              { id: 'organizations', label: 'Kurumlar', icon: Building2 },
              { id: 'comparison', label: 'Karşılaştırma', icon: BarChart3 },
              { id: 'users', label: 'Kullanıcılar', icon: Users },
              { id: 'reports', label: 'Raporlar', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-purple-300 hover:bg-white/10 hover:text-white'
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
        {renderTabContent()}
      </div>

      {/* Kurum Detay Modal */}
      {showOrgModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {selectedOrg.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedOrg.name}</h2>
                  <p className="text-purple-300 text-sm">/login/{selectedOrg.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrgModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5 text-purple-300" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* İstatistikler */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-purple-300 text-sm">Öğrenci Sayısı</p>
                  <p className="text-2xl font-bold text-white">{selectedOrg.activeStudents}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-purple-300 text-sm">Kullanıcı Sayısı</p>
                  <p className="text-2xl font-bold text-white">{selectedOrg.userCount}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-purple-300 text-sm">Toplam Tahsilat</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(selectedOrg.collectedAmount)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-purple-300 text-sm">Tahsilat Oranı</p>
                  <p className={`text-2xl font-bold ${
                    selectedOrg.collectionRate >= 70 ? 'text-emerald-400' : 
                    selectedOrg.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    %{selectedOrg.collectionRate.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Finansal Detaylar */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Finansal Detaylar</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Toplam Gelir</span>
                    <span className="text-white font-medium">{formatCurrency(selectedOrg.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Tahsil Edilen</span>
                    <span className="text-emerald-400 font-medium">{formatCurrency(selectedOrg.collectedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Bekleyen</span>
                    <span className="text-amber-400 font-medium">{formatCurrency(selectedOrg.pendingAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Gecikmiş</span>
                    <span className="text-red-400 font-medium">{formatCurrency(selectedOrg.overdueAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Aksiyonlar */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleGoToOrganization(selectedOrg)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
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

// Plus icon component
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
