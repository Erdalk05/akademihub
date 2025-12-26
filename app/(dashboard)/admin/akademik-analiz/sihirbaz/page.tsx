'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SinavSihirbazi } from '@/lib/sinavlar/kazanim';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore } from '@/lib/store/academicYearStore';

// Store'dan organization ve academic year al - undefined için fallback

export default function SihirbazPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Store'lardan organization ve academic year al
  const { currentOrganization } = useOrganizationStore();
  const { selectedYear } = useAcademicYearStore();

  // Client-side check
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    <SinavSihirbazi
      organizationId="demo-org"
      academicYearId="2024-2025"
      ogrenciListesi={[]}
      savedSablonlar={[]}
      onComplete={handleComplete}
    />
  );
}
