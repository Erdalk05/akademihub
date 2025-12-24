'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Wallet,
  X,
  FileText,
  Filter,
  CalendarRange,
  Plus,
  Book,
  Shirt,
  UtensilsCrossed,
  Pencil,
  Package,
  Trash2,
  Check,
  Receipt,
  GraduationCap,
  User,
  Minus,
  ArrowRight,
  BarChart3,
  Eye,
  CreditCard,
  Banknote,
  Building2,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { usePermission } from '@/lib/hooks/usePermission';
import { AdminPasswordModal } from '@/components/ui/AdminPasswordModal';

// Kategoriler
const CATEGORIES = [
  { id: 'all', label: 'Tümü', icon: Package, color: 'bg-slate-500', lightColor: 'bg-slate-100', textColor: 'text-slate-600' },
  { id: 'book', label: 'Kitap', icon: Book, color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-600' },
  { id: 'uniform', label: 'Üniforma', icon: Shirt, color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-600' },
  { id: 'meal', label: 'Yemek', icon: UtensilsCrossed, color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-600' },
  { id: 'stationery', label: 'Kırtasiye', icon: Pencil, color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-600' },
  { id: 'other', label: 'Diğer', icon: Package, color: 'bg-gray-500', lightColor: 'bg-gray-100', textColor: 'text-gray-600' },
];

type OtherIncomeRow = {
  id: string;
  studentId: string | null;
  studentName: string;
  studentClass: string | null;
  title: string;
  category: string;
  amount: number;
  paidAmount: number;
  isPaid: boolean;
  dueDate: Date | null;
  paidAt: Date | null;
  date: Date;
  paymentType: string;
  notes: string | null;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  class?: string;
  student_no?: string;
};

export default function OtherIncomePage() {
  const { currentOrganization } = useOrganizationStore();
  const { canAddInstallment, canDeleteInstallment, canExportExcel, isAdmin } = usePermission();
  
  // Data
  const [incomes, setIncomes] = useState<OtherIncomeRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<OtherIncomeRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Öğrenci Arama
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form States
  const [formCategory, setFormCategory] = useState('book');
  const [formTitle, setFormTitle] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formDownPayment, setFormDownPayment] = useState('0');
  const [formDownPaymentDate, setFormDownPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formInstallmentCount, setFormInstallmentCount] = useState(1);
  const [formFirstDueDate, setFormFirstDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [formPeriod, setFormPeriod] = useState<'monthly' | 'bimonthly' | 'weekly' | 'custom'>('monthly');
  const [saving, setSaving] = useState(false);

  // Rapor States
  const [reportType, setReportType] = useState<'single' | 'range'>('single');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<OtherIncomeRow[]>([]);

  // Silme States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'group'; id?: string; studentId?: string; category?: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, [currentOrganization?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const orgParam = currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
      const res = await fetch(`/api/finance/other-income${orgParam ? `?${orgParam}` : ''}`);
      const json = await res.json();
      
      if (json.success) {
        const data = (json.data || []).map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          studentName: r.student ? `${r.student.first_name || ''} ${r.student.last_name || ''}`.trim() : '-',
          studentClass: r.student?.class || r.student?.section || null,
          title: r.title || '-',
          category: r.category || 'other',
          amount: Number(r.amount) || 0,
          paidAmount: Number(r.paid_amount) || 0,
          isPaid: r.is_paid || false,
          dueDate: r.due_date ? new Date(r.due_date) : null,
          paidAt: r.paid_at ? new Date(r.paid_at) : null,
          date: new Date(r.date),
          paymentType: r.payment_type || 'cash',
          notes: r.notes,
        }));
        setIncomes(data.sort((a: OtherIncomeRow, b: OtherIncomeRow) => {
          if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
          return b.date.getTime() - a.date.getTime();
        }));
      }
    } catch {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Öğrenci Arama - Hızlı ve akıllı
  const fetchStudents = async (query: string = '') => {
    if (!query || query.length < 2) {
      setStudents([]);
      setShowStudentDropdown(false);
      return;
    }
    
    setLoadingStudents(true);
    try {
      // Organization ID'yi de gönder
      const orgParam = currentOrganization?.id ? `&organization_id=${currentOrganization.id}` : '';
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=15${orgParam}`);
      const json = await res.json();
      
      if (json.success && json.data) {
        setStudents(json.data);
        setShowStudentDropdown(true);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Öğrenci arama hatası:', err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Debounce ile arama - 150ms (daha hızlı)
  useEffect(() => {
    if (studentSearchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchStudents(studentSearchQuery);
      }, 150); // 300ms → 150ms (daha hızlı)
      return () => clearTimeout(timer);
    } else {
      setStudents([]);
      setShowStudentDropdown(false);
    }
  }, [studentSearchQuery, currentOrganization?.id]);

  // Taksit Önizleme
  const installmentPreview = useMemo(() => {
    const total = Number(formTotalAmount) || 0;
    const downPayment = Number(formDownPayment) || 0;
    const remaining = total - downPayment;
    const count = formInstallmentCount;
    if (remaining <= 0 || count <= 0) return [];
    
    const installmentAmount = remaining / count;
    const previews: { no: number; dueDate: string; amount: number }[] = [];
    
    for (let i = 0; i < count; i++) {
      const dueDate = new Date(formFirstDueDate);
      if (formPeriod === 'monthly') dueDate.setMonth(dueDate.getMonth() + i);
      else if (formPeriod === 'bimonthly') dueDate.setMonth(dueDate.getMonth() + (i * 2));
      else if (formPeriod === 'weekly') dueDate.setDate(dueDate.getDate() + (i * 7));
      else dueDate.setMonth(dueDate.getMonth() + i);
      
      previews.push({
        no: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: Number(installmentAmount.toFixed(2)),
      });
    }
    return previews;
  }, [formTotalAmount, formDownPayment, formInstallmentCount, formFirstDueDate, formPeriod]);

  // Filters
  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return incomes.filter(c => {
      if (periodFilter === 'all') return true;
      if (periodFilter === 'today') return c.date >= today;
      if (periodFilter === 'week') return c.date >= weekAgo;
      if (periodFilter === 'month') return c.date >= monthAgo;
      return true;
    });
  }, [incomes, periodFilter]);

  const filteredIncomes = useMemo(() => {
    let result = filteredByPeriod;
    
    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category === categoryFilter);
    }
    
    if (statusFilter === 'paid') {
      result = result.filter(c => c.isPaid);
    } else if (statusFilter === 'unpaid') {
      result = result.filter(c => !c.isPaid);
    }
    
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(c => 
        c.studentName.toLowerCase().includes(term) || 
        c.title.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [filteredByPeriod, categoryFilter, statusFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayIncomes = incomes.filter(c => c.paidAt && c.paidAt >= todayStart);
    const todayTotal = todayIncomes.reduce((sum, c) => sum + c.paidAmount, 0);
    
    const totalAmount = incomes.reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = incomes.reduce((sum, c) => sum + c.paidAmount, 0);
    const remainingAmount = totalAmount - paidAmount;
    
    const unpaidCount = incomes.filter(c => !c.isPaid).length;
    const paidCount = incomes.filter(c => c.isPaid).length;
    
    // Kategori bazlı istatistikler
    const categoryStats = CATEGORIES.filter(c => c.id !== 'all').map(cat => {
      const catIncomes = incomes.filter(i => i.category === cat.id);
      const catTotal = catIncomes.reduce((sum, c) => sum + c.amount, 0);
      const catPaid = catIncomes.reduce((sum, c) => sum + c.paidAmount, 0);
      return {
        ...cat,
        total: catTotal,
        paid: catPaid,
        remaining: catTotal - catPaid,
        count: catIncomes.length
      };
    });
    
    return {
      todayTotal,
      todayCount: todayIncomes.length,
      totalAmount,
      paidAmount,
      remainingAmount,
      paidCount,
      unpaidCount,
      paymentRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
      categoryStats
    };
  }, [incomes]);

  // Grouping
  type StudentCategoryGroup = {
    studentId: string | null;
    studentName: string;
    studentClass: string | null;
    category: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    itemCount: number;
    paidCount: number;
  };

  const groupedByStudent = useMemo(() => {
    const groups: { [key: string]: StudentCategoryGroup } = {};
    
    filteredIncomes.forEach(income => {
      const key = `${income.studentId || 'unknown'}_${income.category}`;
      
      if (!groups[key]) {
        groups[key] = {
          studentId: income.studentId,
          studentName: income.studentName,
          studentClass: income.studentClass,
          category: income.category,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          itemCount: 0,
          paidCount: 0
        };
      }
      
      groups[key].totalAmount += income.amount;
      groups[key].paidAmount += income.paidAmount;
      groups[key].remainingAmount += (income.amount - income.paidAmount);
      groups[key].itemCount += 1;
      if (income.isPaid) groups[key].paidCount += 1;
    });
    
    return Object.values(groups).sort((a, b) => {
      if (a.studentName !== b.studentName) {
        return a.studentName.localeCompare(b.studentName, 'tr');
      }
      return b.remainingAmount - a.remainingAmount;
    });
  }, [filteredIncomes]);

  // Pagination
  const totalPages = Math.ceil(groupedByStudent.length / pageSize);
  const paginatedData = groupedByStudent.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatMoney = (val: number) => `₺${val.toLocaleString('tr-TR')}`;
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getCategoryInfo = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearchQuery('');
    setShowStudentDropdown(false);
  };

  const resetForm = () => {
    setFormCategory('book');
    setFormTitle('');
    setFormTotalAmount('');
    setFormDownPayment('0');
    setFormDownPaymentDate(new Date().toISOString().split('T')[0]);
    setFormInstallmentCount(1);
    setFormFirstDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormPeriod('monthly');
    setSelectedStudent(null);
    setStudentSearchQuery('');
  };

  const handleAddIncome = async () => {
    if (!selectedStudent) { toast.error('Öğrenci seçin'); return; }
    if (!formTitle.trim()) { toast.error('Başlık giriniz'); return; }
    if (!formTotalAmount || Number(formTotalAmount) <= 0) { toast.error('Tutar giriniz'); return; }

    setSaving(true);
    try {
      if (Number(formDownPayment) > 0) {
        await fetch('/api/finance/other-income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            title: `${formTitle} - Peşinat`,
            category: formCategory,
            amount: Number(formDownPayment),
            paid_amount: Number(formDownPayment),
            is_paid: true,
            paid_at: new Date().toISOString(),
            payment_type: 'cash',
            date: new Date().toISOString(),
            due_date: new Date(formDownPaymentDate).toISOString().split('T')[0],
            organization_id: currentOrganization?.id || null
          })
        });
      }

      for (const inst of installmentPreview) {
        await fetch('/api/finance/other-income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            title: `${formTitle} - ${inst.no}. Taksit`,
            category: formCategory,
            amount: inst.amount,
            paid_amount: 0,
            is_paid: false,
            date: new Date().toISOString(),
            due_date: inst.dueDate,
            organization_id: currentOrganization?.id || null
          })
        });
      }

      toast.success(`✅ Ödeme planı oluşturuldu`);
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch {
      toast.error('Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDeleteGroup = (studentId: string | null, category: string) => {
    setDeleteTarget({ type: 'group', studentId: studentId || undefined, category });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === 'group') {
        const params = new URLSearchParams();
        if (deleteTarget.studentId) params.append('student_id', deleteTarget.studentId);
        if (deleteTarget.category) params.append('category', deleteTarget.category);
        
        const res = await fetch(`/api/finance/other-income?${params.toString()}&delete_all=true`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          toast.success(`${json.deletedCount || 'Tüm'} kayıt silindi`);
          fetchData();
        }
      }
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
      setShowDeleteModal(false);
    }
  };

  const handleOpenPayment = (income: OtherIncomeRow) => {
    setSelectedIncome(income);
    setPaymentAmount((income.amount - income.paidAmount).toString());
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  };

  const handleCollectPayment = async () => {
    if (!selectedIncome) return;
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Tutar giriniz'); return; }

    setPaymentLoading(true);
    try {
      const newPaidAmount = selectedIncome.paidAmount + amount;
      const isFullyPaid = newPaidAmount >= selectedIncome.amount;

      const res = await fetch('/api/finance/other-income', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedIncome.id,
          paid_amount: newPaidAmount,
          is_paid: isFullyPaid,
          paid_at: new Date().toISOString(),
          payment_type: paymentMethod
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`✅ ₺${amount.toLocaleString('tr-TR')} tahsil edildi!`);
        setShowPaymentModal(false);
        setSelectedIncome(null);
        fetchData();
      }
    } catch {
      toast.error('Hata');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (filteredIncomes.length === 0) { toast.error('Veri yok'); return; }

    const headers = ['Tarih', 'Öğrenci', 'Başlık', 'Kategori', 'Tutar', 'Ödenen', 'Kalan'];
    const rows = filteredIncomes.map(r => [
      r.date.toLocaleDateString('tr-TR'),
      r.studentName,
      r.title,
      getCategoryInfo(r.category).label,
      r.amount.toLocaleString('tr-TR'),
      r.paidAmount.toLocaleString('tr-TR'),
      (r.amount - r.paidAmount).toLocaleString('tr-TR')
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Diger_Gelirler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`;
    a.click();
    toast.success('Excel indirildi');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20">
      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Diğer Gelirler</h1>
                  <p className="text-white/70 text-sm">Kitap, kırtasiye, yemek ve diğer satışlar</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setLoading(true); fetchData(); }}
                className="p-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition backdrop-blur-sm"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              
              <button 
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition backdrop-blur-sm"
              >
                <Calendar size={16} />
                Rapor
              </button>

              {canExportExcel && (
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition backdrop-blur-sm"
                >
                  <Download size={16} />
                  Excel
                </button>
              )}
              
              {canAddInstallment && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#075E54] rounded-xl font-bold hover:bg-white/90 transition shadow-lg"
                >
                  <Plus size={18} />
                  Yeni Satış
                </button>
              )}
            </div>
          </div>

          {/* HERO STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <span className="text-white/80 text-xs">Bugün Tahsilat</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">{formatMoney(stats.todayTotal)}</p>
              <p className="text-white/50 text-[10px]">{stats.todayCount} işlem</p>
            </div>
            
            <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-400/30 rounded-lg flex items-center justify-center">
                  <Wallet size={16} className="text-white" />
                </div>
                <span className="text-white/80 text-xs">Toplam Tahsilat</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">{formatMoney(stats.paidAmount)}</p>
              <p className="text-white/50 text-[10px]">{stats.paidCount} tamamlandı</p>
            </div>
            
            <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-400/30 rounded-lg flex items-center justify-center">
                  <Clock size={16} className="text-white" />
                </div>
                <span className="text-white/80 text-xs">Bekleyen</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">{formatMoney(stats.remainingAmount)}</p>
              <p className="text-white/50 text-[10px]">{stats.unpaidCount} ödeme</p>
            </div>
            
            <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-400/30 rounded-lg flex items-center justify-center">
                  <BarChart3 size={16} className="text-white" />
                </div>
                <span className="text-white/80 text-xs">Toplam Satış</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">{formatMoney(stats.totalAmount)}</p>
              <p className="text-white/50 text-[10px]">Tüm dönem</p>
            </div>
            
            <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-400/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
                <span className="text-white/80 text-xs">Tahsilat Oranı</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">%{stats.paymentRate.toFixed(1)}</p>
              <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(stats.paymentRate, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* KATEGORİ KARTLARI */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {stats.categoryStats.map((cat) => {
            const Icon = cat.icon;
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setCategoryFilter(cat.id); setCurrentPage(1); }}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isActive 
                    ? `${cat.lightColor} border-current ${cat.textColor} shadow-lg` 
                    : 'bg-white border-transparent hover:border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">{cat.label}</p>
                    <p className="text-xs text-slate-500">{cat.count} kayıt</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{formatMoney(cat.total)}</p>
                    <p className="text-[10px] text-slate-400">Toplam</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${cat.remaining > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {formatMoney(cat.remaining)}
                    </p>
                    <p className="text-[10px] text-slate-400">Kalan</p>
                  </div>
                </div>
                {isActive && (
                  <div className={`absolute -top-1 -right-1 w-5 h-5 ${cat.color} rounded-full flex items-center justify-center`}>
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* FİLTRELER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Arama */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Öğrenci veya ürün ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none transition"
              />
            </div>
            
            {/* Dönem Filtresi */}
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
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    periodFilter === opt.value
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Durum Filtresi */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              {[
                { value: 'all', label: 'Tümü', icon: Package },
                { value: 'unpaid', label: 'Bekleyen', icon: Clock },
                { value: 'paid', label: 'Ödendi', icon: CheckCircle2 },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value as any); setCurrentPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      statusFilter === opt.value
                        ? 'bg-white text-teal-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            
            <span className="text-sm text-slate-500 font-medium">{groupedByStudent.length} sonuç</span>
          </div>
        </div>

        {/* TABLO */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={32} className="animate-spin text-teal-600" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package size={56} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Kayıt bulunamadı</p>
              <p className="text-sm">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Öğrenci</th>
                    <th className="text-center px-4 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Kategori</th>
                    <th className="text-center px-4 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Taksit</th>
                    <th className="text-right px-4 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Toplam</th>
                    <th className="text-right px-4 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Ödenen</th>
                    <th className="text-right px-4 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Kalan</th>
                    <th className="text-center px-4 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Durum</th>
                    <th className="text-center px-4 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((group, idx) => {
                    const isFullyPaid = group.remainingAmount <= 0;
                    const catInfo = getCategoryInfo(group.category);
                    const CatIcon = catInfo.icon;
                    const progressPercent = group.totalAmount > 0 ? (group.paidAmount / group.totalAmount) * 100 : 0;
                    
                    return (
                      <tr key={`${group.studentId || 'unknown'}_${group.category}`} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-200">
                              {group.studentName !== '-' ? getInitials(group.studentName) : '?'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{group.studentName}</p>
                              {group.studentClass && <p className="text-xs text-slate-500">{group.studentClass}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white ${catInfo.color} shadow-sm`}>
                              <CatIcon size={14} />
                              {catInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg px-3 py-1.5">
                            <span className="text-sm font-bold text-emerald-600">{group.paidCount}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-sm font-bold text-slate-700">{group.itemCount}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-bold text-lg text-slate-900">{formatMoney(group.totalAmount)}</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-emerald-600">{formatMoney(group.paidAmount)}</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className={`font-bold text-lg ${group.remainingAmount > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                            {formatMoney(group.remainingAmount)}
                          </p>
                          {group.remainingAmount > 0 && (
                            <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden w-20 ml-auto">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={12} /> Tamamlandı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <Clock size={12} /> {group.itemCount - group.paidCount} Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {group.studentId && (
                              <Link
                                href={`/students/${group.studentId}?tab=finance`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xs font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition shadow-sm"
                              >
                                <Eye size={14} />
                                Detay
                              </Link>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleRequestDeleteGroup(group.studentId, group.category)}
                                className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
                                title="Sil"
                              >
                                <Trash2 size={14} />
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
            <div className="border-t border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50">
              <span className="text-sm text-slate-500">
                Toplam <strong>{groupedByStudent.length}</strong> kayıt
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
                >
                  İlk
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-bold">
                  {currentPage}
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-sm text-slate-600">{totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
                >
                  Son
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* YENİ GELİR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-[#075E54] to-[#25D366] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Yeni Satış Ekle</h2>
                    <p className="text-white/70 text-sm">Taksitli ödeme planı oluşturun</p>
                  </div>
                </div>
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-white/20 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Öğrenci Seç */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Öğrenci Seç *</label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                        <GraduationCap size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                        <p className="text-sm text-slate-600">{selectedStudent.class} • #{selectedStudent.student_no}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-red-100 rounded-xl text-red-500 transition">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Öğrenci adı veya numarası..."
                      className="w-full pl-12 pr-4 py-4 border-2 border-amber-300 rounded-xl bg-amber-50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg"
                    />
                    {loadingStudents && <RefreshCw size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
                    
                    {showStudentDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-emerald-300 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                        {loadingStudents ? (
                          <div className="flex items-center justify-center py-6">
                            <RefreshCw size={20} className="animate-spin text-emerald-500 mr-2" />
                            <span className="text-sm text-slate-500">Aranıyor...</span>
                          </div>
                        ) : students.length > 0 ? (
                          <>
                            <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200">
                              <p className="text-xs font-semibold text-emerald-700">
                                🎯 {students.length} öğrenci bulundu
                              </p>
                            </div>
                            {students.map((student, idx) => {
                              // Arama metnini vurgula
                              const fullName = `${student.first_name} ${student.last_name}`;
                              const searchLower = studentSearchQuery.toLowerCase();
                              const nameLower = fullName.toLowerCase();
                              const matchIndex = nameLower.indexOf(searchLower);
                              
                              return (
                                <button
                                  key={student.id}
                                  onClick={() => handleSelectStudent(student)}
                                  className={`w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center gap-3 border-b border-slate-100 last:border-b-0 transition ${idx === 0 ? 'bg-emerald-50' : ''}`}
                                >
                                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-sm">
                                      {student.first_name?.[0]}{student.last_name?.[0]}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 truncate">
                                      {matchIndex >= 0 ? (
                                        <>
                                          {fullName.slice(0, matchIndex)}
                                          <span className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
                                            {fullName.slice(matchIndex, matchIndex + searchLower.length)}
                                          </span>
                                          {fullName.slice(matchIndex + searchLower.length)}
                                        </>
                                      ) : (
                                        fullName
                                      )}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">{student.class || 'Sınıf yok'}</span>
                                      <span>#{student.student_no || 'No yok'}</span>
                                    </div>
                                  </div>
                                  <ChevronRight size={16} className="text-slate-400" />
                                </button>
                              );
                            })}
                          </>
                        ) : studentSearchQuery.length >= 2 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                            <AlertCircle size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">Öğrenci bulunamadı</p>
                            <p className="text-xs">"{studentSearchQuery}" için sonuç yok</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFormCategory(cat.id)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          formCategory === cat.id 
                            ? 'border-emerald-500 bg-emerald-50 shadow-lg' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">{cat.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Başlık + Tutar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ürün/Hizmet Adı *</label>
                  <input 
                    type="text" 
                    value={formTitle} 
                    onChange={(e) => setFormTitle(e.target.value)} 
                    placeholder="Örn: Matematik Seti" 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Toplam Tutar (₺) *</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={formTotalAmount} 
                    onChange={(e) => setFormTotalAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    placeholder="0" 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-xl focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Peşinat + Taksit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Peşinat (₺)</label>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    value={formDownPayment} 
                    onChange={(e) => setFormDownPayment(e.target.value.replace(/[^0-9.]/g, ''))} 
                    placeholder="0" 
                    className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl bg-amber-50 focus:border-amber-500 outline-none font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Taksit Sayısı</label>
                  <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => setFormInstallmentCount(Math.max(1, formInstallmentCount - 1))} className="px-5 py-3 bg-slate-50 hover:bg-slate-100 transition">
                      <Minus size={18} />
                    </button>
                    <span className="flex-1 text-center font-bold text-xl">{formInstallmentCount}</span>
                    <button type="button" onClick={() => setFormInstallmentCount(Math.min(24, formInstallmentCount + 1))} className="px-5 py-3 bg-slate-50 hover:bg-slate-100 transition">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Önizleme */}
              {installmentPreview.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-emerald-800">💳 Ödeme Planı</span>
                    <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">{formInstallmentCount} Taksit</span>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {installmentPreview.map(inst => (
                      <div key={inst.no} className="flex items-center justify-between text-sm bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600">{inst.no}</span>
                          <span className="text-slate-600">{new Date(inst.dueDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <span className="font-bold text-emerald-600">{formatMoney(inst.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">
                Vazgeç
              </button>
              <button 
                onClick={handleAddIncome} 
                disabled={saving || !selectedStudent || !formTitle.trim() || !formTotalAmount || installmentPreview.length === 0} 
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 shadow-lg transition"
              >
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAPOR MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar size={24} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tarih Raporu</h2>
                  <p className="text-sm text-slate-500">PDF olarak indirin</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setReportType('single')} 
                  className={`p-5 rounded-xl border-2 text-center transition ${reportType === 'single' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}
                >
                  <Calendar size={28} className="mx-auto mb-2 text-purple-600" />
                  <p className="font-semibold">Tek Gün</p>
                </button>
                <button 
                  onClick={() => setReportType('range')} 
                  className={`p-5 rounded-xl border-2 text-center transition ${reportType === 'range' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}
                >
                  <CalendarRange size={28} className="mx-auto mb-2 text-purple-600" />
                  <p className="font-semibold">Tarih Aralığı</p>
                </button>
              </div>

              {reportType === 'single' ? (
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl" />
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl" />
                </div>
              )}

              <button
                onClick={() => {
                  let filtered: OtherIncomeRow[] = [];
                  if (reportType === 'single') {
                    const targetDate = new Date(reportDate).toDateString();
                    filtered = incomes.filter(c => c.date.toDateString() === targetDate);
                  } else {
                    const start = new Date(reportStartDate);
                    const end = new Date(reportEndDate);
                    end.setHours(23, 59, 59, 999);
                    filtered = incomes.filter(c => c.date >= start && c.date <= end);
                  }
                  setReportData(filtered);
                  toast.success(`${filtered.length} kayıt bulundu`);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
              >
                <Search size={18} />
                Verileri Getir
              </button>

              {reportData.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-slate-700">{reportData.length} Kayıt</p>
                    <p className="font-bold text-emerald-600">{formatMoney(reportData.reduce((sum, r) => sum + r.amount, 0))}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setShowReportModal(false)} className="text-slate-600 hover:text-slate-900">Kapat</button>
              <button 
                onClick={() => {
                  toast.success('PDF hazırlanıyor...');
                  setShowReportModal(false);
                }}
                disabled={reportData.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <Download size={18} />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SİLME MODAL */}
      <AdminPasswordModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        title="Silme Onayı"
        description="Bu öğrencinin bu kategorideki TÜM kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz!"
        confirmText={deleteLoading ? 'Siliniyor...' : 'Sil'}
        dangerAction={true}
      />
    </div>
  );
}
