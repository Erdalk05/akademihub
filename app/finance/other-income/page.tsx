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
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { usePermission } from '@/lib/hooks/usePermission';

// Kategoriler
const CATEGORIES = [
  { id: 'all', label: 'Tümü', icon: Package, color: 'bg-slate-500' },
  { id: 'book', label: 'Kitap', icon: Book, color: 'bg-blue-500' },
  { id: 'uniform', label: 'Üniforma', icon: Shirt, color: 'bg-purple-500' },
  { id: 'meal', label: 'Yemek', icon: UtensilsCrossed, color: 'bg-orange-500' },
  { id: 'stationery', label: 'Kırtasiye', icon: Pencil, color: 'bg-green-500' },
  { id: 'other', label: 'Diğer', icon: Package, color: 'bg-gray-500' },
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

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

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, [currentOrganization?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Çoklu kurum desteği: organization_id filtresi
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
        // Ödenmemişler önce, sonra tarihe göre sırala
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

  // Öğrenci Arama
  const fetchStudents = async (query: string = '') => {
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (studentSearchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchStudents(studentSearchQuery);
        setShowStudentDropdown(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setStudents([]);
      setShowStudentDropdown(false);
    }
  }, [studentSearchQuery]);

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

  // Period Filter
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

  // Category + Search Filter
  const filteredIncomes = useMemo(() => {
    let result = filteredByPeriod;
    
    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category === categoryFilter);
    }
    
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(c => 
        c.studentName.toLowerCase().includes(term) || 
        c.title.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [filteredByPeriod, categoryFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayIncomes = incomes.filter(c => c.date >= todayStart);
    const todayTotal = todayIncomes.reduce((sum, c) => sum + c.amount, 0);
    const totalCollected = filteredByPeriod.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      todayTotal,
      todayCount: todayIncomes.length,
      periodTotal: totalCollected,
      periodCount: filteredByPeriod.length,
    };
  }, [incomes, filteredByPeriod]);

  // Pagination
  const totalPages = Math.ceil(filteredIncomes.length / pageSize);
  const paginatedData = filteredIncomes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    if (!selectedStudent) {
      toast.error('Lütfen bir öğrenci seçin');
      return;
    }
    if (!formTitle.trim()) {
      toast.error('Başlık zorunludur');
      return;
    }
    if (!formTotalAmount || Number(formTotalAmount) <= 0) {
      toast.error('Geçerli bir tutar giriniz');
      return;
    }

    setSaving(true);
    try {
      const studentName = `${selectedStudent.first_name} ${selectedStudent.last_name}`;
      
      // Peşinat varsa - HEMEN ÖDENMİŞ olarak kaydet
      if (Number(formDownPayment) > 0) {
        await fetch('/api/finance/other-income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            title: `${formTitle} - Peşinat`,
            category: formCategory,
            amount: Number(formDownPayment),
            paid_amount: Number(formDownPayment), // Peşinat ödendi
            is_paid: true, // Peşinat ödendi
            paid_at: new Date().toISOString(),
            payment_type: 'cash',
            date: new Date().toISOString(),
            due_date: new Date(formDownPaymentDate).toISOString().split('T')[0],
            notes: `Toplam: ₺${formTotalAmount}`,
            organization_id: currentOrganization?.id || null
          })
        });
      }

      // Taksitler - ÖDENMEMİŞ olarak kaydet
      for (const inst of installmentPreview) {
        await fetch('/api/finance/other-income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            title: `${formTitle} - ${inst.no}. Taksit`,
            category: formCategory,
            amount: inst.amount,
            paid_amount: 0, // Henüz ödenmedi
            is_paid: false, // Ödenmedi
            paid_at: null,
            payment_type: 'cash',
            date: new Date().toISOString(), // Kayıt tarihi
            due_date: inst.dueDate, // Vade tarihi
            notes: `Toplam: ₺${formTotalAmount}, Taksit ${inst.no}/${formInstallmentCount}`,
            organization_id: currentOrganization?.id || null
          })
        });
      }

      const totalCreated = (Number(formDownPayment) > 0 ? 1 : 0) + installmentPreview.length;
      toast.success(`✅ ${totalCreated} ödeme planı oluşturuldu`);
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/finance/other-income?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Kayıt silindi');
        fetchData();
      }
    } catch {
      toast.error('Silme işlemi başarısız');
    }
  };

  // Tahsilat al
  const handleOpenPayment = (income: OtherIncomeRow) => {
    setSelectedIncome(income);
    const remaining = income.amount - income.paidAmount;
    setPaymentAmount(remaining.toString());
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  };

  const handleCollectPayment = async () => {
    if (!selectedIncome) return;
    
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

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
      } else {
        toast.error(json.error || 'Tahsilat başarısız');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    if (filteredIncomes.length === 0) {
      toast.error('Dışa aktarılacak veri yok');
      return;
    }

    const headers = ['Tarih', 'Öğrenci', 'Başlık', 'Kategori', 'Tutar', 'Ödeme Tipi', 'Notlar'];
    const rows = filteredIncomes.map(r => [
      r.date.toLocaleDateString('tr-TR'),
      r.studentName,
      r.title,
      getCategoryInfo(r.category).label,
      r.amount.toLocaleString('tr-TR'),
      r.paymentType === 'cash' ? 'Nakit' : r.paymentType,
      r.notes || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diger_Gelirler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Excel indirildi');
  };

  // PDF Rapor
  const handleDownloadReportPDF = () => {
    if (reportData.length === 0) {
      toast.error('Rapor verisi yok');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Diğer Gelirler Raporu</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { color: #0d9488; margin-bottom: 5px; }
          .meta { color: #64748b; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0d9488; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          .total { font-weight: bold; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Diğer Gelirler Raporu</h1>
        <p class="meta">Tarih: ${reportType === 'single' ? reportDate : `${reportStartDate} - ${reportEndDate}`} | Kayıt: ${reportData.length}</p>
        <table>
          <thead>
            <tr><th>Tarih</th><th>Öğrenci</th><th>Başlık</th><th>Kategori</th><th>Tutar</th></tr>
          </thead>
          <tbody>
            ${reportData.map(r => `
              <tr>
                <td>${r.date.toLocaleDateString('tr-TR')}</td>
                <td>${r.studentName}</td>
                <td>${r.title}</td>
                <td>${getCategoryInfo(r.category).label}</td>
                <td>₺${r.amount.toLocaleString('tr-TR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="total">Toplam: ₺${reportData.reduce((s, r) => s + r.amount, 0).toLocaleString('tr-TR')}</p>
        <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;left:-9999px';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
    setTimeout(() => document.body.removeChild(iframe), 10000);
    setShowReportModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - Tahsilatlar ile aynı */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Diğer Gelirler</h1>
            <p className="text-slate-500 text-sm">Kitap, kırtasiye, yemek ve diğer gelir kayıtları</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <button 
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              <FileText size={16} />
              Tarih Raporu
            </button>

            {canExportExcel && (
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                <Download size={16} />
                Excel
              </button>
            )}
            
            {canAddInstallment && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
              >
                <Plus size={16} />
                Yeni Gelir
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards - Tahsilatlar ile aynı stil, farklı renk */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Bugün</p>
                <p className="text-2xl font-bold text-teal-600">{stats.todayCount}</p>
              </div>
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-teal-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Bugün Gelir</p>
                <p className="text-2xl font-bold text-teal-600">{formatMoney(stats.todayTotal)}</p>
              </div>
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Wallet size={18} className="text-teal-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">{getPeriodLabel()} Adet</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.periodCount}</p>
              </div>
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Receipt size={18} className="text-cyan-600" />
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

        {/* Filters - Tahsilatlar ile aynı stil */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Öğrenci veya başlık ara..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
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
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setCategoryFilter(cat.id); setCurrentPage(1); }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      categoryFilter === cat.id
                        ? 'bg-white text-teal-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={12} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
            
            {/* Count */}
            <span className="text-sm text-slate-500">{filteredIncomes.length} kayıt</span>
          </div>
        </div>

        {/* Table - Tahsilatlar ile aynı stil */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-teal-600" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Receipt size={48} className="mb-3 opacity-50" />
              <p>Kayıt bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Öğrenci</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ödeme</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ödenen</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kalan</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((row) => {
                    const catInfo = getCategoryInfo(row.category);
                    const CatIcon = catInfo.icon;
                    const remaining = row.amount - row.paidAmount;
                    const isOverdue = row.dueDate && new Date() > row.dueDate && !row.isPaid;
                    
                    return (
                      <tr key={row.id} className={`hover:bg-slate-50/50 transition ${isOverdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="text-slate-900 font-medium">{row.dueDate ? row.dueDate.toLocaleDateString('tr-TR') : row.date.toLocaleDateString('tr-TR')}</p>
                          {row.dueDate && isOverdue && (
                            <p className="text-xs text-red-500 font-medium">Gecikmiş</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-medium text-xs">
                              {row.studentName !== '-' ? getInitials(row.studentName) : '?'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{row.studentName}</p>
                              {row.studentClass && <p className="text-xs text-slate-500">{row.studentClass}</p>}
                              {row.title && <p className="text-xs text-slate-400 truncate max-w-[150px]">{row.title}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white ${catInfo.color}`}>
                            <CatIcon size={12} />
                            {catInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-600">
                            {row.paymentType === 'cash' ? '💵 Nakit' : row.paymentType === 'card' ? '💳 Kart' : '🏦 Banka'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-slate-900">₺{row.amount.toLocaleString('tr-TR')}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-emerald-600">₺{row.paidAmount.toLocaleString('tr-TR')}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-semibold ${remaining > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                            ₺{remaining.toLocaleString('tr-TR')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <Check size={12} /> Ödendi
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {isOverdue ? 'Gecikmiş' : 'Beklemede'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {!row.isPaid && (
                              <button 
                                onClick={() => handleOpenPayment(row)}
                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-1"
                                title="Tahsil Et"
                              >
                                <Wallet size={14} />
                                Tahsil Et
                              </button>
                            )}
                            {row.isPaid && (
                              <button 
                                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500"
                                title="Makbuz"
                              >
                                <Receipt size={16} />
                              </button>
                            )}
                            {row.studentId && (
                              <Link
                                href={`/students/${row.studentId}`}
                                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500"
                                title="Öğrenci Profili"
                              >
                                <Users size={16} />
                              </Link>
                            )}
                            {canDeleteInstallment && (
                              <button 
                                onClick={() => handleDelete(row.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition text-red-500"
                                title="Sil"
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
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {filteredIncomes.length} kayıttan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredIncomes.length)} arası
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
                <span className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium">
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

      {/* YENİ GELİR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Yeni Gelir Ekle</h2>
                    <p className="text-teal-100 text-sm">Öğrenci seç ve taksitlendirme yap</p>
                  </div>
                </div>
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-white/20 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Öğrenci Seç */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Öğrenci Seç *</label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                        <GraduationCap size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                        <p className="text-xs text-slate-600">{selectedStudent.class} • #{selectedStudent.student_no}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Öğrenci adı veya numarası ile ara..."
                      className="w-full pl-10 pr-4 py-3 border border-amber-300 rounded-xl bg-amber-50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    />
                    {loadingStudents && <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-500" />}
                    
                    {showStudentDropdown && students.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {students.map(student => (
                          <button
                            key={student.id}
                            onClick={() => handleSelectStudent(student)}
                            className="w-full px-4 py-2.5 text-left hover:bg-teal-50 flex items-center gap-3 border-b border-slate-100 last:border-b-0"
                          >
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                              <User size={14} className="text-teal-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{student.first_name} {student.last_name}</p>
                              <p className="text-xs text-slate-500">{student.class} • #{student.student_no}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFormCategory(cat.id)}
                        className={`p-3 rounded-xl border-2 text-center transition ${formCategory === cat.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className={`w-8 h-8 ${cat.color} rounded-lg flex items-center justify-center mx-auto mb-1`}>
                          <Icon size={16} className="text-white" />
                        </div>
                        <p className="text-xs font-medium text-slate-700">{cat.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Başlık + Tutar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Başlık *</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Örn: Matematik Seti" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Toplam Tutar (₺) *</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={formTotalAmount} 
                    onChange={(e) => {
                      // Sadece rakam ve nokta/virgül kabul et
                      const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      setFormTotalAmount(val);
                    }} 
                    placeholder="0" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-lg"
                  />
                </div>
              </div>

              {/* Peşinat + Taksit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Peşinat (₺)</label>
                  <input type="text" inputMode="decimal" value={formDownPayment} onChange={(e) => setFormDownPayment(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" className="w-full px-4 py-2.5 border border-amber-200 rounded-xl bg-amber-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Taksit Sayısı</label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => setFormInstallmentCount(Math.max(1, formInstallmentCount - 1))} className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100">
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center font-bold">{formInstallmentCount}</span>
                    <button type="button" onClick={() => setFormInstallmentCount(Math.min(24, formInstallmentCount + 1))} className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* İlk Vade + Periyot */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">İlk Vade Tarihi</label>
                  <input type="date" value={formFirstDueDate} onChange={(e) => setFormFirstDueDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Periyot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ id: 'monthly', label: 'Aylık' }, { id: 'weekly', label: 'Haftalık' }].map(p => (
                      <button key={p.id} onClick={() => setFormPeriod(p.id as any)} className={`px-3 py-2 rounded-lg text-xs font-medium ${formPeriod === p.id ? 'bg-teal-500 text-white' : 'bg-slate-100'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Önizleme */}
              {installmentPreview.length > 0 && (
                <div className="bg-teal-50 rounded-xl border border-teal-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-teal-800">Oluşturulacak Ödeme Planı</span>
                    <span className="text-xs font-bold text-teal-600">{formInstallmentCount} Taksit</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {installmentPreview.map(inst => (
                      <div key={inst.no} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                        <span>{inst.no}. Taksit - {new Date(inst.dueDate).toLocaleDateString('tr-TR')}</span>
                        <span className="font-bold text-teal-600">₺{inst.amount.toLocaleString('tr-TR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uyarılar */}
              {(!selectedStudent || !formTitle.trim() || !formTotalAmount || installmentPreview.length === 0) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {!selectedStudent && <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full">⚠ Öğrenci seçilmedi</span>}
                  {!formTitle.trim() && <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full">⚠ Başlık girilmedi</span>}
                  {!formTotalAmount && <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full">⚠ Tutar girilmedi</span>}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-5 border-t border-slate-200 bg-slate-50">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-5 py-2.5 text-slate-600 hover:text-slate-900">
                Vazgeç
              </button>
              <button onClick={handleAddIncome} disabled={saving || !selectedStudent || !formTitle.trim() || !formTotalAmount || installmentPreview.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50">
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TARİH RAPORU MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar size={20} className="text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Tarih Bazlı Rapor</h2>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setReportType('single')} className={`p-4 rounded-xl border-2 text-center ${reportType === 'single' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                  <CalendarRange size={24} className="mx-auto mb-2" />
                  <p className="font-medium">Tek Gün</p>
                </button>
                <button onClick={() => setReportType('range')} className={`p-4 rounded-xl border-2 text-center ${reportType === 'range' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                  <CalendarRange size={24} className="mx-auto mb-2" />
                  <p className="font-medium">Tarih Aralığı</p>
                </button>
              </div>

              {reportType === 'single' ? (
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" />
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" />
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
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-medium"
              >
                <Filter size={18} />
                Verileri Getir
              </button>

              {reportData.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-slate-700">{reportData.length} Kayıt</p>
                    <p className="font-bold text-teal-600">₺{reportData.reduce((sum, r) => sum + r.amount, 0).toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {reportData.slice(0, 10).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                        <div>
                          <p className="font-medium">{r.title}</p>
                          <p className="text-xs text-slate-500">{r.date.toLocaleDateString('tr-TR')}</p>
                        </div>
                        <p className="font-bold text-teal-600">₺{r.amount.toLocaleString('tr-TR')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setShowReportModal(false)} className="text-slate-600 hover:text-slate-900">Kapat</button>
              <button 
                onClick={handleDownloadReportPDF}
                disabled={reportData.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAHSİLAT MODAL */}
      {showPaymentModal && selectedIncome && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Wallet size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Tahsilat Al</h2>
                    <p className="text-emerald-100 text-sm">{selectedIncome.studentName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white/70 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Bilgi Kartı */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">Başlık</span>
                  <span className="font-medium text-slate-900">{selectedIncome.title}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">Kategori</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getCategoryInfo(selectedIncome.category).color}`}>
                    {getCategoryInfo(selectedIncome.category).label}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">Toplam Tutar</span>
                  <span className="font-bold text-slate-900">₺{selectedIncome.amount.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">Ödenen</span>
                  <span className="font-bold text-emerald-600">₺{selectedIncome.paidAmount.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm font-medium text-slate-700">Kalan Borç</span>
                  <span className="font-bold text-lg text-orange-600">₺{(selectedIncome.amount - selectedIncome.paidAmount).toLocaleString('tr-TR')}</span>
                </div>
              </div>

              {/* Tutar Girişi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tahsil Edilecek Tutar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₺</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={paymentAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      setPaymentAmount(val);
                    }}
                    className="w-full pl-10 pr-4 py-3 text-xl font-bold text-slate-900 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Ödeme Yöntemi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ödeme Yöntemi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash', label: '💵 Nakit' },
                    { value: 'card', label: '💳 Kart' },
                    { value: 'bank', label: '🏦 Banka' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value as 'cash' | 'card' | 'bank')}
                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                        paymentMethod === method.value
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                          : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleCollectPayment}
                disabled={paymentLoading || !paymentAmount || Number(paymentAmount) <= 0}
                className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    Tahsil Et
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
