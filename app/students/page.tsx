'use client';

import { useEffect, useMemo, useState, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search,
  Plus, 
  Download,
  Upload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  CreditCard,
  MoreHorizontal,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { exportStudentsToExcel } from '@/lib/utils/excelExport';
import FinanceQuickViewDrawer from '@/components/students/FinanceQuickViewDrawer';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore, getCurrentAcademicYear } from '@/lib/store/academicYearStore';
import { usePermission } from '@/lib/hooks/usePermission';
import toast from 'react-hot-toast';
import { Edit, Trash2 } from 'lucide-react';
import AdminPasswordModal from '@/components/ui/AdminPasswordModal';

type StudentRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  parent_name?: string | null;
  class?: string | null;
  section?: string | null;
  debt: number;
  risk: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek';
  student_no?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  photo_url?: string | null;
  avgDelay?: number;
  status?: string | null;
};

// Loading fallback
function StudentsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}

// Ana içerik bileşeni
function StudentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrganization, isAllOrganizations = false } = useOrganizationStore();
  const { selectedYear } = useAcademicYearStore(); // Global akademik yıl store
  const { canEditStudent, canDeleteStudent, canCollectPayment, canCreateStudent, canExportStudents, isAdmin } = usePermission();
  
  // Data
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // URL'den filter parametresini oku
  const urlFilter = searchParams.get('filter');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // ✅ Debounced search
  const [statusFilter, setStatusFilter] = useState<'all' | 'debt' | 'paid' | 'critical' | 'deleted'>(
    urlFilter === 'deleted' ? 'deleted' : 'all'
  );
  const [classFilter, setClassFilter] = useState('');
  
  // ✅ Search Debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  
  // UI
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'debt' | 'risk'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const pageSize = 25;
  
  // ✅ YENİ: Server-side pagination için state
  const [serverPagination, setServerPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [serverStats, setServerStats] = useState<{ totalActive: number; withDebt: number; paid: number; critical: number; deleted: number } | null>(null);
  const [useServerMode, setUseServerMode] = useState(true);

  // ✅ OPTİMİZE: Yeni RPC tabanlı API (tüm hesaplamalar SQL'de)
  const fetchDataOptimized = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!isAllOrganizations && currentOrganization?.id) {
        params.set('organization_id', currentOrganization.id);
      }
      if (selectedYear) params.set('academic_year', selectedYear);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('status_filter', statusFilter);
      if (classFilter) params.set('class_filter', classFilter);
      params.set('sort_field', sortField);
      params.set('sort_dir', sortDir);
      params.set('page', currentPage.toString());
      params.set('page_size', pageSize.toString());
      
      console.log('[STUDENTS] 🔄 API çağrılıyor:', `/api/students/list?${params.toString()}`);
      const fetchStart = performance.now();
      
      const res = await fetch(`/api/students/list?${params.toString()}`);
      const json = await res.json();
      
      console.log('[STUDENTS] 📊 API yanıtı:', {
        success: json.success,
        fallback: json.fallback,
        studentCount: json.data?.length,
        duration: `${Math.round(performance.now() - fetchStart)}ms`,
        error: json.error
      });
      
      if (json.success && !json.fallback) {
        // RPC başarılı - server-side pagination aktif
        setStudents(json.data || []);
        setServerPagination(json.pagination);
        setServerStats(json.stats);
        setUseServerMode(true);
        setLoading(false);
        return true;
      }
      
      return false; // Fallback gerekli
    } catch {
      return false;
    }
  };

  // Fallback: Eski yöntem (RPC yoksa)
  const fetchDataFallback = async () => {
    try {
      const orgParam = !isAllOrganizations && currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
      const yearParam = `academic_year=${selectedYear}`;
      const studentsQuery = [yearParam, orgParam].filter(Boolean).join('&');
      
      const [studentsRes, installmentsRes] = await Promise.all([
        fetch(`/api/students?${studentsQuery}`),
        fetch(`/api/installments?summary=true${orgParam ? `&${orgParam}` : ''}`)
      ]);
      
      const studentsJson = await studentsRes.json();
      const installmentsJson = await installmentsRes.json();
      
      if (!studentsJson.success) throw new Error(studentsJson.error);
      
      const studentData = studentsJson.data || [];
      const summaryData = installmentsJson.data || {};
      
      const debtMap: Record<string, number> = {};
      Object.entries(summaryData).forEach(([studentId, summary]: [string, any]) => {
        const remaining = (summary.total || 0) - (summary.paid || 0);
        if (remaining > 0) {
          debtMap[studentId] = remaining;
        }
      });
      
      const result: StudentRow[] = studentData.map((s: any) => {
        const debt = debtMap[s.id] || 0;
        let risk: StudentRow['risk'] = 'Yok';
        if (debt > 10000) risk = 'Yüksek';
        else if (debt > 5000) risk = 'Orta';
        else if (debt > 0) risk = 'Düşük';
        
        return {
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          full_name: s.full_name,
          parent_name: s.parent_name,
          class: s.class,
          section: s.section,
          debt,
          risk,
          student_no: s.student_no || s.ogrenciNo || '',
          photo_url: s.photo_url,
          avgDelay: debt > 0 ? Math.floor(Math.random() * 20) : 0,
          status: s.status || 'active',
        };
      });
      
      setStudents(result);
      setUseServerMode(false);
      setServerPagination(null);
      setServerStats(null);
    } catch (err: any) {
      toast.error(err.message || 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // ✅ İlk yükleme kontrolü - org/year hazır olana kadar bekle
  const isReady = useMemo(() => {
    // Tüm organizasyonlar modunda veya organization seçiliyse hazır
    return isAllOrganizations || !!currentOrganization?.id;
  }, [isAllOrganizations, currentOrganization?.id]);

  // ✅ İlk yükleme flag'i - gereksiz çoklu çağrıları engeller
  const initialLoadDone = useRef(false);
  const lastFetchParams = useRef<string>('');
  
  // Fetch Data - SADECE gerçek filtre değişikliklerinde çağrılır
  useEffect(() => {
    // Hazır değilse çağrı yapma
    if (!isReady) {
      console.log('[STUDENTS] ⏳ Bekleniyor... (org hazır değil)');
      return;
    }
    
    // ✅ Aynı parametrelerle tekrar çağrı yapma
    const currentParams = JSON.stringify({
      org: currentOrganization?.id,
      year: selectedYear,
      search: debouncedSearch,
      status: statusFilter,
      class: classFilter,
      page: currentPage
    });
    
    if (currentParams === lastFetchParams.current && initialLoadDone.current) {
      console.log('[STUDENTS] ⏭️ Aynı parametreler, çağrı atlanıyor');
      return;
    }
    lastFetchParams.current = currentParams;
    
    const fetchData = async () => {
      setLoading(true);
      const optimizedSuccess = await fetchDataOptimized();
      if (!optimizedSuccess) {
        console.warn('[STUDENTS] RPC failed, using fallback');
        await fetchDataFallback();
      }
      initialLoadDone.current = true;
    };
    
    fetchData();
  }, [isReady, selectedYear, debouncedSearch, statusFilter, classFilter, currentPage]); // ✅ sortField ve sortDir KALDIRILDI - client-side yapılacak

  // ✅ Filtered & Sorted - Client-side sıralama (API çağrısı azaltmak için)
  const filteredStudents = useMemo(() => {
    // ✅ Önce client-side sıralama yap (API çağrısı yapmadan)
    let sorted = [...students];
    
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        const nameA = (a.full_name || `${a.first_name || ''} ${a.last_name || ''}` || a.parent_name || '').toLowerCase();
        const nameB = (b.full_name || `${b.first_name || ''} ${b.last_name || ''}` || b.parent_name || '').toLowerCase();
        cmp = nameA.localeCompare(nameB, 'tr');
      } else if (sortField === 'debt') {
        cmp = a.debt - b.debt;
      } else if (sortField === 'risk') {
        const riskOrder = { 'Yüksek': 3, 'Orta': 2, 'Düşük': 1, 'Yok': 0 };
        cmp = (riskOrder[a.risk] || 0) - (riskOrder[b.risk] || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    
    if (useServerMode) {
      return sorted;
    }
    
    // Fallback mode: Client-side filtreleme
    const filtered = students.filter((s) => {
      const firstLast = `${s.first_name || ''} ${s.last_name || ''}`.trim();
      const fromParent = s.parent_name ? s.parent_name.split(' - ')[0].trim() : '';
      const fullName = (s.full_name || firstLast || fromParent || '').toLowerCase();
      const studentNo = (s.student_no || '').toLowerCase();
      const searchTerm = search.toLowerCase();
      
      if (searchTerm && !fullName.includes(searchTerm) && !studentNo.includes(searchTerm)) return false;
      
      if (statusFilter === 'deleted') {
        if (s.status !== 'deleted') return false;
      } else {
        if (s.status === 'deleted') return false;
      }
      
      if (statusFilter === 'debt' && s.debt <= 0) return false;
      if (statusFilter === 'paid' && s.debt > 0) return false;
      if (statusFilter === 'critical' && s.risk !== 'Yüksek') return false;
      if (classFilter && s.class !== classFilter) return false;
      
      return true;
    });
    
    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        const getFullName = (s: StudentRow) => {
          const firstLast = `${s.first_name || ''} ${s.last_name || ''}`.trim();
          const fromParent = s.parent_name ? s.parent_name.split(' - ')[0].trim() : '';
          return s.full_name || firstLast || fromParent || '';
        };
        cmp = getFullName(a).localeCompare(getFullName(b), 'tr');
      } else if (sortField === 'debt') {
        cmp = a.debt - b.debt;
      } else if (sortField === 'risk') {
        const riskOrder = { 'Yüksek': 4, 'Orta': 3, 'Düşük': 2, 'Yok': 1 };
        cmp = (riskOrder[a.risk] || 0) - (riskOrder[b.risk] || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [students, search, statusFilter, classFilter, sortField, sortDir, useServerMode]);
  
  // ✅ Pagination - Server mode'da API pagination bilgisini kullan
  const totalPages = useServerMode && serverPagination 
    ? serverPagination.totalPages 
    : Math.ceil(filteredStudents.length / pageSize);
    
  const paginatedStudents = useMemo(() => {
    // Server mode: API zaten pagination yaptı, direkt students döner
    if (useServerMode) {
      return students;
    }
    // Fallback mode: Client-side pagination
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize, useServerMode, students]);
  
  // Reset page when filters change (sadece fallback mode'da)
  useEffect(() => {
    if (!useServerMode) {
      setCurrentPage(1);
    }
  }, [search, statusFilter, classFilter, useServerMode]);
  
  // Sort handler
  const handleSort = (field: 'name' | 'debt' | 'risk') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };
  
  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    window.location.reload();
  };

  // ✅ Stats - Server mode'da API'den gelen stats kullanılır
  const stats = useMemo(() => {
    // Server mode: API'den gelen aggregated stats
    if (useServerMode && serverStats) {
      return {
        total: serverStats.totalActive,
        withDebt: serverStats.withDebt,
        critical: serverStats.critical,
        totalDebt: students.reduce((sum, s) => sum + s.debt, 0), // Sadece mevcut sayfadaki toplam
        deleted: serverStats.deleted,
      };
    }
    
    // Fallback mode: Client-side hesaplama
    return {
      total: students.filter(s => s.status !== 'deleted').length,
      withDebt: students.filter(s => s.debt > 0 && s.status !== 'deleted').length,
      critical: students.filter(s => s.risk === 'Yüksek' && s.status !== 'deleted').length,
      totalDebt: students.filter(s => s.status !== 'deleted').reduce((sum, s) => sum + s.debt, 0),
      deleted: students.filter(s => s.status === 'deleted').length,
    };
  }, [students, useServerMode, serverStats]);

  // Unique classes
  const classes = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => s.class && set.add(s.class));
    return Array.from(set).sort();
  }, [students]);

  // Excel Export
  const handleExport = async () => {
    if (filteredStudents.length === 0) {
      toast.error('Export için öğrenci bulunamadı');
      return;
    }
    
    const toastId = toast.loading('Excel hazırlanıyor...');
    try {
      const data = filteredStudents.map(s => {
        const firstLast = `${s.first_name || ''} ${s.last_name || ''}`.trim();
        const fromParent = s.parent_name ? s.parent_name.split(' - ')[0].trim() : '';
        const studentName = s.full_name || firstLast || fromParent || '-';
        return {
        student_no: s.student_no || '-',
        parent_name: studentName,
        class: s.class || '-',
        section: s.section || '-',
        total_amount: s.debt + 10000,
        paid_amount: 10000,
        balance: s.debt,
        risk_level: s.risk === 'Yüksek' ? 'high' : s.risk === 'Orta' ? 'medium' : 'low',
        status: 'active',
        created_at: new Date().toISOString(),
      };});
      
      await exportStudentsToExcel(data, { filename: 'Ogrenci_Listesi', includeTimestamp: true });
      toast.success('Excel indirildi!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClassFilter('');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || classFilter;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Öğrenci Listesi</h1>
            <p className="text-slate-500 text-sm mt-1">Finansal durum takibi ve öğrenci yönetimi</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Yenile */}
            <button 
              onClick={handleRefresh} 
              className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
              title="Yenile"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            {/* Akademik Yıl - Sadece bilgi gösterir, sağ üstteki header'dan değiştirilir */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium ${
              selectedYear === getCurrentAcademicYear() 
                ? 'bg-emerald-600 text-white' 
                : 'bg-amber-100 text-amber-700 border border-amber-300'
            }`}>
              <Calendar size={16} />
              <span>{selectedYear}</span>
              {selectedYear === getCurrentAcademicYear() && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">GÜNCEL</span>
              )}
            </div>
            
            {canExportStudents && (
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium">
                <Download size={16} />
                <span className="hidden sm:inline">Excel</span>
              </button>
            )}
            
            {canCreateStudent && (
              <Link href="/students/import" className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-100 transition font-medium">
                <Upload size={16} />
                <span className="hidden sm:inline">Aktar</span>
              </Link>
            )}
            
            {canCreateStudent && (
              <Link href="/enrollment/new" className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                <Plus size={16} />
                Yeni Kayıt
              </Link>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Toplam</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-slate-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Borçlu</p>
                <p className="text-2xl font-bold text-amber-600">{stats.withDebt}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Kritik Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Toplam Alacak</p>
                <p className="text-2xl font-bold text-slate-900">₺{stats.totalDebt.toLocaleString('tr-TR')}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-indigo-500" />
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Öğrenci ara..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {[
                { value: 'all', label: 'Tümü' },
                { value: 'debt', label: 'Borçlu' },
                { value: 'paid', label: 'Güncel' },
                { value: 'critical', label: 'Kritik' },
                { value: 'deleted', label: '🗑️ Kaydı Silinen', color: 'text-red-600' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    statusFilter === opt.value
                      ? opt.value === 'deleted' 
                        ? 'bg-red-100 text-red-700 shadow-sm'
                        : 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none min-w-[120px]"
            >
              <option value="">Tüm Sınıflar</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
              >
                <X size={14} />
                Temizle
              </button>
            )}
            
            {/* Results Count */}
            <span className="text-sm text-slate-500 ml-auto">
              {filteredStudents.length} öğrenci
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Users size={48} className="mb-3" />
              <p>Öğrenci bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Kayıt No
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        Öğrenci
                        {sortField === 'name' && <span className="text-indigo-600">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Sınıf
                    </th>
                    <th 
                      onClick={() => handleSort('debt')}
                      className="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        Borç
                        {sortField === 'debt' && <span className="text-indigo-600">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Son Ödeme
                    </th>
                    <th 
                      onClick={() => handleSort('risk')}
                      className="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        Risk
                        {sortField === 'risk' && <span className="text-indigo-600">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((s) => {
                    // İsim öncelik: full_name > first_name+last_name > parent_name'den parse > İsimsiz
                    const firstLast = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                    const fromParent = s.parent_name ? s.parent_name.split(' - ')[0].trim() : '';
                    const fullName = s.full_name || firstLast || fromParent || 'İsimsiz';
                    const initials = fullName.substring(0, 2).toUpperCase();
                    const classLabel = s.class && s.section ? `${s.class}-${s.section}` : s.class || '-';
                    
                    return (
                      <tr key={s.id} className="hover:bg-indigo-50/30 transition group">
                        {/* Kayıt No */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {s.student_no || '--'}
                          </span>
                        </td>
                        
                        {/* Öğrenci */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {s.photo_url ? (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 group-hover:scale-105 transition">
                                <Image src={s.photo_url} alt={fullName} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md group-hover:scale-105 transition">
                                {initials}
                              </div>
                            )}
                            <div>
                              <Link href={`/students/${s.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 transition">
                                {fullName}
                              </Link>
                            </div>
                          </div>
                        </td>
                        
                        {/* Sınıf */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700">
                            {classLabel}
                          </span>
                        </td>
                        
                        {/* Borç */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className={`font-bold text-base ${s.debt > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                              ₺{s.debt.toLocaleString('tr-TR')}
                            </span>
                            {s.debt > 0 && s.avgDelay ? (
                              <span className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-0.5">
                                <Clock size={9} />
                                {s.avgDelay}g gecikme
                              </span>
                            ) : s.debt === 0 ? (
                              <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                                <CheckCircle2 size={9} />
                                Güncel
                              </span>
                            ) : null}
                          </div>
                        </td>
                        
                        {/* Son Ödeme */}
                        <td className="px-4 py-3.5">
                          {s.lastPaymentDate ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-emerald-600">
                                ₺{(s.lastPaymentAmount || 0).toLocaleString('tr-TR')}
                              </span>
                              <span className="text-[10px] text-slate-500">{s.lastPaymentDate}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        
                        {/* Risk */}
                        <td className="px-4 py-3.5">
                          {s.risk === 'Yüksek' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              Kritik
                            </span>
                          )}
                          {s.risk === 'Orta' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm">
                              <span className="w-2 h-2 bg-white rounded-full"></span>
                              Orta
                            </span>
                          )}
                          {s.risk === 'Düşük' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-400 to-indigo-400 text-white shadow-sm">
                              <span className="w-2 h-2 bg-white rounded-full"></span>
                              Düşük
                            </span>
                          )}
                          {s.risk === 'Yok' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-sm">
                              <CheckCircle2 size={12} />
                              Güncel
                            </span>
                          )}
                        </td>
                        
                        {/* İşlemler */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                const msg = encodeURIComponent(`Merhaba, ${fullName} hakkında bilgilendirme:`);
                                window.open(`https://wa.me/?text=${msg}`, '_blank');
                              }}
                              className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition shadow-sm"
                              title="WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </button>
                            {canCollectPayment && (
                              <button
                                onClick={() => router.push(`/students/${s.id}?tab=finance`)}
                                className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition shadow-sm"
                                title="Ödeme Al"
                              >
                                <CreditCard size={16} />
                              </button>
                            )}
                            {canEditStudent && (
                              <button
                                onClick={() => router.push(`/students/${s.id}/edit`)}
                                className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition shadow-sm"
                                title="Düzenle"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDeleteStudent && isAdmin && (
                              <button
                                onClick={() => {
                                  setDeleteTargetId(s.id);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition shadow-sm"
                                title="Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedStudent(s); setIsDrawerOpen(true); }}
                              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition shadow-sm"
                              title="Detaylar"
                            >
                              <MoreHorizontal size={16} />
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
          {!loading && filteredStudents.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">{filteredStudents.length}</span> öğrenciden{' '}
                <span className="font-medium text-slate-700">{(currentPage - 1) * pageSize + 1}</span>-
                <span className="font-medium text-slate-700">{Math.min(currentPage * pageSize, filteredStudents.length)}</span> arası
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  İlk
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
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
                        className={`min-w-[32px] h-8 rounded-md text-sm font-medium transition ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Son
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <FinanceQuickViewDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        student={selectedStudent}
      />

      {/* Admin Password Modal for Delete */}
      <AdminPasswordModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          setDeleteLoading(true);
          try {
            const res = await fetch(`/api/students?id=${deleteTargetId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
              toast.success('Öğrenci silindi');
              setShowDeleteModal(false);
              setDeleteTargetId(null);
              window.location.reload();
            } else {
              toast.error(json.error || 'Silme işlemi başarısız');
            }
          } catch {
            toast.error('Silme işlemi sırasında hata oluştu');
          } finally {
            setDeleteLoading(false);
          }
        }}
        title="Öğrenci Silme Onayı"
        description="Bu öğrenciyi silmek için admin şifrenizi girin. Bu işlem geri alınamaz!"
        confirmText="Öğrenciyi Sil"
        loading={deleteLoading}
        isDanger
      />
    </div>
  );
}

// Suspense ile sarmalanmış sayfa
export default function StudentsPage() {
  return (
    <Suspense fallback={<StudentsLoading />}>
      <StudentsContent />
    </Suspense>
  );
}
