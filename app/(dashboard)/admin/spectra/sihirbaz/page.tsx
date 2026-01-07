'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SinavSihirbazi from '@/ESKI_SINAV_MODULU_ARSIV/sinavlar/kazanim/SinavSihirbazi';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore } from '@/lib/store/academicYearStore';
import { getBrowserClient } from '@/lib/supabase/client';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
// SPECTRA - YENİ SINAV EKLEME (WIZARD)
// ============================================================================

export default function SpectraSihirbazPage() {
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
  // SAVE EXAM - Spectra API'sine kaydet
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
      // Spectra Wizard API'sine kaydet
      const response = await fetch('/api/spectra/wizard', {
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
      router.push('/admin/spectra/sinavlar');

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
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Kurum Seçilmedi</h2>
          <p className="text-gray-500 mb-4">
            Sınav eklemek için önce bir kurum seçmeniz gerekiyor.
          </p>
          <Link
            href="/admin/spectra"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Spectra'ya Dön
          </Link>
        </div>
      </div>
    );
  }

  // Öğrenci yükleniyorsa
  if (isLoadingStudents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500">Öğrenci listesi yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Kayıt yapılıyorsa
  if (isSaving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500">Sınav kaydediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link
            href="/admin/spectra"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Yeni Sınav Ekle</h1>
            <p className="text-sm text-gray-500">{currentOrganization?.name}</p>
          </div>
        </div>
      </div>

      {/* Wizard Component */}
      <div className="p-4 md:p-6">
        <SinavSihirbazi
          ogrenciListesi={ogrenciListesi}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

