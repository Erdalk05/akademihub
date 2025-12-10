'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Download,
  RefreshCw,
  Book,
  Shirt,
  UtensilsCrossed,
  Pencil,
  Package,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Settings,
  Receipt,
  FileText,
  AlertTriangle,
  Minus,
  Search,
  User,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

// Varsayılan Kategoriler
const DEFAULT_CATEGORIES = [
  { id: 'book', label: 'Kitap', icon: 'Book', color: 'bg-blue-500' },
  { id: 'uniform', label: 'Üniforma', icon: 'Shirt', color: 'bg-purple-500' },
  { id: 'meal', label: 'Yemek', icon: 'UtensilsCrossed', color: 'bg-orange-500' },
  { id: 'stationery', label: 'Kırtasiye', icon: 'Pencil', color: 'bg-green-500' },
  { id: 'other', label: 'Diğer', icon: 'Package', color: 'bg-gray-500' },
];

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Book, Shirt, UtensilsCrossed, Pencil, Package
};

type OtherIncomeRecord = {
  id: string;
  student_id: string | null;
  title: string;
  category: string;
  amount: number;
  payment_type: string;
  date: string;
  notes: string | null;
  created_at: string;
  students?: { first_name: string; last_name: string; class: string } | null;
};

type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

type InstallmentPreview = {
  no: number;
  dueDate: string;
  amount: number;
  remaining: number;
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
  // State
  const [data, setData] = useState<OtherIncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Öğrenci Arama State
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form states - Temel
  const [formCategory, setFormCategory] = useState('book');
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states - Taksitlendirme
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formDownPayment, setFormDownPayment] = useState('0');
  const [formDownPaymentDate, setFormDownPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formInstallmentCount, setFormInstallmentCount] = useState(1);
  const [formFirstDueDate, setFormFirstDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [formPeriod, setFormPeriod] = useState<'monthly' | 'bimonthly' | 'weekly' | 'custom'>('monthly');

  // New category form
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('bg-teal-500');

  // Öğrenci Listesi Fetch
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

  // Öğrenci arama
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

  // Filtrelenmiş öğrenciler
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return students;
    const q = studentSearchQuery.toLowerCase();
    return students.filter(s => 
      (s.first_name?.toLowerCase().includes(q)) ||
      (s.last_name?.toLowerCase().includes(q)) ||
      (s.full_name?.toLowerCase().includes(q)) ||
      (s.student_no?.toLowerCase().includes(q))
    );
  }, [students, studentSearchQuery]);

  // Installment preview calculation
  const installmentPreview = useMemo((): InstallmentPreview[] => {
    const total = Number(formTotalAmount) || 0;
    const downPayment = Number(formDownPayment) || 0;
    const remaining = total - downPayment;
    const count = formInstallmentCount;
    
    if (remaining <= 0 || count <= 0) return [];
    
    const installmentAmount = remaining / count;
    const previews: InstallmentPreview[] = [];
    let cumulativeRemaining = remaining;
    
    for (let i = 0; i < count; i++) {
      const dueDate = new Date(formFirstDueDate);
      
      if (formPeriod === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (formPeriod === 'bimonthly') {
        dueDate.setMonth(dueDate.getMonth() + (i * 2));
      } else if (formPeriod === 'weekly') {
        dueDate.setDate(dueDate.getDate() + (i * 7));
      } else {
        dueDate.setMonth(dueDate.getMonth() + i);
      }
      
      cumulativeRemaining -= installmentAmount;
      
      previews.push({
        no: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: Number(installmentAmount.toFixed(2)),
        remaining: Math.max(0, Number(cumulativeRemaining.toFixed(2)))
      });
    }
    
    return previews;
  }, [formTotalAmount, formDownPayment, formInstallmentCount, formFirstDueDate, formPeriod]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      
      const res = await fetch(`/api/finance/other-income?${params.toString()}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data || []);
      }
    } catch {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('other_income_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCategories([...DEFAULT_CATEGORIES, ...parsed]);
      } catch {
        // ignore
      }
    }
  }, [selectedCategory]);

  // Stats by category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    categories.forEach(cat => {
      const filtered = data.filter(d => d.category === cat.id);
      stats[cat.id] = {
        count: filtered.length,
        total: filtered.reduce((sum, d) => sum + Number(d.amount), 0)
      };
    });
    return stats;
  }, [data, categories]);

  const totalStats = useMemo(() => ({
    total: data.reduce((sum, d) => sum + Number(d.amount), 0),
    count: data.length,
  }), [data]);

  const filteredData = data;
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getCategoryInfo = (categoryId: string) => categories.find(c => c.id === categoryId) || categories[4];

  // Öğrenci Seç
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearchQuery('');
    setShowStudentDropdown(false);
  };

  // Handle add income with installments
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
      
      // Peşinat varsa kaydet
      if (Number(formDownPayment) > 0) {
        await fetch('/api/finance/other-income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            title: `${formTitle} - Peşinat (${studentName})`,
            category: formCategory,
            amount: Number(formDownPayment),
            payment_type: 'cash',
            date: new Date(formDownPaymentDate).toISOString(),
            notes: formNotes.trim() || null
          })
        });
      }

      // Taksitleri kaydet
      for (const inst of installmentPreview) {
        await fetch('/api/finance/other-income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            title: `${formTitle} - ${inst.no}. Taksit (${studentName})`,
            category: formCategory,
            amount: inst.amount,
            payment_type: 'cash',
            date: new Date(inst.dueDate).toISOString(),
            notes: `Öğrenci: ${studentName}, Toplam: ₺${formTotalAmount}, Taksit ${inst.no}/${formInstallmentCount}`
          })
        });
      }

      toast.success(`${selectedStudent.first_name} için ${installmentPreview.length} taksit oluşturuldu`);
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
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
    setFormNotes('');
    setSelectedStudent(null);
    setStudentSearchQuery('');
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

  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) {
      toast.error('Kategori adı zorunludur');
      return;
    }
    const newId = newCategoryLabel.toLowerCase().replace(/\s+/g, '_');
    const newCategory: Category = { id: newId, label: newCategoryLabel.trim(), icon: 'Package', color: newCategoryColor };
    const customCategories = categories.filter(c => !DEFAULT_CATEGORIES.find(d => d.id === c.id));
    const updated = [...customCategories, newCategory];
    localStorage.setItem('other_income_categories', JSON.stringify(updated));
    setCategories([...DEFAULT_CATEGORIES, ...updated]);
    setNewCategoryLabel('');
    setShowCategoryModal(false);
    toast.success('Kategori eklendi');
  };

  const formatMoney = (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Receipt size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Diğer Gelirler</h1>
                <p className="text-gray-500 text-sm">Kitap, kırtasiye, yemek ve diğer gelir kayıtları</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={fetchData} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => setShowCategoryModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">
                <Settings size={18} />
                Kategoriler
              </button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition shadow-lg shadow-emerald-200">
                <Plus size={18} />
                Yeni Gelir Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Toplam Gelir</p>
            <p className="text-2xl font-bold text-emerald-600">{formatMoney(totalStats.total)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Kayıt Sayısı</p>
            <p className="text-2xl font-bold text-teal-600">{totalStats.count}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Kitap Geliri</p>
            <p className="text-2xl font-bold text-blue-600">{formatMoney(categoryStats.book?.total || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Yemek Geliri</p>
            <p className="text-2xl font-bold text-orange-600">{formatMoney(categoryStats.meal?.total || 0)}</p>
          </div>
        </div>

        {/* Category Filter & Table */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${selectedCategory === 'all' ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Tümü
              </button>
              {categories.map(cat => {
                const IconComponent = ICON_MAP[cat.icon] || Package;
                return (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${selectedCategory === cat.id ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <IconComponent size={16} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                Gelir Hareketleri
              </h3>
              <span className="text-sm text-gray-500">{filteredData.length} kayıt</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={32} className="animate-spin text-emerald-500" />
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package size={48} className="mb-3 opacity-50" />
                <p>Kayıt bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Öğrenci</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Başlık</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedData.map((row) => {
                      const catInfo = getCategoryInfo(row.category);
                      const IconComponent = ICON_MAP[catInfo.icon] || Package;
                      const studentName = row.students ? `${row.students.first_name} ${row.students.last_name}` : '-';
                      return (
                        <tr key={row.id} className="hover:bg-emerald-50/30 transition">
                          <td className="py-4 px-4 text-sm font-medium text-gray-900">{formatDate(row.date)}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <User size={14} className="text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{studentName}</p>
                                {row.students?.class && <p className="text-xs text-gray-500">{row.students.class}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900">{row.title}</p>
                            {row.notes && <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.notes}</p>}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${catInfo.color}`}>
                              <IconComponent size={14} />
                              {catInfo.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-emerald-600 text-lg">{formatMoney(row.amount)}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <Check size={12} />
                              Tahsil Edildi
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleDelete(row.id)} className="p-2 hover:bg-red-50 rounded-lg transition text-red-500">
                                <Trash2 size={16} />
                              </button>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                                <Download size={16} />
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

            {totalPages > 1 && (
              <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">{filteredData.length} kayıt</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium">{currentPage}</span>
                  <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* YENİ GELİR EKLE MODAL - TAKSİTLENDİRME STİLİNDE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Diğer Gelir Taksitlendirme</h2>
                    <p className="text-emerald-100 text-sm">Öğrenci seç ve toplam tutarı taksitlere böl</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-400/50 rounded-lg text-amber-100 text-xs">
                    <AlertTriangle size={14} />
                    Bu işlem finansal kayıtları kalıcı olarak değiştirir.
                  </div>
                  <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-white/20 rounded-lg transition">
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content - İki Sütun */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-x divide-gray-200 max-h-[65vh] overflow-y-auto">
              {/* SOL TARAF - ÖĞRENCİ BİLGİSİ + ÖZET */}
              <div className="p-6 bg-gray-50">
                {/* ÖĞRENCİ SEÇİMİ */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">ÖĞRENCİ SEÇ</h3>
                  
                  {selectedStudent ? (
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                            <GraduationCap size={24} className="text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                            <p className="text-sm text-gray-600">
                              {selectedStudent.class && <span className="mr-2">{selectedStudent.class}</span>}
                              {selectedStudent.student_no && <span className="text-gray-400">#{selectedStudent.student_no}</span>}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          placeholder="Öğrenci adı veya numarası ile ara..."
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                        {loadingStudents && (
                          <RefreshCw size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />
                        )}
                      </div>
                      
                      {/* Dropdown */}
                      {showStudentDropdown && filteredStudents.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {filteredStudents.map(student => (
                            <button
                              key={student.id}
                              onClick={() => handleSelectStudent(student)}
                              className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center gap-3 transition border-b border-gray-100 last:border-b-0"
                            >
                              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <User size={18} className="text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                                <p className="text-xs text-gray-500">
                                  {student.class && <span>{student.class}</span>}
                                  {student.student_no && <span className="ml-2">#{student.student_no}</span>}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {showStudentDropdown && studentSearchQuery.length >= 2 && filteredStudents.length === 0 && !loadingStudents && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                          Öğrenci bulunamadı
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Kategori Tablosu */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">MEVCUT KATEGORİ ÖZETİ</h3>
                  <p className="text-xs text-gray-500 mb-3">Kategorilere göre gelir dağılımı</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Adet</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {categories.map(cat => {
                        const stat = categoryStats[cat.id] || { count: 0, total: 0 };
                        const IconComponent = ICON_MAP[cat.icon] || Package;
                        return (
                          <tr key={cat.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 ${cat.color} rounded-lg flex items-center justify-center`}>
                                  <IconComponent size={14} className="text-white" />
                                </div>
                                <span className="font-medium text-gray-900 text-sm">{cat.label}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-gray-600">{stat.count}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatMoney(stat.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Özet */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Toplam Kayıt</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{totalStats.count}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-600 uppercase">Toplam Gelir</p>
                    <p className="text-xl font-bold text-emerald-600 mt-1">{formatMoney(totalStats.total)}</p>
                  </div>
                </div>
              </div>

              {/* SAĞ TARAF - TAKSİTLENDİRME FORMU */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">YENİ GELİR TAKSİTLENDİRME</h3>
                  <p className="text-xs text-gray-500 mt-1">Toplam tutarı, taksit sayısını ve vade tarihini belirleyin</p>
                </div>

                <div className="space-y-4">
                  {/* Kategori + Başlık */}
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {categories.slice(0, 5).map(cat => {
                      const IconComponent = ICON_MAP[cat.icon] || Package;
                      return (
                        <button key={cat.id} type="button" onClick={() => setFormCategory(cat.id)} className={`p-2 rounded-xl border-2 text-center transition ${formCategory === cat.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className={`w-6 h-6 ${cat.color} rounded-lg flex items-center justify-center mx-auto mb-1`}>
                            <IconComponent size={12} className="text-white" />
                          </div>
                          <p className="text-[9px] font-medium text-gray-700">{cat.label}</p>
                        </button>
                      );
                    })}
                  </div>

                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Başlık / Açıklama *" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />

                  {/* Toplam Tutar */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Toplam Tutar (₺) *</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">₺</span>
                        <input type="number" value={formTotalAmount} onChange={(e) => setFormTotalAmount(e.target.value)} placeholder="0" className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-bold" />
                      </div>
                      {formTotalAmount && (
                        <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium whitespace-nowrap">
                          Girilen: {formatMoney(Number(formTotalAmount))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Peşinat + Peşinat Tarihi */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Peşinat Tutarı (₺)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-sm">₺</span>
                        <input type="number" value={formDownPayment} onChange={(e) => setFormDownPayment(e.target.value)} placeholder="0" className="w-full pl-8 pr-4 py-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-amber-50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Calendar size={12} />
                        Peşinat Tarihi
                      </label>
                      <input type="date" value={formDownPaymentDate} onChange={(e) => setFormDownPaymentDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />
                    </div>
                  </div>

                  {/* Taksit Sayısı + İlk Vade */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Yeni Taksit Sayısı</label>
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button type="button" onClick={() => setFormInstallmentCount(Math.max(1, formInstallmentCount - 1))} className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition">
                          <Minus size={16} />
                        </button>
                        <span className="flex-1 text-center text-xl font-bold py-2">{formInstallmentCount}</span>
                        <button type="button" onClick={() => setFormInstallmentCount(Math.min(24, formInstallmentCount + 1))} className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Calendar size={12} />
                        İlk Vade Tarihi *
                      </label>
                      <input type="date" value={formFirstDueDate} onChange={(e) => setFormFirstDueDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />
                    </div>
                  </div>

                  {/* Periyot */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Periyot</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'monthly', label: 'Aylık' },
                        { id: 'bimonthly', label: 'İki Aylık' },
                        { id: 'weekly', label: 'Haftalık' },
                        { id: 'custom', label: 'Özel' },
                      ].map(p => (
                        <button key={p.id} type="button" onClick={() => setFormPeriod(p.id as typeof formPeriod)} className={`px-3 py-2 rounded-xl text-xs font-medium transition ${formPeriod === p.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Önizleme Tablosu */}
                  {installmentPreview.length > 0 && (
                    <div className="bg-emerald-50 rounded-xl border border-emerald-200 overflow-hidden">
                      <div className="px-4 py-2 bg-emerald-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                          <Check size={14} />
                          Oluşturulacak Ödeme Planı
                        </span>
                        <span className="text-xs font-bold text-emerald-600">{formInstallmentCount} Taksit</span>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-emerald-200">
                              <th className="text-left py-2 px-3 font-semibold text-emerald-700">NO</th>
                              <th className="text-left py-2 px-3 font-semibold text-emerald-700">VADE</th>
                              <th className="text-right py-2 px-3 font-semibold text-emerald-700">TUTAR</th>
                              <th className="text-right py-2 px-3 font-semibold text-emerald-700">KALAN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100">
                            {installmentPreview.slice(0, 6).map(inst => (
                              <tr key={inst.no}>
                                <td className="py-2 px-3">{inst.no}. Taksit</td>
                                <td className="py-2 px-3">{formatDate(inst.dueDate)}</td>
                                <td className="py-2 px-3 text-right font-semibold text-emerald-700">{formatMoney(inst.amount)}</td>
                                <td className="py-2 px-3 text-right text-gray-600">{formatMoney(inst.remaining)}</td>
                              </tr>
                            ))}
                            {installmentPreview.length > 6 && (
                              <tr>
                                <td colSpan={4} className="py-2 px-3 text-center text-gray-500">+{installmentPreview.length - 6} taksit daha...</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {!formFirstDueDate && formTotalAmount && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-700 flex items-center justify-center gap-1">
                        <AlertTriangle size={14} />
                        Taksitleri görmek için <strong>İlk Vade Tarihi</strong>&apos;ni seçin
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AlertTriangle size={14} className="text-amber-500" />
                Bu işlem geri alınamaz. Taksitler sisteme eklenecektir.
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition">
                  Vazgeç
                </button>
                <button onClick={handleAddIncome} disabled={saving || !selectedStudent || !formTitle.trim() || !formTotalAmount || installmentPreview.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition disabled:opacity-50 shadow-lg shadow-emerald-200">
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                  {saving ? 'Kaydediliyor...' : 'Taksitlendirmeyi Onayla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Kategori Yönetimi</h2>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Kategoriler</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const IconComponent = ICON_MAP[cat.icon] || Package;
                    return (
                      <span key={cat.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${cat.color}`}>
                        <IconComponent size={14} />
                        {cat.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Kategori Ekle</label>
                <div className="flex gap-2">
                  <input type="text" value={newCategoryLabel} onChange={(e) => setNewCategoryLabel(e.target.value)} placeholder="Kategori adı" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl" />
                  <select value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl">
                    <option value="bg-teal-500">Teal</option>
                    <option value="bg-cyan-500">Cyan</option>
                    <option value="bg-emerald-500">Emerald</option>
                  </select>
                  <button onClick={handleAddCategory} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowCategoryModal(false)} className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
