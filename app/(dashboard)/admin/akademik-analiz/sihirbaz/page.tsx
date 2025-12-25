'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SinavSihirbazi } from '@/lib/sinavlar/kazanim';
import { useOrganizationStore } from '@/lib/store';
import { useAcademicYearStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

export default function SihirbazPage() {
  const router = useRouter();
  const { selectedOrganization } = useOrganizationStore();
  const { selectedYearId } = useAcademicYearStore();
  const [ogrenciler, setOgrenciler] = useState<any[]>([]);
  const [sablonlar, setSablonlar] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Öğrenci listesini yükle
  useEffect(() => {
    const loadData = async () => {
      if (!selectedOrganization?.id) return;
      
      const supabase = createClient();

      // Öğrencileri yükle
      const { data: students } = await supabase
        .from('students')
        .select('id, student_no, first_name, last_name, class_id, classes(name)')
        .eq('organization_id', selectedOrganization.id)
        .eq('is_active', true);

      if (students) {
        setOgrenciler(students.map(s => ({
          id: s.id,
          ogrenciNo: s.student_no,
          ad: s.first_name,
          soyad: s.last_name,
          sinif: (s.classes as any)?.name || ''
        })));
      }

      // Şablonları yükle
      const { data: templates } = await supabase
        .from('optik_sablonlari')
        .select('*')
        .eq('organization_id', selectedOrganization.id)
        .eq('is_active', true);

      if (templates) {
        setSablonlar(templates.map(t => ({
          id: t.id,
          sablonAdi: t.sablon_adi,
          alanTanimlari: t.alan_tanimlari,
          cevapBaslangic: t.cevap_baslangic,
          toplamSoru: t.toplam_soru,
          kitapcikPozisyon: t.kitapcik_pozisyon,
          isDefault: t.is_default,
          isActive: t.is_active
        })));
      }

      setIsLoading(false);
    };

    loadData();
  }, [selectedOrganization]);

  // Sihirbaz tamamlandığında
  const handleComplete = async (data: {
    sinavBilgisi: any;
    cevapAnahtari: any[];
    ogrenciSonuclari: any[];
  }) => {
    try {
      const supabase = createClient();

      // Sınavı oluştur
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          name: data.sinavBilgisi.ad,
          exam_date: data.sinavBilgisi.tarih,
          description: data.sinavBilgisi.aciklama,
          total_questions: data.cevapAnahtari.length,
          status: 'completed',
          organization_id: selectedOrganization?.id,
          academic_year_id: selectedYearId,
          answer_key: Object.fromEntries(data.cevapAnahtari.map(c => [c.soruNo.toString(), c.dogruCevap]))
        })
        .select()
        .single();

      if (examError) throw examError;

      // Cevap anahtarını kaydet
      if (exam) {
        const cevapAnahtariRows = data.cevapAnahtari.map(c => ({
          exam_id: exam.id,
          soru_no: c.soruNo,
          dogru_cevap: c.dogruCevap,
          ders_kodu: c.dersKodu,
          kazanim_kodu: c.kazanimKodu,
          kazanim_metni: c.kazanimMetni,
          konu_adi: c.konuAdi,
          organization_id: selectedOrganization?.id
        }));

        await supabase.from('sinav_cevap_anahtari').insert(cevapAnahtariRows);

        // Öğrenci sonuçlarını kaydet (batch)
        // TODO: Öğrenci eşleştirmesi yapıldıktan sonra
      }

      // Sonuçlar sayfasına yönlendir
      router.push(`/admin/akademik-analiz/sonuclar?exam=${exam?.id}`);

    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      alert('Kayıt sırasında bir hata oluştu: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!selectedOrganization?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Lütfen bir kurum seçin</p>
      </div>
    );
  }

  return (
    <SinavSihirbazi
      organizationId={selectedOrganization.id}
      academicYearId={selectedYearId || ''}
      ogrenciListesi={ogrenciler}
      savedSablonlar={sablonlar}
      onComplete={handleComplete}
    />
  );
}
