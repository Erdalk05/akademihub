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
      
      // LocalStorage'a kaydet (demo)
      const savedExams = JSON.parse(localStorage.getItem('akademihub_exams') || '[]');
      const newExam = {
        id: Date.now().toString(),
        ...data.sinavBilgisi,
        cevapAnahtari: data.cevapAnahtari,
        ogrenciSonuclari: data.ogrenciSonuclari,
        createdAt: new Date().toISOString()
      };
      savedExams.push(newExam);
      localStorage.setItem('akademihub_exams', JSON.stringify(savedExams));

      // Başarılı mesaj
      alert('Sınav başarıyla kaydedildi!');
      
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
