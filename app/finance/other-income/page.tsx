'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Settings,
  Receipt,
  FileText,
  DollarSign
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

const PAYMENT_TYPES: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kredi Kartı',
  bank: 'Havale/EFT',
  other: 'Diğer'
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
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    student_no: string;
  } | null;
};

type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

export default function OtherIncomePage() {
  // State
  const [data, setData] = useState<OtherIncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form states
  const [formCategory, setFormCategory] = useState('book');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPaymentType, setFormPaymentType] = useState('cash');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // New category form
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('bg-teal-500');

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
      } else {
        toast.error(json.error || 'Veriler yüklenemedi');
      }
    } catch {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Load custom categories from localStorage
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

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const todayRecords = data.filter(d => new Date(d.date).toDateString() === today);
    const monthRecords = data.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    
    return {
      total: data.reduce((sum, d) => sum + Number(d.amount), 0),
      count: data.length,
      todayTotal: todayRecords.reduce((sum, d) => sum + Number(d.amount), 0),
      monthTotal: monthRecords.reduce((sum, d) => sum + Number(d.amount), 0),
    };
  }, [data]);

  // Filtered & paginated
  const filteredData = useMemo(() => {
    return data;
  }, [data]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Get category info
  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || categories[4];
  };

  // Handle add income
  const handleAddIncome = async () => {
    if (!formTitle.trim()) {
      toast.error('Başlık zorunludur');
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error('Geçerli bir tutar giriniz');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/finance/other-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          category: formCategory,
          amount: Number(formAmount),
          payment_type: formPaymentType,
          date: new Date(formDate).toISOString(),
          notes: formNotes.trim() || null
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Gelir kaydı oluşturuldu');
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(json.error || 'Kayıt oluşturulamadı');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormCategory('book');
    setFormTitle('');
    setFormAmount('');
    setFormPaymentType('cash');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const res = await fetch(`/api/finance/other-income?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success('Kayıt silindi');
        fetchData();
      } else {
        toast.error(json.error || 'Silinemedi');
      }
    } catch {
      toast.error('Silme işlemi başarısız');
    }
  };

  // Add new category
  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) {
      toast.error('Kategori adı zorunludur');
      return;
    }

    const newId = newCategoryLabel.toLowerCase().replace(/\s+/g, '_');
    const newCategory: Category = {
      id: newId,
      label: newCategoryLabel.trim(),
      icon: 'Package',
      color: newCategoryColor
    };

    const customCategories = categories.filter(c => !DEFAULT_CATEGORIES.find(d => d.id === c.id));
    const updated = [...customCategories, newCategory];
    localStorage.setItem('other_income_categories', JSON.stringify(updated));
    setCategories([...DEFAULT_CATEGORIES, ...updated]);
    setNewCategoryLabel('');
    setShowCategoryModal(false);
    toast.success('Kategori eklendi');
  };

  const formatMoney = (val: number) => {
    return `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - Öğrenci Finans Stili */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Receipt size={20} className="text-white" />
                </div>
                Diğer Gelirler
              </h1>
              <p className="text-gray-500 text-sm mt-1">Kitap, kırtasiye, yemek ve diğer gelir kayıtları</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
              >
                <Settings size={18} />
                Kategoriler
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition shadow-lg shadow-emerald-200"
              >
                <Plus size={18} />
                Yeni Gelir Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Ödeme Planı Stili */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Toplam Gelir</p>
                <p className="text-2xl font-bold text-emerald-600">{formatMoney(stats.total)}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Bu Ay</p>
                <p className="text-2xl font-bold text-teal-600">{formatMoney(stats.monthTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-teal-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-cyan-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Bugün</p>
                <p className="text-2xl font-bold text-cyan-600">{formatMoney(stats.todayTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-cyan-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Kayıt Sayısı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter - Tab Stili */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              {categories.map(cat => {
                const IconComponent = ICON_MAP[cat.icon] || Package;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent size={16} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table - Ödeme Planı ve Hareketler Stili */}
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
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 text-emerald-600 hover:underline text-sm font-medium"
                >
                  + Yeni gelir ekle
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Başlık</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ödeme</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedData.map((row) => {
                      const catInfo = getCategoryInfo(row.category);
                      const IconComponent = ICON_MAP[catInfo.icon] || Package;
                      
                      return (
                        <tr key={row.id} className="hover:bg-emerald-50/30 transition">
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(row.date).toLocaleDateString('tr-TR')}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900">{row.title}</p>
                            {row.notes && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.notes}</p>
                            )}
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
                            <span className="text-sm text-gray-600">
                              {PAYMENT_TYPES[row.payment_type] || row.payment_type}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <Check size={12} />
                              Tahsil Edildi
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition text-red-500"
                                title="Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
                                title="Makbuz"
                              >
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {filteredData.length} kayıttan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredData.length)} arası
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yeni Gelir Ekle Modal - Yeniden Taksitlendir Stili */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header - Yeşil Gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Yeni Gelir Ekle</h2>
                    <p className="text-emerald-100 text-sm">Kitap, kırtasiye, yemek veya diğer gelir</p>
                  </div>
                </div>
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-white/20 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Kategori Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Kategori Seçin</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {categories.map(cat => {
                    const IconComponent = ICON_MAP[cat.icon] || Package;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormCategory(cat.id)}
                        className={`p-4 rounded-xl border-2 text-center transition ${
                          formCategory === cat.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                          <IconComponent size={20} className="text-white" />
                        </div>
                        <p className="text-xs font-medium text-gray-700">{cat.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Başlık ve Tutar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlık *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Örn: Matematik Kitabı"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (₺) *</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-bold"
                  />
                </div>
              </div>

              {/* Tarih ve Ödeme Türü */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Türü</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(PAYMENT_TYPES).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormPaymentType(key)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                          formPaymentType === key
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar (Opsiyonel)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ek açıklama..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-900 transition font-medium"
              >
                Vazgeç
              </button>
              <button
                onClick={handleAddIncome}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition disabled:opacity-50"
              >
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                {saving ? 'Kaydediliyor...' : 'Geliri Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Yönetimi Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Kategori Yönetimi</h2>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Mevcut Kategoriler */}
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

              {/* Yeni Kategori Ekle */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Kategori Ekle</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    placeholder="Kategori adı"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <select
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="bg-teal-500">Teal</option>
                    <option value="bg-cyan-500">Cyan</option>
                    <option value="bg-emerald-500">Emerald</option>
                    <option value="bg-lime-500">Lime</option>
                    <option value="bg-amber-500">Amber</option>
                    <option value="bg-rose-500">Rose</option>
                    <option value="bg-violet-500">Violet</option>
                    <option value="bg-sky-500">Sky</option>
                  </select>
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
