'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  CheckCircle2,
  CreditCard,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

// Akademik Yıllar
const ACADEMIC_YEARS = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];

const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

type CollectionRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  studentClass: string;
  amount: number;
  paidAt: Date;
  installmentNo: number;
  paymentMethod: string;
};

export default function CollectionsPage() {
  const router = useRouter();
  
  // Data
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [installmentsRes, studentsRes] = await Promise.all([
          fetch('/api/installments'),
          fetch('/api/students')
        ]);
        
        const installmentsJson = await installmentsRes.json();
        const studentsJson = await studentsRes.json();
        
        const installments = installmentsJson.data || [];
        const students = studentsJson.data || [];
        
        // Student lookup
        const studentMap: Record<string, any> = {};
        students.forEach((s: any) => {
          studentMap[s.id] = s;
        });
        
        // Filter only paid installments
        const paidInstallments = installments
          .filter((i: any) => i.is_paid && i.paid_at)
          .map((i: any) => {
            const student = studentMap[i.student_id] || {};
            return {
              id: i.id,
              studentId: i.student_id,
              studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.full_name || 'Bilinmeyen',
              studentNo: student.student_no || '-',
              studentClass: student.class || student.enrolled_class || '-',
              amount: Number(i.amount) || 0,
              paidAt: new Date(i.paid_at),
              installmentNo: i.installment_no || 0,
              paymentMethod: i.payment_method || 'Nakit',
            };
          })
          .sort((a: CollectionRow, b: CollectionRow) => b.paidAt.getTime() - a.paidAt.getTime());
        
        setCollections(paidInstallments);
      } catch (error) {
        toast.error('Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedYear]);

  // Filter by period
  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return collections.filter(c => {
      if (periodFilter === 'all') return true;
      if (periodFilter === 'today') return c.paidAt >= today;
      if (periodFilter === 'week') return c.paidAt >= weekAgo;
      if (periodFilter === 'month') return c.paidAt >= monthAgo;
      return true;
    });
  }, [collections, periodFilter]);

  // Filter by search
  const filteredCollections = useMemo(() => {
    if (!search) return filteredByPeriod;
    const term = search.toLowerCase();
    return filteredByPeriod.filter(c => 
      c.studentName.toLowerCase().includes(term) || 
      c.studentNo.toLowerCase().includes(term)
    );
  }, [filteredByPeriod, search]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayCollections = collections.filter(c => c.paidAt >= todayStart);
    const todayTotal = todayCollections.reduce((sum, c) => sum + c.amount, 0);
    const totalCollected = filteredByPeriod.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      todayTotal,
      todayCount: todayCollections.length,
      periodTotal: totalCollected,
      periodCount: filteredByPeriod.length,
    };
  }, [collections, filteredByPeriod]);

  // Pagination
  const totalPages = Math.ceil(filteredCollections.length / pageSize);
  const paginatedData = filteredCollections.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatMoney = (val: number) => {
    if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₺${(val / 1000).toFixed(0)}K`;
    return `₺${val.toLocaleString('tr-TR')}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPeriodLabel = () => {
    if (periodFilter === 'today') return 'Bugün';
    if (periodFilter === 'week') return 'Bu Hafta';
    if (periodFilter === 'month') return 'Bu Ay';
    return 'Tümü';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tahsilatlar</h1>
            <p className="text-slate-500 text-sm">Ödeme takibi ve tahsilat yönetimi</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={() => window.location.reload()}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            {/* Academic Year */}
            <div className="relative">
              <button
                onClick={() => setIsYearOpen(!isYearOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                <Calendar size={16} />
                {selectedYear}
                <ChevronDown size={14} className={isYearOpen ? 'rotate-180' : ''} />
              </button>
              
              {isYearOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  {ACADEMIC_YEARS.map(year => (
                    <button
                      key={year}
                      onClick={() => { setSelectedYear(year); setIsYearOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                        year === selectedYear ? 'text-emerald-600 font-medium' : 'text-slate-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Excel Export */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition">
              <Download size={16} />
              Excel
            </button>
          </div>
        </div>

        {/* Stats Cards - Öğrenci listesi ile aynı stil */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Bugün</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.todayCount}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Bugün Tahsilat</p>
                <p className="text-2xl font-bold text-emerald-600">{formatMoney(stats.todayTotal)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Wallet size={18} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">{getPeriodLabel()} Adet</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.periodCount}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <CreditCard size={18} className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">{getPeriodLabel()} Toplam</p>
                <p className="text-2xl font-bold text-slate-900">{formatMoney(stats.periodTotal)}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={18} className="text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Öğrenci listesi ile aynı stil */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Öğrenci ara..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            
            {/* Period Filter */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {[
                { value: 'today', label: 'Bugün' },
                { value: 'week', label: 'Hafta' },
                { value: 'month', label: 'Ay' },
                { value: 'all', label: 'Tümü' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setPeriodFilter(opt.value as any); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    periodFilter === opt.value
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Count */}
            <span className="text-sm text-slate-500">{filteredCollections.length} tahsilat</span>
          </div>
        </div>

        {/* Table - Öğrenci listesi ile aynı stil */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-emerald-600" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <CreditCard size={48} className="mb-3 opacity-50" />
              <p>Tahsilat bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Öğrenci</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sınıf</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Taksit</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((row) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50/50 transition cursor-pointer"
                      onClick={() => router.push(`/students/${row.studentId}`)}
                    >
                      {/* 1. Tarih */}
                      <td className="px-4 py-3">
                        <p className="text-slate-900 font-medium">{row.paidAt.toLocaleDateString('tr-TR')}</p>
                        <p className="text-xs text-slate-400">{row.paidAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      {/* 2. Öğrenci */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-medium text-xs">
                            {getInitials(row.studentName)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{row.studentName}</p>
                            <p className="text-xs text-slate-500">{row.studentNo}</p>
                          </div>
                        </div>
                      </td>
                      {/* 3. Sınıf */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                          {row.studentClass || '-'}
                        </span>
                      </td>
                      {/* 4. Tutar */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-emerald-600">₺{row.amount.toLocaleString('tr-TR')}</p>
                        <p className="text-xs text-slate-400">{row.paymentMethod}</p>
                      </td>
                      {/* 5. Taksit */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {row.installmentNo === 0 ? 'Peşinat' : `${row.installmentNo}. Taksit`}
                        </span>
                      </td>
                      {/* 6. İşlemler */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/students/${row.studentId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500"
                            title="Öğrenci Profili"
                          >
                            <Users size={16} />
                          </Link>
                          <Link
                            href={`/students/${row.studentId}/payments`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500"
                            title="Ödeme Detayları"
                          >
                            <CreditCard size={16} />
                          </Link>
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination - Öğrenci listesi ile aynı stil */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {filteredCollections.length} tahsilattan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCollections.length)} arası
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  İlk
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Son
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
