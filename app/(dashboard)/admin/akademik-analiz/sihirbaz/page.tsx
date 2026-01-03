'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SinavSihirbazi } from '@/lib/sinavlar/kazanim';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore } from '@/lib/store/academicYearStore';
import { getBrowserClient } from '@/lib/supabase/client';

/* =======================
   TYPES
======================= */
interface Student {
  id: string;
  ogrenciNo: string;
  ad: string;
  soyad: string;
  sinif: string;
}

/* =======================
   PAGE
======================= */
export default function SihirbazPage() {
  const router = useRouter();

  // GLOBAL STORES
  const { currentOrganization } = useOrganizationStore();
  const { selectedYear } = useAcademicYearStore();

  // LOCAL STATE
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ogrenciListesi, setOgrenciListesi] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  /* =======================
     CLIENT CHECK
  ======================= */
  useEffect(() => {
    setIsClient(true);
  }, []);

  /* =======================
     LOAD STUDENTS
  ======================= */
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

  /* =======================
     SAVE EXAM (CRITICAL)
  ======================= */
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
      const response = await fetch('/api/akademik-analiz/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sinavBilgisi: data.sinavBilgisi,
          cevapAnahtari: data.cevapAnahtari,
          ogrenciSonuclari: data.ogrenciSonuclari,
          organizationId: currentOrganization.id,
          academicYearId: selectedYear || null
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || 'Kayıt başarısız');
      }
  
      alert('✅ Sınav başarıyla kaydedildi');
      router.push('/admin/akademik-analiz/sonuclar');
  
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };
  

  /* =======================
   SAVE EXAM (CRITICAL)
======================= */
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
    const response = await fetch('/api/akademik-analiz/wizard', {
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
    router.push('/admin/akademik-analiz/sonuclar');

  } catch (error: any) {
    alert(error.message);
  } finally {
    setIsSaving(false);
  }
};

/* =======================
   RENDER
======================= */
if (!isClient) return null;

return (
  <div className="relative">
    {isLoadingStudents && (
      <div className="fixed top-4 right-4 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm">
        Öğrenciler yükleniyor...
      </div>
    )}

    {/* 🚨 ORGANIZATION YOKSA UYARI */}
    {!currentOrganization?.id && (
      <div className="p-6 text-center text-red-600">
        Kurum seçilmedi. Lütfen tekrar giriş yapın.
      </div>
    )}

    {/* ✅ ORGANIZATION VARSA SİHİRBAZ */}
    {currentOrganization?.id && (
      <SinavSihirbazi
        organizationId={currentOrganization.id}
        academicYearId={selectedYear}
        ogrenciListesi={ogrenciListesi}
        savedSablonlar={[]}
        onComplete={handleComplete}
      />
    )}
  </div>
);

