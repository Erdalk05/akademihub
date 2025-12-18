'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Printer, Save, CheckCircle, RotateCcw, ArrowLeft, ArrowRight,
  AlertCircle, User, Users, GraduationCap, FileText, Sparkles, RefreshCw, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEnrollmentStore } from '@/components/enrollment/store';
import { StudentSection } from '@/components/enrollment/sections/StudentSection';
import { GuardianSection } from '@/components/enrollment/sections/GuardianSection';
import { EducationSection } from '@/components/enrollment/sections/EducationSection';
import { PaymentSection } from '@/components/enrollment/sections/PaymentSection';
import { ContractSection } from '@/components/enrollment/sections/ContractSection';
import { PrintLayout } from '@/components/enrollment/PrintLayout';
import { createEnrollment } from '@/components/enrollment/actions';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { StudentSearchModal } from '@/components/enrollment/ui/StudentSearchModal';
import toast from 'react-hot-toast';

// Loading component for Suspense
function EnrollmentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Kayıt formu yükleniyor...</p>
      </div>
    </div>
  );
}

const STEPS = [
  { id: 1, title: 'Ogrenci', icon: User },
  { id: 2, title: 'Veli', icon: Users },
  { id: 3, title: 'Egitim & Odeme', icon: GraduationCap },
  { id: 4, title: 'Sozlesme', icon: FileText },
];

// Akademik yılları hesapla
const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const getNextAcademicYear = () => {
  const current = getCurrentAcademicYear();
  const [start] = current.split('-').map(Number);
  return `${start + 1}-${start + 2}`;
};

// Ana içerik bileşeni - useSearchParams kullanan
function EnrollmentContent() {
  const store = useEnrollmentStore();
  const { currentOrganization } = useOrganizationStore();
  const searchParams = useSearchParams();
  const editStudentId = searchParams.get('edit');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedStudentNo, setSavedStudentNo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  
  // Kayıt Yenileme
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [isRenewalMode, setIsRenewalMode] = useState(false);
  const [renewalStudentName, setRenewalStudentName] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Düzenleme modu - URL'de edit parametresi varsa öğrenciyi yükle
  useEffect(() => {
    if (!isHydrated) return;
    
    if (editStudentId) {
      // URL'de edit ID varsa ve store'daki ID farklıysa yükle
      if (store.existingStudentId !== editStudentId) {
        console.log('[Enrollment] Loading student for edit:', editStudentId);
        loadStudentForEdit(editStudentId);
      } else {
        // Aynı öğrenci zaten yüklü
        setIsEditMode(true);
      }
    } else if (!editStudentId && store.existingStudentId) {
      // URL'de edit yok ama store'da var - yeni kayıt modu, store'u temizle
      console.log('[Enrollment] Clearing store for new enrollment');
      store.reset();
    }
  }, [editStudentId, isHydrated]);

  const loadStudentForEdit = async (studentId: string) => {
    setLoadingEdit(true);
    console.log('[Enrollment] loadStudentForEdit started:', studentId);
    
    try {
      // 1. Öğrenci bilgilerini getir
      let studentData = null;
      
      const response = await fetch(`/api/students/${studentId}`);
      console.log('[Enrollment] Student API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        studentData = data.data || data;
        console.log('[Enrollment] Student data loaded:', studentData?.first_name, studentData?.last_name);
      } else {
        // Fallback - öğrenci listesinden bul
        console.log('[Enrollment] Trying fallback...');
        const listRes = await fetch('/api/students');
        const listData = await listRes.json();
        studentData = (listData.data || []).find((s: any) => s.id === studentId);
      }
      
      if (!studentData) {
        console.error('[Enrollment] Student not found!');
        toast.error('Öğrenci bulunamadı!');
        setLoadingEdit(false);
        return;
      }

      // 2. Taksit bilgilerini getir
      let installmentsData: any[] = [];
      try {
        const instRes = await fetch(`/api/installments?student_id=${studentId}`);
        if (instRes.ok) {
          const instResult = await instRes.json();
          installmentsData = instResult.data || [];
        }
      } catch (e) {
        console.warn('Taksit bilgileri yüklenemedi:', e);
      }

      // 3. Taksit bilgilerinden ödeme planını hesapla
      if (installmentsData.length > 0) {
        const totalFee = installmentsData.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0);
        const paidAmount = installmentsData.reduce((sum: number, inst: any) => sum + (inst.paid_amount || 0), 0);
        const downPaymentInst = installmentsData.find((inst: any) => inst.installment_no === 0);
        const regularInstallments = installmentsData.filter((inst: any) => inst.installment_no > 0);
        
        // studentData'ya ödeme bilgilerini ekle
        studentData.total_amount = totalFee;
        studentData.paid_amount = paidAmount;
        studentData.down_payment = downPaymentInst?.amount || 0;
        studentData.installment_count = regularInstallments.length;
        studentData.monthly_installment = regularInstallments.length > 0 ? regularInstallments[0].amount : 0;
        studentData.first_installment_date = regularInstallments.length > 0 ? regularInstallments[0].due_date : '';
        
        console.log('[Enrollment] Taksit bilgileri yüklendi:', { totalFee, paidAmount, installmentCount: regularInstallments.length });
      } else {
        // Taksit yoksa students tablosundaki değerleri kullan
        console.log('[Enrollment] Taksit bulunamadı, students tablosundan değerler kullanılacak:', {
          total_amount: studentData.total_amount,
          balance: studentData.balance
        });
        
        // Eğer students tablosunda da değer yoksa varsayılan değerler kullan
        if (!studentData.total_amount && !studentData.balance) {
          console.warn('[Enrollment] ⚠️ Öğrenci için ödeme bilgisi bulunamadı!');
        }
      }
      
      // Store'a düzenleme için yükle
      store.loadForEditing(studentData);
      setIsEditMode(true);
      
      const studentName = `${studentData.first_name} ${studentData.last_name}`;
      const taksitInfo = installmentsData.length > 0 
        ? ` (${installmentsData.length} taksit, ₺${(studentData.total_amount || 0).toLocaleString('tr-TR')})` 
        : '';
      
      toast.success(`${studentName} bilgileri yüklendi${taksitInfo}. Düzenleyebilirsiniz.`);
      
    } catch (err: any) {
      console.error('Öğrenci yükleme hatası:', err);
      toast.error('Öğrenci yüklenirken hata oluştu');
    } finally {
      setLoadingEdit(false);
    }
  };

  // Kayıt yenileme - öğrenci seçildiğinde
  const handleRenewalStudentSelect = (student: any) => {
    const nextYear = getNextAcademicYear();
    store.loadFromExistingStudent(student, nextYear);
    setIsRenewalMode(true);
    setRenewalStudentName(`${student.first_name} ${student.last_name}`);
    toast.success(`${student.first_name} ${student.last_name} bilgileri yüklendi. Akademik yıl: ${nextYear}`);
  };

  const handlePrint = () => setShowPrint(true);

  const handleReset = () => {
    const message = isEditMode 
      ? 'Düzenleme iptal edilecek ve form sıfırlanacak. Emin misiniz?' 
      : 'Form sifirlanacak. Emin misiniz?';
    
    if (confirm(message)) {
      store.reset();
      setCurrentStep(1);
      setIsSaved(false);
      setSavedStudentNo(null);
      setError(null);
      setIsRenewalMode(false);
      setRenewalStudentName(null);
      setIsEditMode(false);
      
      // URL'den edit parametresini kaldır
      if (editStudentId) {
        window.history.replaceState({}, '', '/enrollment/new');
      }
    }
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    
    try {
      if (!store.student.firstName || !store.student.lastName) {
        throw new Error('Ogrenci adi ve soyadi zorunludur.');
      }
      
      if (store.payment.netFee > 0 && store.payment.installmentCount > 0) {
        store.calculateInstallments();
      }
      
      const enrollmentData = {
        student: store.student,
        guardians: store.guardians,
        education: store.education,
        payment: store.payment,
        contract: store.contract,
        status: 'approved' as const
      };
      
      // Çoklu kurum desteği: Aktif kurum ID'sini gönder
      // Düzenleme modu: Mevcut öğrenci ID'si varsa güncelleme yapar
      const result = await createEnrollment(enrollmentData, currentOrganization?.id, store.existingStudentId);
      
      // Null check - result undefined olabilir
      if (!result) {
        throw new Error('Sunucu yanit vermedi. Lutfen tekrar deneyin.');
      }
      
      if (result.success && result.data) {
        const studentNo = result.data.studentNumber || result.data.student?.student_no;
        setIsSaved(true);
        setSavedStudentNo(studentNo);
        toast.success(`Kayit basarili! ${store.student.firstName} ${store.student.lastName}`);
        setTimeout(() => setShowPrint(true), 500);
      } else {
        const errorMsg = result.error || 'Kayit olusturulamadi';
        setError(errorMsg);
        toast.error(`Hata: ${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Beklenmeyen bir hata olustu';
      setError(errorMsg);
      toast.error(`Hata: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => currentStep < 4 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  if (!isHydrated || loadingEdit) {
    return (
      <div className="min-h-screen bg-[#075E54] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-lg">
            {loadingEdit ? 'Öğrenci bilgileri yükleniyor...' : 'Yukleniyor...'}
          </span>
        </div>
      </div>
    );
  }

  if (showPrint) {
    return <PrintLayout onClose={() => setShowPrint(false)} />;
  }

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#075E54] via-[#128C7E] to-[#25D366]">
      {/* Header - WhatsApp Style */}
      <header className="bg-[#075E54] shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/students" 
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#25D366]" />
                  {store.existingStudentId 
                    ? (store.education.studentType === 'renewal' ? 'Kayıt Yenileme' : 'Bilgi Güncelleme')
                    : 'Yeni Ogrenci Kaydi'}
                </h1>
                <p className="text-sm text-white/70">
                  {store.existingStudentId 
                    ? `${store.student.firstName} ${store.student.lastName} • ${store.student.studentNo}`
                    : new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Kayıt Yenileme Butonu */}
              <button
                onClick={() => setShowRenewalModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-all flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Kayıt Yenileme</span>
              </button>
              
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all flex items-center gap-2 text-sm font-medium"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Sifirla</span>
              </button>
              
              {isSaved && (
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white text-[#075E54] rounded-full transition-all flex items-center gap-2 text-sm font-bold hover:bg-gray-100"
                >
                  <Printer size={16} />
                  Yazdir
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Steps - WhatsApp Tabs Style */}
      <div className="bg-[#075E54] border-b border-white/10 pb-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex-1 py-3 text-center transition-all relative ${
                    isActive ? 'text-white' : isComplete ? 'text-[#25D366]' : 'text-white/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isComplete 
                        ? 'bg-[#25D366] text-white' 
                        : isActive 
                          ? 'bg-white text-[#075E54]' 
                          : 'bg-white/10 text-white/50'
                    }`}>
                      {isComplete ? <CheckCircle size={20} /> : <Icon size={20} />}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#25D366] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#25D366] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Kayıt Yenileme Bilgi Banner */}
      {isRenewalMode && renewalStudentName && !isSaved && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-amber-800">Kayıt Yenileme Modu</p>
                <p className="text-amber-700">
                  <strong>{renewalStudentName}</strong> için kayıt yenileniyor.
                  Akademik Yıl: <strong>{store.education.academicYear}</strong>
                </p>
              </div>
              <button 
                onClick={handleReset}
                className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-lg text-sm font-medium transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bilgi Güncelleme Bilgi Banner */}
      {store.existingStudentId && store.education.studentType === 'edit' && !isSaved && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-blue-800">Bilgi Güncelleme Modu</p>
                <p className="text-blue-700">
                  <strong>{store.student.firstName} {store.student.lastName}</strong> - #{store.student.studentNo}
                </p>
                <p className="text-blue-600 text-sm">
                  💡 Kişisel bilgiler güncellenir. Taksit planı DEĞİŞMEZ - bunun için "Yeniden Taksitlendir" kullanın.
                </p>
              </div>
              <button 
                onClick={handleReset}
                className="px-3 py-1.5 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-lg text-sm font-medium transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isSaved && savedStudentNo && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="p-4 bg-[#DCF8C6] border-l-4 border-[#25D366] rounded-r-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-[#075E54]">Kayit Basarili!</p>
                <p className="text-[#128C7E]">
                  {store.student.firstName} {store.student.lastName} - No: <span className="font-mono font-bold">{savedStudentNo}</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <button 
                onClick={handlePrint}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full flex items-center gap-2 font-medium transition-all"
              >
                <Printer size={16} />
                Yazdir
              </button>
              <button 
                onClick={handleReset}
                className="px-4 py-2 bg-[#075E54] hover:bg-[#128C7E] text-white rounded-full flex items-center gap-2 font-medium transition-all"
              >
                <User size={16} />
                Yeni Kayit
              </button>
              <Link 
                href="/students"
                className="px-4 py-2 bg-white border border-[#25D366] text-[#075E54] rounded-full flex items-center gap-2 font-medium hover:bg-[#DCF8C6] transition-all"
              >
                <Users size={16} />
                Ogrenci Listesi
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-2xl flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-red-700">Hata!</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xl px-2">x</button>
          </div>
        </div>
      )}

      {/* Main Content - Chat Bubble Style */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-[#DCF8C6] px-6 py-4 border-b border-[#25D366]/20">
            <div className="flex items-center gap-3">
              {React.createElement(STEPS[currentStep - 1].icon, { 
                className: "w-6 h-6 text-[#075E54]" 
              })}
              <div>
                <h2 className="text-lg font-bold text-[#075E54]">{STEPS[currentStep - 1].title} Bilgileri</h2>
                <p className="text-sm text-[#128C7E]">Adim {currentStep} / 4</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 min-h-[500px]">
            {currentStep === 1 && <StudentSection />}
            {currentStep === 2 && <GuardianSection />}
            {currentStep === 3 && (
              <div className="space-y-6">
                <EducationSection />
                <PaymentSection />
              </div>
            )}
            {currentStep === 4 && <ContractSection />}
          </div>

          {/* Navigation - WhatsApp Style */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                currentStep === 1 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'bg-white border border-[#25D366] text-[#075E54] hover:bg-[#DCF8C6]'
              }`}
            >
              <ArrowLeft size={18} />
              Geri
            </button>

            <div className="flex items-center gap-2">
              {/* Step Dots */}
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentStep === step.id 
                      ? 'bg-[#25D366] w-6' 
                      : currentStep > step.id 
                        ? 'bg-[#25D366]' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-medium shadow-lg transition-all"
              >
                Ileri
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  isSaved
                    ? 'bg-[#25D366] text-white'
                    : 'bg-[#075E54] hover:bg-[#128C7E] text-white shadow-lg'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kaydediliyor...
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle size={18} />
                    Tamamlandi!
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {store.existingStudentId && store.education.studentType === 'edit' 
                      ? 'Bilgileri Güncelle' 
                      : 'Kaydi Tamamla'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
      {/* Kayıt Yenileme Modal */}
      <StudentSearchModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onSelect={handleRenewalStudentSelect}
        currentAcademicYear={getCurrentAcademicYear()}
      />
    </div>
  );
}

// Sayfa export'u - Suspense ile sarılmış
export default function NewEnrollmentPage() {
  return (
    <Suspense fallback={<EnrollmentLoading />}>
      <EnrollmentContent />
    </Suspense>
  );
}
