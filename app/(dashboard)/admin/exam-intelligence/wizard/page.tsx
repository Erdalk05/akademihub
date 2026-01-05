'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SinavSihirbazi from '@/lib/sinavlar/kazanim/SinavSihirbazi';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore } from '@/lib/store/academicYearStore';
import { getBrowserClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface Student {
  id: string;
  ogrenciNo: string;
  ad: string;
  soyad: string;
  sinif: string;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function SihirbazPage() {
  const router = useRouter();

  // Global Stores
  const { currentOrganization } = useOrganizationStore();
  const { selectedYear } = useAcademicYearStore();

  // Local State
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ogrenciListesi, setOgrenciListesi] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // ==========================================================================
  // CLIENT CHECK
  // ==========================================================================

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ==========================================================================
  // LOAD STUDENTS
  // ==========================================================================

  useEffect(() => {
    if (!isClient) return;

    if (!currentOrganization?.id) {
      console.warn('⚠️ Organization yok, öğrenci yüklenmedi');
      setIsLoadingStudents(false);
      return;
    }

    const loadStudents = async () => {
      setIsLoadingStudents(true);
      const supabase = getBrowserClient();

      const { data, error } = await supabase
        .from('students')
        .select('id, student_no, first_name, last_name, class')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active')
        .order('first_name');

      if (error) {
        console.error('❌ Öğrenci yükleme hatası:', error);
        setOgrenciListesi([]);
      } else {
        setOgrenciListesi(
          (data || []).map((s: any) => ({
            id: s.id,
            ogrenciNo: s.student_no ?? '',
            ad: s.first_name ?? '',
            soyad: s.last_name ?? '',
            sinif: s.class ?? '',
          }))
        );
      }

      setIsLoadingStudents(false);
    };

    loadStudents();
  }, [isClient, currentOrganization?.id]);

  // ==========================================================================
  // SAVE EXAM
  // ==========================================================================

  const handleComplete = async (data: {
    sinavBilgisi: any;
    cevapAnahtari: any[];
    ogrenciSonuclari: any[];
  }) => {
    if (!currentOrganization?.id) {
      alert('Kurum bilgisi bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/exam-intelligence/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sinavBilgisi: data.sinavBilgisi,
          cevapAnahtari: data.cevapAnahtari,
          ogrenciSonuclari: data.ogrenciSonuclari,
          organizationId: currentOrganization.id,
          academicYearId: selectedYear || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kayıt başarısız');
      }

      alert('✅ Sınav başarıyla kaydedildi');
      router.push('/admin/exam-intelligence/sinavlar');

    } catch (error: any) {
      console.error('❌ Kayıt hatası:', error);
      alert(error.message || 'Bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // SSR guard
  if (!isClient) {
    return null;
  }

  // Organization yoksa uyarı
  if (!currentOrganization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Kurum Seçilmedi</h2>
          <p className="text-gray-600 mb-6">Lütfen bir kurum seçin veya tekrar giriş yapın.</p>
          <button
            onClick={() => router.push('/admin')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // Ana içerik
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Loading indicator */}
      {isLoadingStudents && (
        <div className="fixed top-4 right-4 z-50 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm shadow-md flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Öğrenciler yükleniyor...
        </div>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-4">
            <svg className="w-6 h-6 animate-spin text-cyan-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-lg font-medium text-gray-700">Sınav kaydediliyor...</span>
          </div>
        </div>
      )}

      {/* Sınav Sihirbazı */}
      <SinavSihirbazi
        organizationId={currentOrganization.id}
        academicYearId={selectedYear}
        ogrenciListesi={ogrenciListesi}
        savedSablonlar={[]}
        onComplete={handleComplete}
      />
    </div>
  );
}

