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
  Camera
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
      const phone = student.parent_phone.replace(/\D/g, '');
      window.open(`https://wa.me/9${phone}`, '_blank');
    } else {
      toast.error('WhatsApp için telefon numarası bulunamadı');
    }
  };

  const handleEdit = () => {
    router.push(`/students/${studentId}/edit`);
  };

  const handleArchive = () => {
    if (confirm('Bu öğrenciyi arşivlemek istediğinizden emin misiniz?')) {
      toast.success('Öğrenci arşivlendi');
    }
  };

  // ⚠️ SADECE ADMIN ÖĞRENCİ SİLEBİLİR
  const handleDeleteStudent = async () => {
    // İlk önce yetki kontrolü
    if (!canDeleteStudent || !isAdmin) {
      toast.error('Bu işlem için yetkiniz yok. Sadece admin kullanıcılar öğrenci silebilir.');
      return;
    }

    // Üç aşamalı onay
    const confirmStep1 = confirm(
      `⚠️ DİKKAT: "${student?.first_name} ${student?.last_name}" öğrencisini silmek üzeresiniz.\n\n` +
      'Bu işlem geri alınamaz ve öğrencinin TÜM verileri silinecektir:\n' +
      '• Öğrenci bilgileri\n' +
      '• Taksit kayıtları\n' +
      '• Ödeme geçmişi\n' +
      '• Kayıt bilgileri\n\n' +
      'Devam etmek istiyor musunuz?'
    );

    if (!confirmStep1) return;

    const confirmStep2 = confirm(
      '⛔ SON UYARI!\n\n' +
      'Bu işlem GERİ ALINAMAZ. Öğrenci ve tüm ilişkili veriler kalıcı olarak silinecektir.\n\n' +
      'Silme işlemini ONAYLIYOR musunuz?'
    );

    if (!confirmStep2) return;

    // Silme işlemini başlat
    setIsDeleting(true);
    const toastId = toast.loading('Öğrenci siliniyor...');

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
        throw new Error(result.error || 'Silme işlemi başarısız oldu.');
      }

      toast.success('Öğrenci başarıyla silindi.', { id: toastId });
      
      // Öğrenci listesine yönlendir
      router.push('/students');
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
    const badges = {
      active: { label: '✅ Aktif Kayıt', className: 'bg-green-100 text-green-700 border-green-300' },
      inactive: { label: '⏸️ Pasif', className: 'bg-gray-100 text-gray-700 border-gray-300' },
      graduated: { label: '🎓 Mezun', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      suspended: { label: '⛔ Donduruldu', className: 'bg-red-100 text-red-700 border-red-300' },
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
      {/* HEADER BÖLÜMÜ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200 gap-4">
        <div className="flex gap-4 items-start">
          {/* Avatar / Photo */}
          <div className="relative group">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover shadow-lg border-2 border-white"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg flex-shrink-0">
                {initials}
          </div>
        )}
            {/* Upload Button Overlay */}
                  <button
              onClick={() => setShowPhotoModal(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
              <Camera className="w-6 h-6 text-white" />
                  </button>
              </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
              {student.class && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-300 bg-gray-50 text-gray-700">
                  {student.class}-{student.section || 'A'} Sınıfı
                      </span>
              )}
              {riskBadge && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${riskBadge.className}`}>
                  {riskBadge.label}
                      </span>
              )}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-600">
                #{student.student_no}
                      </span>
                    </div>
                  </div>
                </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCall}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Veli Ara</span>
          </button>
          <button
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
                    <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                    >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Düzenle</span>
                    </button>
                    <button
            onClick={handleArchive}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition text-sm font-medium"
                    >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Arşivle</span>
                    </button>
          
          {/* ⚠️ SİL BUTONU - SADECE ADMİN İÇİN GÖRÜNÜR */}
          {canDeleteStudent && isAdmin && (
            <button
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Öğrenciyi kalıcı olarak sil (Sadece Admin)"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isDeleting ? 'Siliniyor...' : 'Sil'}</span>
            </button>
          )}
              </div>
            </div>

      {/* TAB MENÜSÜ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white">
              <User className="w-4 h-4" />
              <span>Genel Bakış</span>
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
            <StudentOverviewTab student={student} />
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
    </div>
  );
}
