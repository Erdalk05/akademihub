'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SinavSihirbazi } from '@/lib/sinavlar/kazanim';

export default function SihirbazPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Client-side check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sihirbaz tamamlandığında
  const handleComplete = async (data: {
    sinavBilgisi: any;
    cevapAnahtari: any[];
    ogrenciSonuclari: any[];
  }) => {
    try {
      // Demo mod - gerçek kayıt yerine konsola yazdır
      console.log('Sınav verisi:', data);
      
      // LocalStorage'a SADECE ÖZET kaydet (tam veri çok büyük!)
      const savedExams = JSON.parse(localStorage.getItem('akademihub_exams') || '[]');
      
      // Sadece özet veri (cevaplar ve detayları hariç)
      const ozetSonuclar = data.ogrenciSonuclari.slice(0, 20).map((s: any) => ({
        ogrenciNo: s.ogrenciNo,
        ogrenciAdi: s.ogrenciAdi,
        toplamNet: s.toplamNet,
        siralama: s.siralama
      }));
      
      const newExam = {
        id: Date.now().toString(),
        ad: data.sinavBilgisi.ad,
        tarih: data.sinavBilgisi.tarih,
        tip: data.sinavBilgisi.tip,
        toplamSoru: data.cevapAnahtari.length,
        toplamOgrenci: data.ogrenciSonuclari.length,
        ortalamaNet: data.ogrenciSonuclari.length > 0 
          ? (data.ogrenciSonuclari.reduce((sum: number, s: any) => sum + s.toplamNet, 0) / data.ogrenciSonuclari.length).toFixed(2)
          : 0,
        ilk20Ogrenci: ozetSonuclar,
        createdAt: new Date().toISOString()
      };
      
      // En fazla 10 sınav tut (eski olanları sil)
      if (savedExams.length >= 10) {
        savedExams.shift(); // En eskiyi sil
      }
      
      savedExams.push(newExam);
      
      try {
        localStorage.setItem('akademihub_exams', JSON.stringify(savedExams));
      } catch (storageError) {
        // localStorage doluysa tüm eski verileri temizle
        console.warn('LocalStorage dolu, temizleniyor...');
        localStorage.removeItem('akademihub_exams');
        localStorage.setItem('akademihub_exams', JSON.stringify([newExam]));
      }

      // Başarılı mesaj
      alert(`✅ Sınav başarıyla kaydedildi!\n\n📊 ${data.ogrenciSonuclari.length} öğrenci\n📝 ${data.cevapAnahtari.length} soru`);
      
      // Sonuçlar sayfasına yönlendir
      router.push('/admin/akademik-analiz/sonuclar');

    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      alert('Kayıt sırasında bir hata oluştu: ' + error.message);
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
    <SinavSihirbazi
      organizationId="demo-org"
      academicYearId="2024-2025"
      ogrenciListesi={[]}
      savedSablonlar={[]}
      onComplete={handleComplete}
    />
  );
}
