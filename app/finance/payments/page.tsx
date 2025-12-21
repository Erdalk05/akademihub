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
  Wallet,
  X,
  FileText,
  Filter,
  CalendarRange
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { usePermission } from '@/lib/hooks/usePermission';
import toast from 'react-hot-toast';

// Akademik Yıllar
const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'];

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
  const { currentOrganization } = useOrganizationStore();
  const { canExportExcel, canCollectPayment } = usePermission();
  
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

  // Tarih Raporu Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'single' | 'range'>('single');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<CollectionRow[]>([]);

  // Fetch Data - ✅ TEK API ÇAĞRISI (JOIN ile öğrenci bilgisi geliyor)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const orgParam = currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
        const response = await fetch(`/api/installments${orgParam ? `?${orgParam}` : ''}`);
        const json = await response.json();
        const installments = json.data || [];
        
        // Filter only paid installments - öğrenci bilgisi zaten JOIN ile geldi
        const paidInstallments = installments
          .filter((i: any) => i.is_paid && i.paid_at)
          .map((i: any) => ({
            id: i.id,
            studentId: i.student_id,
            studentName: i.studentName || 'Bilinmeyen',
            studentNo: i.studentNo || '-',
            studentClass: i.studentClass || '-',
            amount: Number(i.amount) || 0,
            paidAt: new Date(i.paid_at),
            installmentNo: i.installment_no || 0,
            paymentMethod: i.payment_method || 'Nakit',
          }))
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
            
            {/* Tarih Raporu */}
            <button 
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              <FileText size={16} />
              Tarih Raporu
            </button>

            {/* Excel Export */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition">
              <Download size={16} />
              Excel
            </button>
          </div>
        </div>

        {/* Tarih Bazlı Rapor Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Tarih Bazlı Gelir/Gider Raporu</h2>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
                {/* Rapor Türü */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rapor Türü</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setReportType('single')}
                      className={`p-4 rounded-xl border-2 text-center transition ${
                        reportType === 'single'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <CalendarRange size={24} className="mx-auto mb-2" />
                      <p className="font-medium">Tek Gün</p>
                      <p className="text-xs text-slate-500">Belirli bir günün raporu</p>
                    </button>
                    <button
                      onClick={() => setReportType('range')}
                      className={`p-4 rounded-xl border-2 text-center transition ${
                        reportType === 'range'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <CalendarRange size={24} className="mx-auto mb-2" />
                      <p className="font-medium">Tarih Aralığı</p>
                      <p className="text-xs text-slate-500">İki tarih arası rapor</p>
                    </button>
                  </div>
                </div>

                {/* Tarih Seçimi */}
                {reportType === 'single' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tarih Seçin</label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Başlangıç</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Bitiş</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Verileri Getir Butonu */}
                <button
                  onClick={() => {
                    let filtered: CollectionRow[] = [];
                    if (reportType === 'single') {
                      const targetDate = new Date(reportDate).toDateString();
                      filtered = collections.filter(c => c.paidAt.toDateString() === targetDate);
                    } else {
                      const start = new Date(reportStartDate);
                      const end = new Date(reportEndDate);
                      end.setHours(23, 59, 59, 999);
                      filtered = collections.filter(c => c.paidAt >= start && c.paidAt <= end);
                    }
                    setReportData(filtered);
                    toast.success(`${filtered.length} tahsilat bulundu`);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition"
                >
                  <Filter size={18} />
                  Verileri Getir
                </button>

                {/* Sonuçlar */}
                {reportData.length > 0 ? (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-slate-700">{reportData.length} Tahsilat</p>
                      <p className="font-bold text-emerald-600">
                        ₺{reportData.reduce((sum, r) => sum + r.amount, 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {reportData.slice(0, 10).map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                          <div>
                            <p className="font-medium text-slate-900">{r.studentName}</p>
                            <p className="text-xs text-slate-500">{r.paidAt.toLocaleDateString('tr-TR')}</p>
                          </div>
                          <p className="font-bold text-emerald-600">₺{r.amount.toLocaleString('tr-TR')}</p>
                        </div>
                      ))}
                      {reportData.length > 10 && (
                        <p className="text-center text-xs text-slate-400">+{reportData.length - 10} tahsilat daha...</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FileText size={40} className="mx-auto mb-2 opacity-50" />
                    <p>Yukarıdan tarih seçip &quot;Verileri Getir&quot; butonuna tıklayın.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition"
                >
                  Kapat
                </button>
                <button
                  onClick={async () => {
                    if (reportData.length === 0) {
                      toast.error('Önce verileri getirin');
                      return;
                    }
                    const { jsPDF } = await import('jspdf');
                    const doc = new jsPDF('p', 'mm', 'a4');
                    
                    // Başlık
                    doc.setFontSize(16);
                    doc.text('Tahsilat Raporu', 105, 20, { align: 'center' });
                    doc.setFontSize(10);
                    const dateText = reportType === 'single' 
                      ? new Date(reportDate).toLocaleDateString('tr-TR')
                      : `${new Date(reportStartDate).toLocaleDateString('tr-TR')} - ${new Date(reportEndDate).toLocaleDateString('tr-TR')}`;
                    doc.text(dateText, 105, 28, { align: 'center' });
                    
                    // Toplam
                    const total = reportData.reduce((sum, r) => sum + r.amount, 0);
                    doc.setFontSize(12);
                    doc.text(`Toplam: ${total.toLocaleString('tr-TR')} TL`, 105, 38, { align: 'center' });
                    
                    // Tablo başlıkları
                    let y = 50;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Tarih', 15, y);
                    doc.text('Ogrenci', 40, y);
                    doc.text('Sinif', 100, y);
                    doc.text('Tutar', 120, y);
                    doc.text('Taksit', 150, y);
                    
                    doc.setFont('helvetica', 'normal');
                    y += 8;
                    
                    reportData.forEach((r) => {
                      if (y > 270) {
                        doc.addPage();
                        y = 20;
                      }
                      doc.text(r.paidAt.toLocaleDateString('tr-TR'), 15, y);
                      doc.text(r.studentName.slice(0, 25), 40, y);
                      doc.text(r.studentClass || '-', 100, y);
                      doc.text(`${r.amount.toLocaleString('tr-TR')} TL`, 120, y);
                      doc.text(`${r.installmentNo}. Taksit`, 150, y);
                      y += 6;
                    });
                    
                    doc.save(`tahsilat-raporu-${reportDate}.pdf`);
                    toast.success('PDF indirildi');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
                >
                  <Download size={18} />
                  PDF İndir
                </button>
              </div>
            </div>
          </div>
        )}

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
                            href={`/students/${row.studentId}?tab=finance`}
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
