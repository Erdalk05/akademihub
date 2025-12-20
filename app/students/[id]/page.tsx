'use client';

import React, { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';

// Tab Components
import StudentOverviewTab from '@/components/student-detail/StudentOverviewTab';
import StudentFinanceTab from '@/components/student-detail/StudentFinanceTab';
import ImageUploadModal from '@/components/upload/ImageUploadModal';

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
  const [activeTab, setActiveTab] = useState('finance');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard' | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

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
          <div className="flex gap-5 items-center">
            {/* Avatar / Photo - Geliştirilmiş */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative">
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt={displayName}
                    className="h-24 w-24 rounded-2xl object-cover shadow-xl border-4 border-white ring-2 ring-emerald-200"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-white">
                    {initials}
                  </div>
                )}
                {/* Upload Button Overlay */}
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center">
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[10px] text-white font-medium">Değiştir</span>
                  </div>
                </button>
              </div>
              {/* Online/Status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white shadow-md flex items-center justify-center text-[10px] ${
                student.status === 'active' ? 'bg-emerald-500' : 
                student.status === 'inactive' ? 'bg-gray-400' : 
                student.status === 'graduated' ? 'bg-blue-500' : 'bg-red-400'
              }`}>
                {student.status === 'active' ? '✓' : student.status === 'graduated' ? '🎓' : ''}
              </div>
            </div>

            {/* Info - Geliştirilmiş */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
                {displayName}
              </h1>
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
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-600 shadow-sm font-mono">
                  #{student.student_no}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions - Geliştirilmiş */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCall}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold shadow-sm"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Veli Ara</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all text-sm font-semibold shadow-sm"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Bilgileri Güncelle</span>
            </button>
            <button
              onClick={handleViewHistory}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all text-sm font-semibold shadow-sm"
              title="Öğrencinin düzenleme geçmişi"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Geçmiş</span>
            </button>
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
            >
              <Archive className="w-4 h-4" />
              <span className="hidden sm:inline">Arşivle</span>
            </button>
            
            {/* ⚠️ SİL BUTONLARI - SADECE ADMİN İÇİN GÖRÜNÜR */}
            {canDeleteStudent && isAdmin && (student?.status as string) !== 'deleted' && (
              <>
                {/* Kaydı Sil (Soft Delete) */}
                <button
                  onClick={handleSoftDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-400 text-white hover:from-orange-600 hover:to-red-500 transition-all text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Kaydı sil (Veriler korunur)"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{isDeleting ? 'İşleniyor...' : 'Kaydı Sil'}</span>
                </button>
                
                {/* Kalıcı Sil (Hard Delete) */}
                <button
                  onClick={handlePermanentDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Kalıcı olarak sil (Tüm veriler silinir)"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Kalıcı Sil</span>
                </button>
              </>
            )}
            
            {/* 🔄 GERİ YÜKLE - Silinen öğrenci için */}
            {canDeleteStudent && isAdmin && (student?.status as string) === 'deleted' && (
              <>
                <button
                  onClick={handleRestore}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Öğrenciyi geri yükle"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Geri Yükle</span>
                </button>
                
                {/* Kalıcı Sil - Silinen öğrenci için de görünür */}
                <button
                  onClick={handlePermanentDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Kalıcı olarak sil"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Kalıcı Sil</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TAB MENÜSÜ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white">
              <User className="w-4 h-4" />
              <span>Öğrenci Kartı</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Wallet className="w-4 h-4" />
              <span>Finans & Ödeme</span>
            </TabsTrigger>
          </TabsList>
            </div>

        {/* TAB İÇERİKLERİ */}
        <div className="mt-6">
          <TabsContent value="overview">
            <StudentOverviewTab student={student} onRefresh={fetchStudentData} />
          </TabsContent>

          <TabsContent value="finance">
            <StudentFinanceTab student={student} onRefresh={fetchStudentData} />
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
