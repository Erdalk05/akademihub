'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Phone, 
  MessageCircle, 
  Edit, 
  Archive,
  Trash2,
  User,
  Wallet,
  AlertCircle,
  Camera,
  RefreshCw,
  AlertTriangle,
  Clock,
  ImagePlus,
  Loader2,
  Package,
  GraduationCap,
  TrendingUp,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';

// Tab Components
import StudentFinanceTab from '@/components/student-detail/StudentFinanceTab';
import StudentNotesTab from '@/components/student-detail/StudentNotesTab';
import StudentOverviewTab from '@/components/student-detail/StudentOverviewTab';
import ImageUploadModal from '@/components/upload/ImageUploadModal';
import { StickyNote, UserCircle } from 'lucide-react';

// Permission System
import { useRole } from '@/lib/contexts/RoleContext';
import { Permission } from '@/lib/types/role-types';
import AdminPasswordModal from '@/components/ui/AdminPasswordModal';

interface StudentData {
  id: string;
  student_no: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  parent_name?: string;
  class?: string;
  section?: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  parent_phone?: string;
  parent_email?: string;
  total_amount?: number;
  paid_amount?: number;
  balance?: number;
  risk_level?: 'high' | 'medium' | 'low' | 'none';
  photo_url?: string;
  created_at: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  // Rol ve yetki kontrolü
  const { hasPermission, isAdmin, currentUser } = useRole();
  const canDeleteStudent = hasPermission(Permission.STUDENTS_DELETE);

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard' | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Finans Özeti için state
  const [financeSummary, setFinanceSummary] = useState({
    education: { total: 0, paid: 0, remaining: 0 },
    other: { total: 0, paid: 0, remaining: 0 },
    overall: { total: 0, paid: 0, remaining: 0 }
  });
  
  // Kamera ve Galeri ref'leri
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
      fetchFinanceSummary();
    }
  }, [studentId]);

  const fetchFinanceSummary = async () => {
    try {
      // Paralel API çağrıları - HIZLI
      const [otherRes, instRes] = await Promise.all([
        fetch(`/api/finance/other-income?student_id=${studentId}`),
        fetch(`/api/installments?student_id=${studentId}`)
      ]);
      
      const [otherData, instData] = await Promise.all([
        otherRes.json(),
        instRes.json()
      ]);
      
      const otherIncomes = otherData.data || [];
      const installments = instData.data || [];
      
      const otherTotal = otherIncomes.reduce((s: number, i: any) => s + (i.amount || 0), 0);
      const otherPaid = otherIncomes.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0);
      const eduTotal = installments.reduce((s: number, i: any) => s + (i.amount || 0), 0);
      const eduPaid = installments.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0);
      
      setFinanceSummary({
        education: { total: eduTotal, paid: eduPaid, remaining: eduTotal - eduPaid },
        other: { total: otherTotal, paid: otherPaid, remaining: otherTotal - otherPaid },
        overall: { 
          total: eduTotal + otherTotal, 
          paid: eduPaid + otherPaid, 
          remaining: (eduTotal + otherTotal) - (eduPaid + otherPaid) 
        }
      });
    } catch (error) {
      console.error('Finans özeti alınamadı:', error);
    }
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // First try the specific endpoint
      let response = await fetch(`/api/students/${studentId}`);
      
      if (!response.ok) {
        // If specific endpoint fails, try getting from list
        response = await fetch('/api/students');
        if (!response.ok) throw new Error('Öğrenci bulunamadı');
        
        const listData = await response.json();
        const students = listData.data || listData;
        const foundStudent = Array.isArray(students) 
          ? students.find((s: any) => s.id === studentId)
          : null;
        
        if (!foundStudent) throw new Error('Öğrenci bulunamadı');
        setStudent(foundStudent);
      } else {
        const data = await response.json();
        setStudent(data.data || data);
      }
    } catch (error: any) {
      console.error('Student fetch error:', error);
      toast.error(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (student?.parent_phone) {
      navigator.clipboard.writeText(student.parent_phone);
      toast.success(`Telefon numarası kopyalandı: ${student.parent_phone}`);
    } else {
      toast.error('Telefon numarası bulunamadı');
    }
  };

  const handleWhatsApp = () => {
    if (student?.parent_phone) {
      let phone = student.parent_phone.replace(/\D/g, '');
      // Türkiye için: başında 0 varsa kaldır, 90 ekle
      if (phone.startsWith('0')) {
        phone = '90' + phone.slice(1);
      } else if (!phone.startsWith('90') && phone.length === 10) {
        phone = '90' + phone;
      }
      const message = encodeURIComponent(`Merhaba, ${student.first_name} ${student.last_name} hakkında bilgilendirme:`);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      toast.error('WhatsApp için telefon numarası bulunamadı');
    }
  };

  const handleEdit = () => {
    // Kayıt formu sayfasına öğrenci ID'si ile yönlendir
    router.push(`/enrollment/new?edit=${studentId}`);
  };

  const handleViewHistory = () => {
    // Öğrencinin düzenleme geçmişini göster
    router.push(`/students/${studentId}/history`);
  };

  const handleArchive = () => {
    if (confirm('Bu öğrenciyi arşivlemek istediğinizden emin misiniz?')) {
      toast.success('Öğrenci arşivlendi');
    }
  };

  // ⚠️ KAYDI SİL (SOFT DELETE) - Modal aç
  const handleSoftDelete = () => {
    if (!canDeleteStudent || !isAdmin) {
      toast.error('Bu işlem için yetkiniz yok. Sadece admin kullanıcılar öğrenci silebilir.');
      return;
    }
    setDeleteType('soft');
    setShowDeleteModal(true);
  };

  // Gerçek soft delete işlemi
  const executeSoftDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Öğrenci kaydı siliniyor...');

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || '',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'İşlem başarısız oldu.');
      }

      toast.success('Öğrenci kaydı silindi. Tahsil edilen ödemeler korundu.', { id: toastId });
      setShowDeleteModal(false);
      router.push('/students');
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  // ⛔ KALICI SİL (HARD DELETE) - Modal aç
  const handlePermanentDelete = () => {
    if (!canDeleteStudent || !isAdmin) {
      toast.error('Bu işlem için yetkiniz yok.');
      return;
    }
    setDeleteType('hard');
    setShowDeleteModal(true);
  };

  // Gerçek hard delete işlemi
  const executePermanentDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Öğrenci kalıcı olarak siliniyor...');

    try {
      const response = await fetch(`/api/students/${studentId}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || '',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Silme işlemi başarısız oldu.');
      }

      toast.success('Öğrenci ve tüm verileri kalıcı olarak silindi.', { id: toastId });
      setShowDeleteModal(false);
      router.push('/students');
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  // 🔄 GERİ YÜKLE - Silinen öğrenciyi aktif yap
  const handleRestore = async () => {
    if (!isAdmin) {
      toast.error('Bu işlem için yetkiniz yok.');
      return;
    }

    const confirmStep = confirm(
      `"${student?.first_name} ${student?.last_name}" öğrencisini geri yüklemek istiyor musunuz?\n\n` +
      '✅ Öğrenci tekrar aktif olacak\n' +
      '✅ İptal edilen taksitler tekrar aktif olacak'
    );

    if (!confirmStep) return;

    setIsDeleting(true);
    const toastId = toast.loading('Öğrenci geri yükleniyor...');

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || '',
        },
        body: JSON.stringify({ action: 'restore' }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Geri yükleme başarısız oldu.');
      }

      toast.success('Öğrenci başarıyla geri yüklendi!', { id: toastId });
      window.location.reload();
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePhotoUpload = (url: string) => {
    if (student) {
      setStudent({ ...student, photo_url: url });
    }
    toast.success('Fotoğraf güncellendi!');
  };

  // Direkt fotoğraf yükleme (kamera/galeri)
  const handleDirectPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fotoğraf 5MB\'dan küçük olmalıdır');
      return;
    }
    
    setUploadingPhoto(true);
    const toastId = toast.loading('Fotoğraf yükleniyor...');
    
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      // API'ye kaydet
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || '',
        },
        body: JSON.stringify({ photo_url: base64 }),
      });
      
      if (response.ok) {
        setStudent(prev => prev ? { ...prev, photo_url: base64 } : null);
        toast.success('Fotoğraf güncellendi!', { id: toastId });
      } else {
        throw new Error('Yükleme başarısız');
      }
    } catch (error) {
      toast.error('Fotoğraf yüklenemedi', { id: toastId });
    } finally {
      setUploadingPhoto(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      active: { label: '✅ Aktif Kayıt', className: 'bg-green-100 text-green-700 border-green-300' },
      inactive: { label: '⏸️ Pasif', className: 'bg-gray-100 text-gray-700 border-gray-300' },
      graduated: { label: '🎓 Mezun', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      suspended: { label: '⛔ Donduruldu', className: 'bg-red-100 text-red-700 border-red-300' },
      deleted: { label: '🗑️ Kaydı Silinen', className: 'bg-red-100 text-red-700 border-red-300' },
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const getRiskBadge = (risk?: string) => {
    const badges = {
      high: { label: '🔴 Yüksek Risk', className: 'bg-red-100 text-red-700 border-red-300' },
      medium: { label: '🟡 Orta Risk', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      low: { label: '🟢 Düşük Risk', className: 'bg-green-100 text-green-700 border-green-300' },
      none: { label: '✅ Risk Yok', className: 'bg-gray-100 text-gray-700 border-gray-300' },
    };
    return badges[risk as keyof typeof badges] || badges.none;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Öğrenci Bulunamadı</h2>
        <button
          onClick={() => router.push('/students')}
          className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
        >
          Öğrenci Listesine Dön
        </button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(student.status);
  const riskBadge = student.balance && student.balance > 0 ? getRiskBadge(student.risk_level) : null;
  const initials = `${student.first_name?.charAt(0) || ''}${student.last_name?.charAt(0) || ''}`.toUpperCase();
  const displayName = student.full_name || student.parent_name || `${student.first_name} ${student.last_name}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* ⚠️ KAYDI SİLİNEN ÖĞRENCİ UYARISI */}
      {(student.status as string) === 'deleted' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-800">Kaydı Silinen Öğrenci</h3>
            <p className="text-sm text-red-600">
              Bu öğrencinin kaydı silinmiş. Tahsil edilen ödemeler korunmuştur. 
              Geri yüklemek için &quot;Geri Yükle&quot; butonunu kullanabilirsiniz.
            </p>
          </div>
        </div>
      )}
      
      {/* HEADER BÖLÜMÜ - Estetik Tasarım */}
      <div className="bg-gradient-to-r from-white via-gray-50 to-white p-6 rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative">
        {/* Dekoratif arka plan */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-100/20 to-indigo-100/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex gap-5 items-start">
            {/* Avatar / Photo - Kamera & Galeri */}
            <div className="flex flex-col items-center">
              <div className="relative group mb-3">
                <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative">
                  {uploadingPhoto ? (
                    <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-xl border-4 border-white">
                      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    </div>
                  ) : student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={displayName}
                      className="h-28 w-28 rounded-2xl object-cover shadow-xl border-4 border-white ring-2 ring-emerald-200"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl border-4 border-white">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Online/Status indicator */}
                <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white shadow-md flex items-center justify-center text-xs ${
                  student.status === 'active' ? 'bg-emerald-500' : 
                  student.status === 'inactive' ? 'bg-gray-400' : 
                  student.status === 'graduated' ? 'bg-blue-500' : 'bg-red-400'
                }`}>
                  {student.status === 'active' ? '✓' : student.status === 'graduated' ? '🎓' : ''}
                </div>
              </div>
              
              {/* Kamera & Galeri Butonları */}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-bold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md disabled:opacity-50"
                  title="Kamera ile çek"
                >
                  <Camera size={14} />
                  Kamera
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[11px] font-bold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md disabled:opacity-50"
                  title="Galeriden seç"
                >
                  <ImagePlus size={14} />
                  Galeri
                </button>
              </div>
              
              {/* Hidden Inputs */}
              <input 
                ref={cameraInputRef} 
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={handleDirectPhotoUpload} 
                className="hidden" 
              />
              <input 
                ref={galleryInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleDirectPhotoUpload} 
                className="hidden" 
              />
            </div>

            {/* Info - Geliştirilmiş */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                {displayName}
              </h1>
              
              {/* Veli Adı & Kayıt Tarihi */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                {student.parent_name && (
                  <span className="flex items-center gap-1">
                    👨‍👩‍👧 <span className="font-medium">{student.parent_name}</span>
                  </span>
                )}
                {student.created_at && (
                  <span className="flex items-center gap-1">
                    📅 Kayıt: <span className="font-medium">{new Date(student.created_at).toLocaleDateString('tr-TR')}</span>
                  </span>
                )}
                {student.parent_phone && (
                  <span className="flex items-center gap-1">
                    📱 <span className="font-medium">{student.parent_phone}</span>
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                {student.class && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 shadow-sm">
                    🎓 {student.class}{student.section ? `-${student.section}` : ''} Sınıfı
                  </span>
                )}
                {riskBadge && (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${riskBadge.className}`}>
                    {riskBadge.label}
                  </span>
                )}
                {/* Ödeme Durumu Badge */}
                {student.balance !== undefined && (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${
                    student.balance === 0 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                      : student.balance > 0 && student.paid_amount && student.paid_amount > 0
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                  }`}>
                    {student.balance === 0 
                      ? '💚 Borç Yok' 
                      : student.paid_amount && student.paid_amount > 0
                        ? `💰 ₺${student.balance?.toLocaleString('tr-TR')} Kalan`
                        : '⚠️ Ödeme Bekleniyor'}
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-600 shadow-sm font-mono">
                  #{student.student_no}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions - Kompakt Tek Satır */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={handleCall}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all text-xs font-semibold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Veli Ara</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all text-xs font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all text-xs font-semibold"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Güncelle</span>
            </button>
            <button
              onClick={handleViewHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all text-xs font-semibold"
              title="Geçmiş"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Geçmiş</span>
            </button>
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all text-xs font-semibold"
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Arşivle</span>
            </button>
            
            {/* ⚠️ SİL BUTONLARI - SADECE ADMİN İÇİN GÖRÜNÜR */}
            {canDeleteStudent && isAdmin && (student?.status as string) !== 'deleted' && (
              <>
                <button
                  onClick={handleSoftDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all text-xs font-semibold disabled:opacity-50"
                  title="Kaydı sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kaydı Sil</span>
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all text-xs font-semibold disabled:opacity-50"
                  title="Kalıcı sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kalıcı Sil</span>
                </button>
              </>
            )}
            
            {/* 🔄 GERİ YÜKLE */}
            {canDeleteStudent && isAdmin && (student?.status as string) === 'deleted' && (
              <>
                <button
                  onClick={handleRestore}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all text-xs font-semibold disabled:opacity-50"
                  title="Geri Yükle"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Geri Yükle</span>
                </button>
                
                <button
                  onClick={handlePermanentDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all text-xs font-semibold disabled:opacity-50"
                  title="Kalıcı sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kalıcı Sil</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* GENEL FİNANS ÖZETİ - Koyu Tonlar */}
      <div className="bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 rounded-2xl p-5 shadow-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-emerald-300" />
            Genel Finans Ozeti
          </h3>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
            <span className="text-xs text-emerald-100">Toplam Odeme Orani</span>
            <span className="text-white font-bold">
              %{financeSummary.overall.total > 0 ? Math.round((financeSummary.overall.paid / financeSummary.overall.total) * 100) : 0}
            </span>
          </div>
        </div>
        
        {/* Üst Satır - Genel Toplamlar */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-center shadow-lg border border-emerald-400/30">
            <div className="text-emerald-100 text-xs mb-1 flex items-center justify-center gap-1 font-medium">
              <DollarSign className="w-3 h-3" />
              TOPLAM SATIS
            </div>
            <div className="text-white text-2xl font-bold drop-shadow-md">
              ₺{financeSummary.overall.total.toLocaleString('tr-TR')}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-center shadow-lg border border-green-400/30">
            <div className="text-green-100 text-xs mb-1 flex items-center justify-center gap-1 font-medium">
              <CreditCard className="w-3 h-3" />
              TAHSIL EDILEN
            </div>
            <div className="text-white text-2xl font-bold drop-shadow-md">
              ₺{financeSummary.overall.paid.toLocaleString('tr-TR')}
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 text-center shadow-lg border border-orange-400/30">
            <div className="text-orange-100 text-xs mb-1 flex items-center justify-center gap-1 font-medium">
              <Clock className="w-3 h-3" />
              GENEL BORC
            </div>
            <div className="text-white text-2xl font-bold drop-shadow-md">
              ₺{financeSummary.overall.remaining.toLocaleString('tr-TR')}
            </div>
          </div>
        </div>
        
        {/* Alt Satır - Kategori Detayları */}
        <div className="grid grid-cols-2 gap-4">
          {/* Eğitim Finans */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-emerald-300" />
              <span className="text-white font-semibold text-sm">Egitim Finans</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-emerald-200 text-[10px]">Toplam</div>
                <div className="text-white font-bold text-sm">₺{financeSummary.education.total.toLocaleString('tr-TR')}</div>
              </div>
              <div>
                <div className="text-green-200 text-[10px]">Odenen</div>
                <div className="text-green-300 font-bold text-sm">₺{financeSummary.education.paid.toLocaleString('tr-TR')}</div>
              </div>
              <div>
                <div className="text-orange-200 text-[10px]">Kalan</div>
                <div className="text-orange-300 font-bold text-sm">₺{financeSummary.education.remaining.toLocaleString('tr-TR')}</div>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div 
                className="bg-emerald-400 rounded-full h-2 transition-all" 
                style={{ width: `${financeSummary.education.total > 0 ? Math.min(100, (financeSummary.education.paid / financeSummary.education.total) * 100) : 0}%` }}
              />
            </div>
          </div>
          
          {/* Diğer Satışlar */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-teal-300" />
              <span className="text-white font-semibold text-sm">Diger Satislar</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-teal-200 text-[10px]">Toplam</div>
                <div className="text-white font-bold text-sm">₺{financeSummary.other.total.toLocaleString('tr-TR')}</div>
              </div>
              <div>
                <div className="text-green-200 text-[10px]">Odenen</div>
                <div className="text-green-300 font-bold text-sm">₺{financeSummary.other.paid.toLocaleString('tr-TR')}</div>
              </div>
              <div>
                <div className="text-orange-200 text-[10px]">Kalan</div>
                <div className="text-orange-300 font-bold text-sm">₺{financeSummary.other.remaining.toLocaleString('tr-TR')}</div>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div 
                className="bg-teal-400 rounded-full h-2 transition-all" 
                style={{ width: `${financeSummary.other.total > 0 ? Math.min(100, (financeSummary.other.paid / financeSummary.other.total) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TAB MENÜSÜ - 4 Tab: Öğrenci Profili, Eğitim Ödemeleri, Diğer Satışlar, Notlar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-gradient-to-r from-blue-50 via-emerald-50 to-indigo-50 rounded-xl shadow-sm border border-emerald-200 p-2">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 rounded-lg p-1 gap-1.5">
            {/* Öğrenci Profili */}
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 rounded-lg py-3 px-2 font-semibold transition-all
                data-[state=inactive]:bg-blue-100 data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <UserCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Ogrenci Profili</span>
              <span className="sm:hidden">Profil</span>
            </TabsTrigger>
            
            {/* Eğitim Ödemeleri */}
            <TabsTrigger 
              value="education" 
              className="flex items-center gap-2 rounded-lg py-3 px-2 font-semibold transition-all
                data-[state=inactive]:bg-emerald-100 data-[state=inactive]:text-emerald-700 data-[state=inactive]:hover:bg-emerald-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <GraduationCap className="w-5 h-5" />
              <span className="hidden sm:inline">Egitim Odemeleri</span>
              <span className="sm:hidden">Egitim</span>
            </TabsTrigger>
            
            {/* Diğer Satışlar */}
            <TabsTrigger 
              value="other" 
              className="flex items-center gap-2 rounded-lg py-3 px-2 font-semibold transition-all
                data-[state=inactive]:bg-teal-100 data-[state=inactive]:text-teal-700 data-[state=inactive]:hover:bg-teal-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Package className="w-5 h-5" />
              <span className="hidden sm:inline">Diger Satislar</span>
              <span className="sm:hidden">Diger</span>
            </TabsTrigger>
            
            {/* Notlar */}
            <TabsTrigger 
              value="notes" 
              className="flex items-center gap-2 rounded-lg py-3 px-2 font-semibold transition-all
                data-[state=inactive]:bg-indigo-100 data-[state=inactive]:text-indigo-700 data-[state=inactive]:hover:bg-indigo-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <StickyNote className="w-5 h-5" />
              <span className="hidden sm:inline">Notlar</span>
              <span className="sm:hidden">Not</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB İÇERİKLERİ */}
        <div className="mt-6">
          {/* Öğrenci Profili */}
          <TabsContent value="profile">
            <StudentOverviewTab student={student} onRefresh={fetchStudentData} />
          </TabsContent>

          {/* Eğitim Ödemeleri */}
          <TabsContent value="education">
            <StudentFinanceTab student={student} onRefresh={fetchStudentData} tabMode="education" />
          </TabsContent>

          {/* Diğer Satışlar */}
          <TabsContent value="other">
            <StudentFinanceTab student={student} onRefresh={fetchStudentData} tabMode="other" />
          </TabsContent>

          {/* Notlar */}
          <TabsContent value="notes">
            <StudentNotesTab student={student} onRefresh={fetchStudentData} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Photo Upload Modal */}
      <ImageUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onUploadComplete={handlePhotoUpload}
        studentId={student?.id}
        currentImageUrl={student?.photo_url}
      />

      {/* Admin Password Modal for Delete */}
      <AdminPasswordModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteType(null);
        }}
        onConfirm={async () => {
          if (deleteType === 'soft') {
            await executeSoftDelete();
          } else if (deleteType === 'hard') {
            await executePermanentDelete();
          }
        }}
        title={deleteType === 'hard' ? '⛔ KALICI SİLME ONAYI' : 'Öğrenci Silme Onayı'}
        description={
          deleteType === 'hard'
            ? `"${student?.first_name} ${student?.last_name}" öğrencisini KALICI olarak silmek için admin şifrenizi girin.\n\n⚠️ Bu işlem GERİ ALINAMAZ!\n\nTÜM veriler silinecek:\n• Öğrenci bilgileri\n• Taksit kayıtları\n• Ödeme geçmişi\n• Ciro verileri`
            : `"${student?.first_name} ${student?.last_name}" öğrencisini silmek için admin şifrenizi girin. Tahsil edilen ödemeler korunacak, bekleyen taksitler iptal edilecek.`
        }
        confirmText={deleteType === 'hard' ? '⛔ KALICI SİL' : 'Öğrenciyi Sil'}
        loading={isDeleting}
        isDanger
      />
    </div>
  );
}
