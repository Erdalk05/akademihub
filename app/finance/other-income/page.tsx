'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Book,
  Shirt,
  UtensilsCrossed,
  Pencil,
  Package,
  Trash2,
  Filter,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Kategori tanımları
const CATEGORIES = [
  { value: 'all', label: 'Tümü', icon: Package, color: 'bg-slate-500' },
  { value: 'book', label: 'Kitap', icon: Book, color: 'bg-blue-500' },
  { value: 'uniform', label: 'Üniforma', icon: Shirt, color: 'bg-purple-500' },
  { value: 'meal', label: 'Yemek', icon: UtensilsCrossed, color: 'bg-orange-500' },
  { value: 'stationery', label: 'Kırtasiye', icon: Pencil, color: 'bg-green-500' },
  { value: 'other', label: 'Diğer', icon: Package, color: 'bg-gray-500' },
];

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
  creator?: {
    id: string;
    name: string;
  } | null;
};

export default function OtherIncomePage() {
  const router = useRouter();
  
  // State
  const [data, setData] = useState<OtherIncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }
      
      const res = await fetch(`/api/finance/other-income?${params.toString()}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data || []);
      } else {
        toast.error(json.error || 'Veriler yüklenemedi');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  // Filtered & paginated data
  const filteredData = useMemo(() => {
    let result = data;
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        (item.student?.first_name?.toLowerCase().includes(searchLower)) ||
        (item.student?.last_name?.toLowerCase().includes(searchLower)) ||
        (item.notes?.toLowerCase().includes(searchLower))
      );
    }
    
    return result;
  }, [data, search]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayRecords = data.filter(d => new Date(d.date).toDateString() === today);
    
    return {
      total: data.reduce((sum, d) => sum + Number(d.amount), 0),
      count: data.length,
      todayTotal: todayRecords.reduce((sum, d) => sum + Number(d.amount), 0),
      todayCount: todayRecords.length
    };
  }, [data]);

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
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  // Get category info
  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[5];
  };

  const formatMoney = (val: number) => {
    return `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Diğer Gelirler</h1>
            <p className="text-slate-500 text-sm">Kitap, kırtasiye, yemek ve diğer gelir kayıtları</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <Link
              href="/finance/other-income/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              <Plus size={16} />
              Yeni Gelir Ekle
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Toplam Gelir</p>
                <p className="text-xl font-bold text-emerald-600">{formatMoney(stats.total)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Kayıt Sayısı</p>
                <p className="text-xl font-bold text-slate-900">{stats.count}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package size={18} className="text-slate-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Bugün</p>
                <p className="text-xl font-bold text-blue-600">{formatMoney(stats.todayTotal)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar size={18} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Bugün Adet</p>
                <p className="text-xl font-bold text-slate-900">{stats.todayCount}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Filter size={18} className="text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Ara..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => { setCategoryFilter(cat.value); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                    categoryFilter === cat.value
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <cat.icon size={14} />
                  {cat.label}
                </button>
              ))}
            </div>
            
            <span className="text-sm text-slate-500">{filteredData.length} kayıt</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-emerald-600" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package size={48} className="mb-3 opacity-50" />
              <p>Kayıt bulunamadı</p>
              <Link href="/finance/other-income/new" className="mt-3 text-emerald-600 hover:underline text-sm">
                + Yeni gelir ekle
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tarih</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Başlık</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kategori</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Öğrenci</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tutar</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ödeme</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((row) => {
                    const catInfo = getCategoryInfo(row.category);
                    const CatIcon = catInfo.icon;
                    
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          <p className="text-slate-900 font-medium text-sm">
                            {new Date(row.date).toLocaleDateString('tr-TR')}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(row.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{row.title}</p>
                          {row.notes && (
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{row.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white ${catInfo.color}`}>
                            <CatIcon size={12} />
                            {catInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.student ? (
                            <Link 
                              href={`/students/${row.student.id}`}
                              className="text-emerald-600 hover:underline text-sm"
                            >
                              {row.student.first_name} {row.student.last_name}
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-emerald-600">{formatMoney(row.amount)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">
                            {PAYMENT_TYPES[row.payment_type] || row.payment_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition text-red-500"
                              title="Sil"
                            >
                              <Trash2 size={16} />
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
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {filteredData.length} kayıttan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredData.length)} arası
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

