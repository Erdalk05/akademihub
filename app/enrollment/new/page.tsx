'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, Save, CheckCircle, RotateCcw, ArrowLeft, ArrowRight,
  AlertCircle, User, Users, GraduationCap, FileText, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useEnrollmentStore } from '@/components/enrollment/store';
import { StudentSection } from '@/components/enrollment/sections/StudentSection';
import { GuardianSection } from '@/components/enrollment/sections/GuardianSection';
import { EducationSection } from '@/components/enrollment/sections/EducationSection';
import { PaymentSection } from '@/components/enrollment/sections/PaymentSection';
import { ContractSection } from '@/components/enrollment/sections/ContractSection';
import { PrintLayout } from '@/components/enrollment/PrintLayout';
import { createEnrollment } from '@/components/enrollment/actions';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Ogrenci', icon: User },
  { id: 2, title: 'Veli', icon: Users },
  { id: 3, title: 'Egitim & Odeme', icon: GraduationCap },
  { id: 4, title: 'Sozlesme', icon: FileText },
];

export default function NewEnrollmentPage() {
  const store = useEnrollmentStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedStudentNo, setSavedStudentNo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Manuel hydration - store'u client tarafında hydrate et
    useEnrollmentStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  const handlePrint = () => setShowPrint(true);

  const handleReset = () => {
    if (confirm('Form sifirlanacak. Emin misiniz?')) {
      store.reset();
      setCurrentStep(1);
      setIsSaved(false);
      setSavedStudentNo(null);
      setError(null);
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
      
      const result = await createEnrollment(enrollmentData);
      
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

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#075E54] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-white">Yukleniyor...</span>
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
                  Yeni Ogrenci Kaydi
                </h1>
                <p className="text-sm text-white/70">
                  {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
                    Kaydi Tamamla
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
