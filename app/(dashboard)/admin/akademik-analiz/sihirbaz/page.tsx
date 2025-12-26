'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SinavSihirbazi } from '@/lib/sinavlar/kazanim';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore } from '@/lib/store/academicYearStore';
import { getSupabaseClient } from '@/lib/supabase/client';

// Öğrenci tipi
interface Student {
  id: string;
  ogrenciNo: string;
  ad: string;
  soyad: string;
  sinif: string;
}

export default function SihirbazPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ogrenciListesi, setOgrenciListesi] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  
  // Store'lardan organization ve academic year al
  const { currentOrganization } = useOrganizationStore();
  const { selectedYear } = useAcademicYearStore();

  // Client-side check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Öğrenci listesini Supabase'den çek
  useEffect(() => {
    const loadStudents = async () => {
      if (!currentOrganization?.id) {
        console.log('⚠️ Organization ID yok, öğrenci listesi yüklenemiyor');
        setIsLoadingStudents(false);
        return;
      }

      try {
        setIsLoadingStudents(true);
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
          .from('students')
          .select('id, student_no, first_name, last_name, class')
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'active')
          .order('first_name', { ascending: true });

        if (error) {
          console.error('❌ Öğrenci listesi yüklenemedi:', error);
          setOgrenciListesi([]);
        } else {
          // Veriyi dönüştür
          const students: Student[] = (data || []).map((s: any) => ({
            id: s.id,
            ogrenciNo: s.student_no || '',
            ad: s.first_name || '',
            soyad: s.last_name || '',
            sinif: s.class || ''
          }));
          
          console.log('✅ Öğrenci listesi yüklendi:', students.length, 'öğrenci');
          setOgrenciListesi(students);
        }
      } catch (err) {
        console.error('❌ Öğrenci yükleme hatası:', err);
        setOgrenciListesi([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    if (isClient) {
      loadStudents();
    }
  }, [isClient, currentOrganization?.id]);

  // Sihirbaz tamamlandığında - SUPABASE'E KAYDET
  const handleComplete = async (data: {
    sinavBilgisi: any;
    cevapAnahtari: any[];
    ogrenciSonuclari: any[];
  }) => {
    setIsSaving(true);
    
    try {
      console.log('📤 Supabase\'e kaydediliyor:', {
        sinav: data.sinavBilgisi.ad,
        cevapSayisi: data.cevapAnahtari.length,
        ogrenciSayisi: data.ogrenciSonuclari.length
      });
      
      // API'ye gönder
      const response = await fetch('/api/akademik-analiz/wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sinavBilgisi: data.sinavBilgisi,
          cevapAnahtari: data.cevapAnahtari,
          ogrenciSonuclari: data.ogrenciSonuclari,
          organizationId: currentOrganization?.id || null,
          academicYearId: null // selectedYear bir string (örn: "2024-2025")
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Kayıt başarısız');
      }
      
      console.log('✅ Supabase kaydı başarılı:', result);

      // Başarılı mesaj
      alert(`✅ Sınav başarıyla kaydedildi!\n\n📊 ${data.ogrenciSonuclari.length} öğrenci\n📝 ${data.cevapAnahtari.length} soru\n📈 Ortalama Net: ${result.exam.averageNet}`);
      
      // Sonuçlar sayfasına yönlendir
      router.push(`/admin/akademik-analiz/sonuclar?examId=${result.exam.id}`);

    } catch (error: any) {
      console.error('❌ Kayıt hatası:', error);
      alert('Kayıt sırasında bir hata oluştu: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // SSR durumunda loading göster
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Öğrenci yükleme durumu */}
      {isLoadingStudents && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          Öğrenci listesi yükleniyor...
        </div>
      )}
      
      {/* Öğrenci sayısı gösterimi */}
      {!isLoadingStudents && ogrenciListesi.length > 0 && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm">
          ✅ {ogrenciListesi.length} öğrenci yüklendi
        </div>
      )}
      
      {!isLoadingStudents && ogrenciListesi.length === 0 && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm">
          ⚠️ Sistemde kayıtlı öğrenci bulunamadı
        </div>
      )}

      <SinavSihirbazi
        organizationId={currentOrganization?.id || "demo-org"}
        academicYearId={selectedYear || "2024-2025"}
        ogrenciListesi={ogrenciListesi}
        savedSablonlar={[]}
        onComplete={handleComplete}
      />
    </div>
  );
}
