'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, CheckCircle, BarChart3, X, Wallet, Building, Wrench, FileText, 
  Users, Zap, ShoppingBag, Briefcase, Receipt, TrendingDown, Download, RefreshCw,
  Calendar, ChevronDown, ChevronLeft, ChevronRight, Filter, CalendarRange,
  Eye, Banknote, CreditCard, Clock, ArrowUpRight, ArrowDownRight, PieChart,
  Target, DollarSign, Sparkles, CircleDollarSign, AlertCircle, TrendingUp,
  Settings, Trash2, Edit3, MoreHorizontal, Check, Tag
} from 'lucide-react';
import { ExpenseStatusEnum, ExpenseTypeEnum } from '@/types/finance.types';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { usePermission } from '@/lib/hooks/usePermission';
import AdminPasswordModal from '@/components/ui/AdminPasswordModal';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Kategori İkonları ve Renkleri
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  [ExpenseTypeEnum.PAYROLL]: { icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-100', label: 'Maaş/Bordro' },
  [ExpenseTypeEnum.RENT]: { icon: Building, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-100', label: 'Kira' },
  [ExpenseTypeEnum.UTILITIES]: { icon: Zap, color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-100', label: 'Faturalar' },
  [ExpenseTypeEnum.MATERIALS]: { icon: ShoppingBag, color: 'from-green-500 to-green-600', bg: 'bg-green-100', label: 'Malzeme' },
  [ExpenseTypeEnum.MAINTENANCE]: { icon: Wrench, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-100', label: 'Bakım' },
  [ExpenseTypeEnum.ADMIN]: { icon: Briefcase, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-100', label: 'İdari' },
  [ExpenseTypeEnum.EQUIPMENT]: { icon: Settings, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-100', label: 'Ekipman' },
  [ExpenseTypeEnum.OTHER]: { icon: Receipt, color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100', label: 'Diğer' },
};

type ExpenseRow = {
  id: string;
  title: string;
  category: ExpenseTypeEnum | string;
  amount: number;
  status: ExpenseStatusEnum | string;
  date: string;
  expense_date?: string;
  description?: string | null;
  payment_method?: string;
};

export default function ExpenseManagementPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  const { canAddExpense, canEditExpense, canDeleteExpense, isAdmin } = usePermission();
  
  // Data
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Create Form
  const [createLoading, setCreateLoading] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState<string>('');
  const [createCustomCategory, setCreateCustomCategory] = useState('');
  const [createAmount, setCreateAmount] = useState('');
  const [createDate, setCreateDate] = useState(new Date().toISOString().split('T')[0]);
  const [createDescription, setCreateDescription] = useState('');
  const [createPaymentMethod, setCreatePaymentMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  
  // Edit Form
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Report Modal
  const [reportType, setReportType] = useState<'single' | 'range'>('single');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ExpenseRow[]>([]);

  // Fetch Data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const orgParam = currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
        const res = await fetch(`/api/finance/expenses${orgParam ? `?${orgParam}` : ''}`, { cache: 'no-store' });
        const js = await res.json();
        setExpenses(js.data || []);
        
        // Extract custom categories
        const allCategories = (js.data || []).map((e: ExpenseRow) => e.category);
        const customCats = allCategories.filter((c: string) => !Object.keys(CATEGORY_CONFIG).includes(c));
        setCustomCategories([...new Set(customCats)] as string[]);
      } catch {
        toast.error('Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentOrganization?.id]);

  // Filter by period
  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (periodFilter === 'all') return true;
      if (periodFilter === 'today') return d >= today;
      if (periodFilter === 'week') return d >= weekAgo;
      if (periodFilter === 'month') return d >= monthAgo;
      if (periodFilter === 'year') return d >= yearAgo;
      return true;
    });
  }, [expenses, periodFilter]);

  // Filter by category, status, payment method, search
  const filteredExpenses = useMemo(() => {
    let result = [...filteredByPeriod];
    
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }
    if (paymentMethodFilter !== 'all') {
      result = result.filter(e => e.payment_method === paymentMethodFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        (e.description || '').toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortOrder === 'desc' ? db - da : da - db;
      }
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });
    
    return result;
  }, [filteredByPeriod, categoryFilter, statusFilter, paymentMethodFilter, searchQuery, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    
    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    let pendingTotal = 0;
    let paidTotal = 0;
    const byCategory: Record<string, number> = {};
    const byPaymentMethod: Record<string, number> = {};
    
    expenses.forEach(e => {
      const d = new Date(e.date);
      const amount = Number(e.amount || 0);
      
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        thisMonthTotal += amount;
      }
      if (d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear()) {
        lastMonthTotal += amount;
      }
      
      if (e.status === ExpenseStatusEnum.PENDING) pendingTotal += amount;
      if (e.status === ExpenseStatusEnum.PAID) paidTotal += amount;
      
      byCategory[e.category] = (byCategory[e.category] || 0) + amount;
      if (e.payment_method) {
        byPaymentMethod[e.payment_method] = (byPaymentMethod[e.payment_method] || 0) + amount;
      }
    });
    
    const monthChange = lastMonthTotal > 0 
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) 
      : 0;
    
    // Top category
    let topCategory = { name: '-', amount: 0 };
    Object.entries(byCategory).forEach(([cat, amount]) => {
      if (amount > topCategory.amount) {
        topCategory = { name: cat, amount };
      }
    });
    
    return {
      thisMonthTotal,
      lastMonthTotal,
      monthChange,
      pendingTotal,
      paidTotal,
      totalCount: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
      byCategory,
      byPaymentMethod,
      topCategory,
      cashTotal: byPaymentMethod['cash'] || 0,
      cardTotal: byPaymentMethod['card'] || 0,
      bankTotal: byPaymentMethod['bank'] || 0,
    };
  }, [expenses]);

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / pageSize);
  const paginatedData = filteredExpenses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Helpers
  const formatMoney = (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  const formatMoneyShort = (val: number) => {
    if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₺${(val / 1000).toFixed(0)}K`;
    return `₺${val.toLocaleString('tr-TR')}`;
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || { 
      icon: Tag, 
      color: 'from-slate-500 to-slate-600', 
      bg: 'bg-slate-100', 
      label: category 
    };
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      [ExpenseStatusEnum.PAID]: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ödendi ✓' },
      [ExpenseStatusEnum.PENDING]: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Bekliyor' },
      [ExpenseStatusEnum.CANCELLED]: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'İptal' },
      [ExpenseStatusEnum.APPROVED]: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Onaylandı' },
      [ExpenseStatusEnum.REJECTED]: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Reddedildi' },
    };
    return configs[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  };

  const getPaymentMethodBadge = (method: string) => {
    const configs: Record<string, { icon: any; bg: string; text: string; label: string }> = {
      'cash': { icon: Banknote, bg: 'bg-green-100', text: 'text-green-700', label: 'Nakit' },
      'card': { icon: CreditCard, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Kart' },
      'bank': { icon: Building, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Havale' },
    };
    return configs[method] || { icon: Wallet, bg: 'bg-gray-100', text: 'text-gray-700', label: method || '-' };
  };

  // Create Handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const finalCategory = createCategory === 'custom' ? createCustomCategory : createCategory;
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          category: finalCategory || 'other',
          amount: Number(createAmount || 0),
          date: createDate,
          description: createDescription || null,
          organization_id: currentOrganization?.id || null,
          payment_method: createPaymentMethod,
        }),
      });
      const js = await res.json();
      if (!res.ok || !js?.success) {
        toast.error(js?.error || 'Gider oluşturulamadı');
        return;
      }
      setExpenses(prev => [js.data, ...prev]);
      if (createCategory === 'custom' && createCustomCategory) {
        setCustomCategories(prev => [...new Set([...prev, createCustomCategory])]);
      }
      setIsCreateOpen(false);
      resetCreateForm();
      toast.success('Gider başarıyla eklendi!');
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateTitle('');
    setCreateCategory('');
    setCreateCustomCategory('');
    setCreateAmount('');
    setCreateDate(new Date().toISOString().split('T')[0]);
    setCreateDescription('');
    setCreatePaymentMethod('cash');
  };

  // Edit Handler
  const openEdit = (expense: ExpenseRow) => {
    setEditId(expense.id);
    setEditTitle(expense.title);
    setEditCategory(expense.category);
    setEditAmount(String(expense.amount));
    setEditDate(expense.date ? new Date(expense.date).toISOString().slice(0, 10) : '');
    setEditDescription(expense.description || '');
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditLoading(true);
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId,
          title: editTitle,
          category: editCategory,
          amount: Number(editAmount || 0),
          date: editDate,
          description: editDescription,
        }),
      });
      const js = await res.json();
      if (!res.ok || !js?.success) {
        toast.error(js?.error || 'Güncellenemedi');
        return;
      }
      setExpenses(prev => prev.map(e => e.id === editId ? js.data : e));
      setIsEditOpen(false);
      toast.success('Gider güncellendi!');
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/finance/expenses?id=${deleteId}`, { method: 'DELETE' });
      const js = await res.json();
      if (!res.ok || !js?.success) {
        toast.error(js?.error || 'Silinemedi');
        return;
      }
      setExpenses(prev => prev.filter(e => e.id !== deleteId));
      setDeleteId(null);
      toast.success('Gider silindi!');
    } catch {
      toast.error('Bağlantı hatası');
    }
  };

  // Excel Export
  const handleExportExcel = useCallback(() => {
    if (filteredExpenses.length === 0) {
      toast.error('Dışa aktarılacak veri yok');
      return;
    }
    const data = filteredExpenses.map((e, idx) => ({
      '#': idx + 1,
      'Tarih': new Date(e.date).toLocaleDateString('tr-TR'),
      'Başlık': e.title,
      'Kategori': getCategoryConfig(e.category).label,
      'Tutar (₺)': e.amount,
      'Durum': getStatusBadge(e.status).label,
      'Ödeme': e.payment_method || '-',
      'Açıklama': e.description || '-',
    }));
    data.push({
      '#': '',
      'Tarih': '',
      'Başlık': 'TOPLAM',
      'Kategori': `${filteredExpenses.length} Gider`,
      'Tutar (₺)': filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
      'Durum': '',
      'Ödeme': '',
      'Açıklama': '',
    } as any);
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Giderler');
    XLSX.writeFile(wb, `Giderler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`);
    toast.success('Excel indirildi!');
  }, [filteredExpenses]);

  // PDF Export
  const handleExportPDF = useCallback(async () => {
    const dataToExport = reportData.length > 0 ? reportData : filteredExpenses;
    if (dataToExport.length === 0) {
      toast.error('Dışa aktarılacak veri yok');
      return;
    }
    
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Header
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 297, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Gider Raporu', 148, 15, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 35);
    
    const total = dataToExport.reduce((sum, e) => sum + e.amount, 0);
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text(`Toplam: ${formatMoney(total)}`, 283, 35, { align: 'right' });
    doc.text(`${dataToExport.length} Gider`, 283, 42, { align: 'right' });
    
    const cleanText = (text: string): string => {
      return text
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    const headers = ['#', 'Tarih', 'Baslik', 'Kategori', 'Tutar', 'Durum'];
    const tableData = dataToExport.map((e, i) => [
      i + 1,
      new Date(e.date).toLocaleDateString('tr-TR'),
      cleanText(e.title.slice(0, 40)),
      cleanText(getCategoryConfig(e.category).label),
      formatMoney(e.amount),
      cleanText(getStatusBadge(e.status).label),
    ]);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 48,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 4: { halign: 'right', fontStyle: 'bold' } },
    });

    doc.save(`Gider_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`);
    toast.success('PDF indirildi!');
  }, [filteredExpenses, reportData]);

  // All unique categories (predefined + custom)
  const allCategories = useMemo(() => {
    const predefined = Object.keys(CATEGORY_CONFIG);
    return [...predefined, ...customCategories];
  }, [customCategories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <TrendingDown size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Gider Yönetimi</h1>
                  <p className="text-white/70 text-sm md:text-base">
                    {stats.totalCount} kayıt • Toplam: {formatMoney(stats.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="p-2.5 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              
              <button
                onClick={() => router.push('/finance/expenses/analytics')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur rounded-xl font-medium hover:bg-white/30 transition"
              >
                <BarChart3 size={16} />
                <span className="hidden sm:inline">Grafikler</span>
              </button>
              
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur rounded-xl font-medium hover:bg-white/30 transition"
              >
                <FileText size={16} />
                <span className="hidden sm:inline">Rapor</span>
              </button>
              
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-rose-600 rounded-xl font-medium hover:bg-white/90 transition shadow-lg"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Excel</span>
              </button>
              
              {canAddExpense && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 rounded-xl font-bold hover:bg-white/90 transition shadow-lg"
                >
                  <Plus size={18} />
                  Yeni Gider
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* This Month */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-rose-100 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                <TrendingDown size={18} className="text-white" />
              </div>
              {stats.monthChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-bold ${stats.monthChange < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.monthChange < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  %{Math.abs(stats.monthChange).toFixed(0)}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-1">Bu Ay</p>
            <p className="text-xl font-bold text-rose-600">{formatMoneyShort(stats.thisMonthTotal)}</p>
          </div>

          {/* Last Month */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-rose-100 hover:shadow-xl transition">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-2">
              <Calendar size={18} className="text-white" />
            </div>
            <p className="text-xs text-slate-500 mb-1">Geçen Ay</p>
            <p className="text-xl font-bold text-orange-600">{formatMoneyShort(stats.lastMonthTotal)}</p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-amber-100 hover:shadow-xl transition">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-2">
              <Clock size={18} className="text-white" />
            </div>
            <p className="text-xs text-slate-500 mb-1">Bekleyen</p>
            <p className="text-xl font-bold text-amber-600">{formatMoneyShort(stats.pendingTotal)}</p>
          </div>

          {/* Cash */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-green-100 hover:shadow-xl transition">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 mb-2">
              <Banknote size={18} className="text-white" />
            </div>
            <p className="text-xs text-slate-500 mb-1">Nakit</p>
            <p className="text-xl font-bold text-green-600">{formatMoneyShort(stats.cashTotal)}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-100 hover:shadow-xl transition">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-2">
              <CreditCard size={18} className="text-white" />
            </div>
            <p className="text-xs text-slate-500 mb-1">Kart</p>
            <p className="text-xl font-bold text-blue-600">{formatMoneyShort(stats.cardTotal)}</p>
          </div>

          {/* Top Category */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100 hover:shadow-xl transition">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-2">
              <PieChart size={18} className="text-white" />
            </div>
            <p className="text-xs text-slate-500 mb-1">En Çok</p>
            <p className="text-sm font-bold text-purple-600 truncate">{getCategoryConfig(stats.topCategory.name).label}</p>
            <p className="text-xs text-slate-400">{formatMoneyShort(stats.topCategory.amount)}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
          <button
            onClick={() => { setCategoryFilter('all'); setCurrentPage(1); }}
            className={`p-3 rounded-xl border-2 transition-all text-center ${
              categoryFilter === 'all' 
                ? 'border-rose-500 bg-rose-50' 
                : 'border-slate-200 bg-white hover:border-rose-300'
            }`}
          >
            <Receipt size={20} className={`mx-auto mb-1 ${categoryFilter === 'all' ? 'text-rose-600' : 'text-slate-400'}`} />
            <p className={`text-xs font-medium ${categoryFilter === 'all' ? 'text-rose-600' : 'text-slate-600'}`}>Tümü</p>
          </button>
          
          {Object.entries(CATEGORY_CONFIG).slice(0, 7).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = categoryFilter === key;
            const amount = stats.byCategory[key] || 0;
            return (
              <button
                key={key}
                onClick={() => { setCategoryFilter(key); setCurrentPage(1); }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  isActive 
                    ? 'border-rose-500 bg-rose-50' 
                    : 'border-slate-200 bg-white hover:border-rose-300'
                }`}
              >
                <div className={`w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                  <Icon size={14} className="text-white" />
                </div>
                <p className={`text-xs font-medium truncate ${isActive ? 'text-rose-600' : 'text-slate-600'}`}>{config.label}</p>
                {amount > 0 && <p className="text-[10px] text-slate-400">{formatMoneyShort(amount)}</p>}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Gider ara..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>
            
            {/* Period */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              {[
                { value: 'today', label: 'Bugün' },
                { value: 'week', label: 'Hafta' },
                { value: 'month', label: 'Ay' },
                { value: 'year', label: 'Yıl' },
                { value: 'all', label: 'Tümü' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setPeriodFilter(opt.value as any); setCurrentPage(1); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                    periodFilter === opt.value
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white"
            >
              <option value="all">Tüm Durumlar</option>
              <option value={ExpenseStatusEnum.PAID}>Ödendi</option>
              <option value={ExpenseStatusEnum.PENDING}>Bekliyor</option>
              <option value={ExpenseStatusEnum.CANCELLED}>İptal</option>
            </select>

            {/* Count */}
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-xl">
              <Receipt size={16} className="text-rose-600" />
              <span className="text-sm font-semibold text-rose-600">{filteredExpenses.length} gider</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={32} className="animate-spin text-rose-600" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Receipt size={64} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Gider bulunamadı</p>
              <p className="text-sm">Filtreleri değiştirmeyi deneyin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-100">
                    <th className="text-left px-5 py-4 text-xs font-bold text-rose-700 uppercase">Tarih</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-rose-700 uppercase">Gider</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-rose-700 uppercase">Kategori</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-rose-700 uppercase">Tutar</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-rose-700 uppercase">Durum</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-rose-700 uppercase">Ödeme</th>
                    <th className="text-center px-5 py-4 text-xs font-bold text-rose-700 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {paginatedData.map((expense) => {
                    const catConfig = getCategoryConfig(expense.category);
                    const CatIcon = catConfig.icon;
                    const statusBadge = getStatusBadge(expense.status);
                    const paymentBadge = getPaymentMethodBadge(expense.payment_method || '');
                    const PayIcon = paymentBadge.icon;
                    
                    return (
                      <tr key={expense.id} className="hover:bg-rose-50/30 transition group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                              <Calendar size={16} className="text-rose-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{new Date(expense.date).toLocaleDateString('tr-TR')}</p>
                              <p className="text-xs text-slate-400">{new Date(expense.date).toLocaleDateString('tr-TR', { weekday: 'short' })}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{expense.title}</p>
                          {expense.description && (
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{expense.description}</p>
                          )}
                        </td>
                        
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${catConfig.bg}`}>
                            <CatIcon size={12} />
                            {catConfig.label}
                          </span>
                        </td>
                        
                        <td className="px-5 py-4">
                          <p className="text-lg font-bold text-rose-600">{formatMoney(expense.amount)}</p>
                        </td>
                        
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${paymentBadge.bg} ${paymentBadge.text}`}>
                            <PayIcon size={12} />
                            {paymentBadge.label}
                          </span>
                        </td>
                        
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {canEditExpense && (
                              <button
                                onClick={() => openEdit(expense)}
                                className="p-2 hover:bg-rose-100 rounded-xl transition text-slate-500 hover:text-rose-600"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                            {canDeleteExpense && isAdmin && (
                              <button
                                onClick={() => setDeleteId(expense.id)}
                                className="p-2 hover:bg-rose-100 rounded-xl transition text-slate-500 hover:text-rose-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
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
            <div className="border-t border-rose-100 bg-rose-50/50 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-slate-600">
                <strong className="text-rose-600">{filteredExpenses.length}</strong> giderden{' '}
                <strong>{(currentPage - 1) * pageSize + 1}</strong>-<strong>{Math.min(currentPage * pageSize, filteredExpenses.length)}</strong>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
                >
                  İlk
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium">{currentPage}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
                >
                  Son
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-orange-500 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingDown size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Yeni Gider Ekle</h2>
                  <p className="text-white/70 text-sm">Kasadan çıkış kaydı</p>
                </div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                <X size={20} className="text-white" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Kategori</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCreateCategory(key)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${
                          createCategory === key ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                          <Icon size={14} className="text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-600">{config.label}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCreateCategory('custom')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${
                      createCategory === 'custom' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <Plus size={14} className="text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600">Özel</span>
                  </button>
                </div>
                {createCategory === 'custom' && (
                  <input
                    type="text"
                    placeholder="Kategori adı..."
                    value={createCustomCategory}
                    onChange={(e) => setCreateCustomCategory(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                )}
              </div>

              {/* Title & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Başlık *</label>
                  <input
                    type="text"
                    required
                    placeholder="Gider açıklaması"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tutar (₺) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₺</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={createAmount}
                      onChange={(e) => setCreateAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tarih</label>
                  <input
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ödeme</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'cash', label: '💵 Nakit' },
                      { value: 'card', label: '💳 Kart' },
                      { value: 'bank', label: '🏦 Banka' },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setCreatePaymentMethod(m.value as any)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                          createPaymentMethod === m.value
                            ? 'bg-rose-100 text-rose-700 border-2 border-rose-500'
                            : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Açıklama</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={2}
                  placeholder="Ek notlar..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none"
                />
              </div>

              {/* Summary */}
              {createAmount && Number(createAmount) > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-rose-700">Kasadan Çıkacak:</span>
                    <span className="text-xl font-bold text-rose-700">-₺{Number(createAmount).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !createTitle || !createAmount || !createCategory}
                  className="flex-[2] px-4 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
                >
                  {createLoading ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Wallet size={18} />
                      Gideri Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-orange-500 p-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Gideri Düzenle</h2>
              <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                <X size={20} className="text-white" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Başlık</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Kategori</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryConfig(cat).label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tutar</label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tarih</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Açıklama</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 px-4 py-3 border border-slate-300 rounded-xl">
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-[2] px-4 py-3 bg-rose-600 text-white rounded-xl font-bold disabled:opacity-60"
                >
                  {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-orange-500 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CalendarRange size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Gider Raporu</h2>
                  <p className="text-white/70 text-sm">Tarih bazlı rapor oluşturun</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setReportType('single')}
                  className={`p-4 rounded-2xl border-2 text-center transition ${
                    reportType === 'single' ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
                  }`}
                >
                  <Calendar size={28} className={`mx-auto mb-2 ${reportType === 'single' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <p className="font-semibold">Tek Gün</p>
                </button>
                <button
                  onClick={() => setReportType('range')}
                  className={`p-4 rounded-2xl border-2 text-center transition ${
                    reportType === 'range' ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
                  }`}
                >
                  <CalendarRange size={28} className={`mx-auto mb-2 ${reportType === 'range' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <p className="font-semibold">Tarih Aralığı</p>
                </button>
              </div>

              {reportType === 'single' ? (
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="px-4 py-3 border border-slate-200 rounded-xl" />
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="px-4 py-3 border border-slate-200 rounded-xl" />
                </div>
              )}

              <button
                onClick={() => {
                  let filtered: ExpenseRow[] = [];
                  if (reportType === 'single') {
                    const target = new Date(reportDate).toDateString();
                    filtered = expenses.filter(e => new Date(e.date).toDateString() === target);
                  } else {
                    const start = new Date(reportStartDate);
                    const end = new Date(reportEndDate);
                    end.setHours(23, 59, 59, 999);
                    filtered = expenses.filter(e => {
                      const d = new Date(e.date);
                      return d >= start && d <= end;
                    });
                  }
                  setReportData(filtered);
                  toast.success(`${filtered.length} gider bulundu`);
                }}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-500 text-white rounded-xl font-semibold"
              >
                <Filter size={18} className="inline mr-2" />
                Verileri Getir
              </button>

              {reportData.length > 0 && (
                <div className="bg-rose-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-rose-700">{reportData.length} Gider</span>
                    <span className="text-xl font-bold text-rose-700">
                      {formatMoney(reportData.reduce((sum, e) => sum + e.amount, 0))}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {reportData.slice(0, 5).map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-white rounded-xl p-2">
                        <span className="truncate">{e.title}</span>
                        <span className="font-bold text-rose-600">{formatMoney(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-5 border-t bg-slate-50">
              <button onClick={() => setShowReportModal(false)} className="px-5 py-2.5 text-slate-600">Kapat</button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold"
              >
                <Download size={18} />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <AdminPasswordModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Gider Silme"
        description="Bu gideri silmek istediğinizden emin misiniz?"
        confirmText="Sil"
        isDanger
      />
    </div>
  );
}
