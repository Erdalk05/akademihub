'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
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
  RefreshCw,
  TrendingUp,
  Wallet,
  X,
  FileText,
  Filter,
  CalendarRange,
  Eye,
  Banknote,
  Building2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Target,
  DollarSign,
  GraduationCap,
  ChevronRight as ChevronRightIcon,
  Sparkles,
  Receipt,
  CircleDollarSign,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { usePermission } from '@/lib/hooks/usePermission';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Akademik Yıllar
const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'];

const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// Ödeme Yöntemleri
const PAYMENT_METHODS = [
  { id: 'all', label: 'Tümü', icon: Wallet, color: 'from-slate-500 to-slate-600' },
  { id: 'cash', label: 'Nakit', icon: Banknote, color: 'from-green-500 to-green-600' },
  { id: 'card', label: 'Kart', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
  { id: 'bank', label: 'Havale/EFT', icon: Building2, color: 'from-purple-500 to-purple-600' },
];

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
  const { canExportExcel, canCollectPayment, isAdmin } = usePermission();
  
  // Data
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Tarih Raporu Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'single' | 'range'>('single');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<CollectionRow[]>([]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const orgParam = currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
        const response = await fetch(`/api/installments${orgParam ? `?${orgParam}` : ''}`);
        const json = await response.json();
        const installments = json.data || [];
        
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
  }, [selectedYear, currentOrganization?.id]);

  // Unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = new Set(collections.map(c => c.studentClass).filter(Boolean));
    return Array.from(classes).sort();
  }, [collections]);

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

  // Filter by payment method
  const filteredByMethod = useMemo(() => {
    if (paymentMethodFilter === 'all') return filteredByPeriod;
    const methodMap: Record<string, string[]> = {
      'cash': ['Nakit', 'nakit', 'NAKIT', 'Cash'],
      'card': ['Kart', 'kart', 'KART', 'Card', 'Kredi Kartı'],
      'bank': ['Havale', 'EFT', 'Banka', 'havale', 'eft', 'banka', 'Havale/EFT'],
    };
    const validMethods = methodMap[paymentMethodFilter] || [];
    return filteredByPeriod.filter(c => validMethods.some(m => c.paymentMethod.includes(m)));
  }, [filteredByPeriod, paymentMethodFilter]);

  // Filter by class
  const filteredByClass = useMemo(() => {
    if (classFilter === 'all') return filteredByMethod;
    return filteredByMethod.filter(c => c.studentClass === classFilter);
  }, [filteredByMethod, classFilter]);

  // Filter by search
  const filteredCollections = useMemo(() => {
    if (!search) return filteredByClass;
    const term = search.toLowerCase();
    return filteredByClass.filter(c => 
      c.studentName.toLowerCase().includes(term) || 
      c.studentNo.toLowerCase().includes(term)
    );
  }, [filteredByClass, search]);

  // Stats - Rich statistics
  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const todayCollections = collections.filter(c => c.paidAt >= todayStart);
    const weekCollections = collections.filter(c => c.paidAt >= weekAgo);
    const monthCollections = collections.filter(c => c.paidAt >= monthAgo);
    
    const todayTotal = todayCollections.reduce((sum, c) => sum + c.amount, 0);
    const weekTotal = weekCollections.reduce((sum, c) => sum + c.amount, 0);
    const monthTotal = monthCollections.reduce((sum, c) => sum + c.amount, 0);
    const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);
    
    // Payment method breakdown
    const cashTotal = collections.filter(c => ['Nakit', 'nakit', 'Cash'].some(m => c.paymentMethod.includes(m))).reduce((sum, c) => sum + c.amount, 0);
    const cardTotal = collections.filter(c => ['Kart', 'kart', 'Card', 'Kredi'].some(m => c.paymentMethod.includes(m))).reduce((sum, c) => sum + c.amount, 0);
    const bankTotal = collections.filter(c => ['Havale', 'EFT', 'Banka'].some(m => c.paymentMethod.includes(m))).reduce((sum, c) => sum + c.amount, 0);
    
    // Yesterday comparison
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayCollections = collections.filter(c => c.paidAt >= yesterdayStart && c.paidAt < todayStart);
    const yesterdayTotal = yesterdayCollections.reduce((sum, c) => sum + c.amount, 0);
    const todayChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0;
    
    return {
      todayTotal,
      todayCount: todayCollections.length,
      weekTotal,
      weekCount: weekCollections.length,
      monthTotal,
      monthCount: monthCollections.length,
      totalCollected,
      totalCount: collections.length,
      cashTotal,
      cardTotal,
      bankTotal,
      todayChange,
      avgDaily: monthTotal / 30,
    };
  }, [collections]);

  // Pagination
  const totalPages = Math.ceil(filteredCollections.length / pageSize);
  const paginatedData = filteredCollections.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatMoney = (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatMoneyShort = (val: number) => {
    if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₺${(val / 1000).toFixed(0)}K`;
    return `₺${val.toLocaleString('tr-TR')}`;
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getPaymentMethodBadge = (method: string) => {
    if (['Nakit', 'nakit', 'Cash'].some(m => method.includes(m))) {
      return { bg: 'bg-green-100', text: 'text-green-700', icon: Banknote, label: 'Nakit' };
    }
    if (['Kart', 'kart', 'Card', 'Kredi'].some(m => method.includes(m))) {
      return { bg: 'bg-blue-100', text: 'text-blue-700', icon: CreditCard, label: 'Kart' };
    }
    if (['Havale', 'EFT', 'Banka'].some(m => method.includes(m))) {
      return { bg: 'bg-purple-100', text: 'text-purple-700', icon: Building2, label: 'Havale' };
    }
    return { bg: 'bg-slate-100', text: 'text-slate-700', icon: Wallet, label: method };
  };

  // Excel Export
  const handleExportExcel = useCallback(() => {
    if (filteredCollections.length === 0) {
      toast.error('Dışa aktarılacak veri yok');
      return;
    }

    const data = filteredCollections.map((row, idx) => ({
      '#': idx + 1,
      'Tarih': row.paidAt.toLocaleDateString('tr-TR'),
      'Saat': row.paidAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      'Öğrenci': row.studentName,
      'Öğrenci No': row.studentNo,
      'Sınıf': row.studentClass,
      'Tutar (₺)': row.amount,
      'Taksit': row.installmentNo === 0 ? 'Peşinat' : `${row.installmentNo}. Taksit`,
      'Ödeme Yöntemi': row.paymentMethod,
    }));

    // Add summary
    const totalAmount = filteredCollections.reduce((sum, c) => sum + c.amount, 0);
    data.push({
      '#': '',
      'Tarih': '',
      'Saat': '',
      'Öğrenci': 'TOPLAM',
      'Öğrenci No': '',
      'Sınıf': `${filteredCollections.length} Tahsilat`,
      'Tutar (₺)': totalAmount,
      'Taksit': '',
      'Ödeme Yöntemi': '',
    } as any);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Tahsilatlar');
    const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    XLSX.writeFile(wb, `Tahsilatlar_${today}.xlsx`);
    toast.success('Excel dosyası indirildi!');
  }, [filteredCollections]);

  // PDF Export
  const handleExportPDF = useCallback(async () => {
    if (reportData.length === 0) {
      toast.error('Önce verileri getirin');
      return;
    }
    
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Header
    doc.setFillColor(7, 94, 84);
    doc.rect(0, 0, 297, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Tahsilat Raporu', 148, 15, { align: 'center' });
    
    // Date info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    const dateText = reportType === 'single' 
      ? new Date(reportDate).toLocaleDateString('tr-TR')
      : `${new Date(reportStartDate).toLocaleDateString('tr-TR')} - ${new Date(reportEndDate).toLocaleDateString('tr-TR')}`;
    doc.text(`Tarih: ${dateText}`, 14, 35);
    
    const total = reportData.reduce((sum, r) => sum + r.amount, 0);
    doc.setFontSize(12);
    doc.setTextColor(7, 94, 84);
    doc.text(`Toplam: ${formatMoney(total)}`, 283, 35, { align: 'right' });
    doc.text(`${reportData.length} Tahsilat`, 283, 42, { align: 'right' });
    
    // Table
    const cleanText = (text: string): string => {
      return text
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    const headers = ['#', 'Tarih', 'Saat', 'Ogrenci', 'Sinif', 'Tutar', 'Taksit', 'Odeme Yontemi'];
    const tableData = reportData.map((r, i) => [
      i + 1,
      r.paidAt.toLocaleDateString('tr-TR'),
      r.paidAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      cleanText(r.studentName),
      r.studentClass || '-',
      formatMoney(r.amount),
      r.installmentNo === 0 ? 'Pesinat' : `${r.installmentNo}. Taksit`,
      cleanText(r.paymentMethod),
    ]);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 48,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [7, 94, 84], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 250, 245] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        5: { halign: 'right', fontStyle: 'bold' },
      },
    });

    doc.save(`Tahsilat_Raporu_${reportDate}.pdf`);
    toast.success('PDF indirildi!');
  }, [reportData, reportType, reportDate, reportStartDate, reportEndDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#E8F5E9]/30">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#1DB954] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: Title & Description */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Receipt size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Tahsilatlar</h1>
                  <p className="text-white/70 text-sm md:text-base">Ödeme takibi ve tahsilat yönetimi</p>
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Refresh */}
              <button
                onClick={() => window.location.reload()}
                className="p-2.5 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              
              {/* Academic Year */}
              <div className="relative">
                <button
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#075E54] rounded-xl font-medium hover:bg-white/90 transition shadow-lg"
                >
                  <Calendar size={16} />
                  {selectedYear}
                  <ChevronDown size={14} className={isYearOpen ? 'rotate-180 transition' : 'transition'} />
                </button>
                
                {isYearOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsYearOpen(false)} />
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-50">
                      {ACADEMIC_YEARS.map(year => (
                        <button
                          key={year}
                          onClick={() => { setSelectedYear(year); setIsYearOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#E8F5E9] transition ${
                            year === selectedYear ? 'text-[#075E54] font-bold bg-[#E8F5E9]' : 'text-slate-700'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Report Button */}
              <button 
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur rounded-xl font-medium hover:bg-white/30 transition"
              >
                <FileText size={16} />
                <span className="hidden sm:inline">Tarih Raporu</span>
              </button>

              {/* Excel Export */}
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#075E54] rounded-xl font-medium hover:bg-white/90 transition shadow-lg"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - 6 cards grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Today Collection */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#E8F5E9] hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <TrendingUp size={18} className="text-white" />
              </div>
              {stats.todayChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-bold ${stats.todayChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stats.todayChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  %{Math.abs(stats.todayChange).toFixed(0)}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-1">Bugün Tahsilat</p>
            <p className="text-xl font-bold text-[#075E54]">{formatMoneyShort(stats.todayTotal)}</p>
            <p className="text-xs text-slate-400">{stats.todayCount} işlem</p>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#E8F5E9] hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Calendar size={18} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-1">Bu Hafta</p>
            <p className="text-xl font-bold text-blue-600">{formatMoneyShort(stats.weekTotal)}</p>
            <p className="text-xs text-slate-400">{stats.weekCount} işlem</p>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#E8F5E9] hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart3 size={18} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-1">Bu Ay</p>
            <p className="text-xl font-bold text-purple-600">{formatMoneyShort(stats.monthTotal)}</p>
            <p className="text-xs text-slate-400">{stats.monthCount} işlem</p>
          </div>

          {/* Cash */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#E8F5E9] hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Banknote size={18} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-1">Nakit</p>
            <p className="text-xl font-bold text-green-600">{formatMoneyShort(stats.cashTotal)}</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${stats.totalCollected > 0 ? (stats.cashTotal / stats.totalCollected * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#E8F5E9] hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <CreditCard size={18} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-1">Kart</p>
            <p className="text-xl font-bold text-blue-600">{formatMoneyShort(stats.cardTotal)}</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${stats.totalCollected > 0 ? (stats.cardTotal / stats.totalCollected * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Bank */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#E8F5E9] hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Building2 size={18} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-1">Havale/EFT</p>
            <p className="text-xl font-bold text-purple-600">{formatMoneyShort(stats.bankTotal)}</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
              <div 
                className="h-full bg-purple-500 rounded-full" 
                style={{ width: `${stats.totalCollected > 0 ? (stats.bankTotal / stats.totalCollected * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* Payment Method Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {PAYMENT_METHODS.map((method) => {
            const isActive = paymentMethodFilter === method.id;
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => { setPaymentMethodFilter(method.id); setCurrentPage(1); }}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isActive 
                    ? 'border-[#075E54] bg-[#E8F5E9] shadow-lg' 
                    : 'border-slate-200 bg-white hover:border-[#128C7E]/50 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${method.color} shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${isActive ? 'text-[#075E54]' : 'text-slate-700'}`}>{method.label}</p>
                    <p className="text-xs text-slate-500">
                      {method.id === 'all' ? `${filteredByPeriod.length} işlem` : ''}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#075E54] rounded-full flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-[#E8F5E9] shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Öğrenci ara (ad, numara)..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none transition"
              />
            </div>
            
            {/* Period Filter */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              {[
                { value: 'today', label: 'Bugün' },
                { value: 'week', label: 'Hafta' },
                { value: 'month', label: 'Ay' },
                { value: 'all', label: 'Tümü' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setPeriodFilter(opt.value as any); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    periodFilter === opt.value
                      ? 'bg-[#075E54] text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Class Filter */}
            {uniqueClasses.length > 0 && (
              <select
                value={classFilter}
                onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none bg-white"
              >
                <option value="all">Tüm Sınıflar</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            )}
            
            {/* Count */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#E8F5E9] rounded-xl">
              <Receipt size={16} className="text-[#075E54]" />
              <span className="text-sm font-semibold text-[#075E54]">{filteredCollections.length} tahsilat</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E8F5E9] shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={32} className="animate-spin text-[#075E54]" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Receipt size={64} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Tahsilat bulunamadı</p>
              <p className="text-sm">Filtreleri değiştirmeyi deneyin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#075E54]/5 to-[#128C7E]/5 border-b border-[#E8F5E9]">
                    <th className="text-left px-5 py-4 text-xs font-bold text-[#075E54] uppercase tracking-wider">Tarih</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-[#075E54] uppercase tracking-wider">Öğrenci</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-[#075E54] uppercase tracking-wider">Sınıf</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-[#075E54] uppercase tracking-wider">Tutar</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-[#075E54] uppercase tracking-wider">Taksit</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-[#075E54] uppercase tracking-wider">Ödeme</th>
                    <th className="text-center px-5 py-4 text-xs font-bold text-[#075E54] uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F5E9]">
                  {paginatedData.map((row, idx) => {
                    const badge = getPaymentMethodBadge(row.paymentMethod);
                    const BadgeIcon = badge.icon;
                    return (
                      <tr 
                        key={row.id} 
                        className="hover:bg-[#E8F5E9]/30 transition cursor-pointer group"
                        onClick={() => router.push(`/students/${row.studentId}?tab=finance`)}
                      >
                        {/* Tarih */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                              <Calendar size={16} className="text-[#075E54]" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{row.paidAt.toLocaleDateString('tr-TR')}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {row.paidAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        {/* Öğrenci */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#075E54] to-[#128C7E] flex items-center justify-center text-white font-bold text-xs shadow-lg">
                              {getInitials(row.studentName)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-[#075E54] transition">{row.studentName}</p>
                              <p className="text-xs text-slate-500">{row.studentNo}</p>
                            </div>
                          </div>
                        </td>
                        
                        {/* Sınıf */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8F5E9] text-[#075E54]">
                            <GraduationCap size={12} />
                            {row.studentClass || '-'}
                          </span>
                        </td>
                        
                        {/* Tutar */}
                        <td className="px-5 py-4">
                          <p className="text-lg font-bold text-[#075E54]">{formatMoney(row.amount)}</p>
                        </td>
                        
                        {/* Taksit */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                            row.installmentNo === 0 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {row.installmentNo === 0 ? '💰 Peşinat' : `${row.installmentNo}. Taksit`}
                          </span>
                        </td>
                        
                        {/* Ödeme Yöntemi */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${badge.bg} ${badge.text}`}>
                            <BadgeIcon size={12} />
                            {badge.label}
                          </span>
                        </td>
                        
                        {/* İşlemler */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/students/${row.studentId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 hover:bg-[#E8F5E9] rounded-xl transition text-slate-500 hover:text-[#075E54]"
                              title="Öğrenci Profili"
                            >
                              <Users size={16} />
                            </Link>
                            <Link
                              href={`/students/${row.studentId}?tab=finance`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 hover:bg-[#E8F5E9] rounded-xl transition text-slate-500 hover:text-[#075E54]"
                              title="Finans Detayları"
                            >
                              <Wallet size={16} />
                            </Link>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 hover:bg-[#E8F5E9] rounded-xl transition text-slate-500 hover:text-[#075E54]"
                              title="Detay"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-[#E8F5E9] bg-gradient-to-r from-[#075E54]/5 to-[#128C7E]/5 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-slate-600">
                <strong className="text-[#075E54]">{filteredCollections.length}</strong> tahsilattan {' '}
                <strong>{(currentPage - 1) * pageSize + 1}</strong>-<strong>{Math.min(currentPage * pageSize, filteredCollections.length)}</strong> arası
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  İlk
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum 
                          ? 'bg-[#075E54] text-white shadow-lg' 
                          : 'border border-slate-200 hover:bg-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Son
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CalendarRange size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Tarih Bazlı Rapor</h2>
                  <p className="text-white/70 text-sm">Gelir raporu oluşturun</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Rapor Türü</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReportType('single')}
                    className={`p-4 rounded-2xl border-2 text-center transition ${
                      reportType === 'single'
                        ? 'border-[#075E54] bg-[#E8F5E9]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Calendar size={28} className={`mx-auto mb-2 ${reportType === 'single' ? 'text-[#075E54]' : 'text-slate-400'}`} />
                    <p className={`font-semibold ${reportType === 'single' ? 'text-[#075E54]' : 'text-slate-700'}`}>Tek Gün</p>
                    <p className="text-xs text-slate-500">Belirli bir gün</p>
                  </button>
                  <button
                    onClick={() => setReportType('range')}
                    className={`p-4 rounded-2xl border-2 text-center transition ${
                      reportType === 'range'
                        ? 'border-[#075E54] bg-[#E8F5E9]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CalendarRange size={28} className={`mx-auto mb-2 ${reportType === 'range' ? 'text-[#075E54]' : 'text-slate-400'}`} />
                    <p className={`font-semibold ${reportType === 'range' ? 'text-[#075E54]' : 'text-slate-700'}`}>Tarih Aralığı</p>
                    <p className="text-xs text-slate-500">İki tarih arası</p>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              {reportType === 'single' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tarih Seçin</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none text-lg"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Başlangıç</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Bitiş</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Fetch Button */}
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
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white rounded-xl font-semibold hover:opacity-90 transition shadow-lg"
              >
                <Filter size={18} />
                Verileri Getir
              </button>

              {/* Results */}
              {reportData.length > 0 ? (
                <div className="bg-[#E8F5E9] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Receipt size={18} className="text-[#075E54]" />
                      <span className="font-semibold text-[#075E54]">{reportData.length} Tahsilat</span>
                    </div>
                    <p className="text-xl font-bold text-[#075E54]">
                      {formatMoney(reportData.reduce((sum, r) => sum + r.amount, 0))}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {reportData.slice(0, 8).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-white rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#075E54] to-[#128C7E] flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(r.studentName)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{r.studentName}</p>
                            <p className="text-xs text-slate-500">{r.paidAt.toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                        <p className="font-bold text-[#075E54]">{formatMoney(r.amount)}</p>
                      </div>
                    ))}
                    {reportData.length > 8 && (
                      <p className="text-center text-xs text-slate-500 py-2">+{reportData.length - 8} tahsilat daha...</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <CalendarRange size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Tarih seçip "Verileri Getir" butonuna tıklayın</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition"
              >
                Kapat
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white rounded-xl font-semibold hover:opacity-90 transition shadow-lg"
              >
                <Download size={18} />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
