/**
 * Exam Analytics - Yayınlama API
 * POST: Hesapla ve yayınla (Wizard Adım 5)
 * 
 * Bu endpoint tüm sonuçları hesaplar:
 * - Doğru/Yanlış/Boş sayıları
 * - Net hesaplama
 * - LGS/TYT/AYT puanları
 * - Sıralama ve yüzdelik
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// POST /api/admin/exam-analytics/exams/:id/publish
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const sinavId = params.id;
    const body = await request.json();
    const { yayinSecenegi = 'hemen' } = body;

    const supabase = getServiceRoleClient();

    // 1. SINAV BİLGİLERİNİ AL
    const { data: sinav, error: sinavError } = await supabase
      .from('ea_sinavlar')
      .select(`
        *,
        ea_sinav_dersler (
          id,
          ders_id,
          ders_kodu,
          soru_sayisi,
          baslangic_soru,
          bitis_soru,
          sira_no
        )
      `)
      .eq('id', sinavId)
      .single();

    if (sinavError || !sinav) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    // 2. DURUMU HESAPLANIYOR YAP
    await supabase
      .from('ea_sinavlar')
      .update({ durum: 'hesaplaniyor' })
      .eq('id', sinavId);

    // 3. CEVAP ANAHTARLARINI AL
    const { data: cevapAnahtarlari } = await supabase
      .from('ea_cevap_anahtarlari')
      .select('*')
      .eq('sinav_id', sinavId)
      .eq('is_active', true);

    if (!cevapAnahtarlari || cevapAnahtarlari.length === 0) {
      await supabase.from('ea_sinavlar').update({ durum: 'hata' }).eq('id', sinavId);
      return NextResponse.json({ error: 'Cevap anahtarı bulunamadı' }, { status: 400 });
    }

    // 4. KATILIMCILARI VE CEVAPLARINI AL
    const { data: katilimcilar } = await supabase
      .from('ea_katilimcilar')
      .select(`
        id,
        student_id,
        katilimci_tipi,
        misafir_sinif,
        misafir_sube,
        ea_katilimci_cevaplar (
          id,
          ders_id,
          cevap_dizisi
        )
      `)
      .eq('sinav_id', sinavId);

    if (!katilimcilar || katilimcilar.length === 0) {
      await supabase.from('ea_sinavlar').update({ durum: 'hata' }).eq('id', sinavId);
      return NextResponse.json({ error: 'Katılımcı bulunamadı' }, { status: 400 });
    }

    // 5. Mevcut sonuçları temizle
    await supabase.from('ea_sonuclar').delete().eq('sinav_id', sinavId);
    await supabase.from('ea_ders_sonuclari').delete().eq('sinav_id', sinavId);

    // 6. HER KATILIMCI İÇİN HESAPLA
    const yanlisKatsayi = sinav.yanlis_katsayi || 0.3333;
    const dersSonuclari: any[] = [];
    const genelSonuclar: any[] = [];

    // Sözel/Sayısal ders kodları (LGS için)
    const sozelDersler = ['TUR', 'INK', 'DIN', 'ING'];
    const sayisalDersler = ['MAT', 'FEN'];

    for (const katilimci of katilimcilar) {
      let toplamDogru = 0, toplamYanlis = 0, toplamBos = 0;
      let sozelDogru = 0, sozelYanlis = 0;
      let sayisalDogru = 0, sayisalYanlis = 0;

      const katilimciCevaplari = (katilimci as any).ea_katilimci_cevaplar || [];

      // Her ders için hesapla
      for (const sinavDers of sinav.ea_sinav_dersler) {
        const cevapAnahtari = cevapAnahtarlari.find(
          (ca: any) => ca.ders_id === sinavDers.ders_id
        );
        
        const katilimciCevap = katilimciCevaplari.find(
          (kc: any) => kc.ders_id === sinavDers.ders_id
        );

        if (!cevapAnahtari) continue;

        const dogruCevaplar = cevapAnahtari.cevap_dizisi || '';
        const verilenCevaplar = katilimciCevap?.cevap_dizisi || '';

        // Doğru/Yanlış/Boş hesapla
        let dogru = 0, yanlis = 0, bos = 0;
        
        for (let i = 0; i < dogruCevaplar.length; i++) {
          const dogruCevap = dogruCevaplar[i]?.toUpperCase();
          const verilenCevap = (verilenCevaplar[i] || ' ').toUpperCase();
          
          if (verilenCevap === ' ' || verilenCevap === '-' || verilenCevap === '*' || verilenCevap === '.') {
            bos++;
          } else if (verilenCevap === dogruCevap) {
            dogru++;
          } else {
            yanlis++;
          }
        }

        // Net hesapla
        const net = Math.max(0, dogru - (yanlis * yanlisKatsayi));
        const basariYuzdesi = sinavDers.soru_sayisi > 0 
          ? (dogru / sinavDers.soru_sayisi) * 100 
          : 0;

        // Ders sonucu kaydet
        dersSonuclari.push({
          sinav_id: sinavId,
          sonuc_id: null, // Sonra güncellenecek
          katilimci_id: katilimci.id,
          ders_id: sinavDers.ders_id,
          soru_sayisi: sinavDers.soru_sayisi,
          dogru_sayisi: dogru,
          yanlis_sayisi: yanlis,
          bos_sayisi: bos,
          net: parseFloat(net.toFixed(2)),
          basari_yuzdesi: parseFloat(basariYuzdesi.toFixed(2)),
        });

        // Toplamları güncelle
        toplamDogru += dogru;
        toplamYanlis += yanlis;
        toplamBos += bos;

        // Sözel/Sayısal ayrımı
        const dersKodu = sinavDers.ders_kodu?.toUpperCase() || '';
        if (sozelDersler.includes(dersKodu)) {
          sozelDogru += dogru;
          sozelYanlis += yanlis;
        } else if (sayisalDersler.includes(dersKodu)) {
          sayisalDogru += dogru;
          sayisalYanlis += yanlis;
        }
      }

      // Genel sonuç
      const toplamNet = Math.max(0, toplamDogru - (toplamYanlis * yanlisKatsayi));
      const sozelNet = Math.max(0, sozelDogru - (sozelYanlis * yanlisKatsayi));
      const sayisalNet = Math.max(0, sayisalDogru - (sayisalYanlis * yanlisKatsayi));
      
      // LGS puan hesabı (yaklaşık formül)
      // Gerçek formül: 100 + (Net × 3.333)
      const lgsPuan = 100 + (toplamNet * 3.333);
      
      // Başarı yüzdesi
      const basariYuzdesi = sinav.toplam_soru > 0 
        ? (toplamDogru / sinav.toplam_soru) * 100 
        : 0;

      genelSonuclar.push({
        sinav_id: sinavId,
        katilimci_id: katilimci.id,
        student_id: katilimci.student_id,
        organization_id: sinav.organization_id,
        toplam_soru: sinav.toplam_soru,
        toplam_dogru: toplamDogru,
        toplam_yanlis: toplamYanlis,
        toplam_bos: toplamBos,
        toplam_net: parseFloat(toplamNet.toFixed(2)),
        basari_yuzdesi: parseFloat(basariYuzdesi.toFixed(2)),
        // Sözel/Sayısal
        sozel_net: parseFloat(sozelNet.toFixed(2)),
        sozel_dogru: sozelDogru,
        sozel_yanlis: sozelYanlis,
        sayisal_net: parseFloat(sayisalNet.toFixed(2)),
        sayisal_dogru: sayisalDogru,
        sayisal_yanlis: sayisalYanlis,
        // Puan
        lgs_puan: parseFloat(lgsPuan.toFixed(3)),
        // Durum
        hesaplandi: true,
        is_published: yayinSecenegi === 'hemen',
      });
    }

    // 7. SONUÇLARI KAYDET (BULK INSERT)
    const batchSize = 500;

    // Genel sonuçları kaydet
    for (let i = 0; i < genelSonuclar.length; i += batchSize) {
      const batch = genelSonuclar.slice(i, i + batchSize);
      const { data: inserted, error: sonucError } = await supabase
        .from('ea_sonuclar')
        .insert(batch)
        .select('id, katilimci_id');

      if (sonucError) {
        console.error('[EA Publish] Sonuç insert error:', sonucError);
        await supabase.from('ea_sinavlar').update({ durum: 'hata' }).eq('id', sinavId);
        return NextResponse.json({ error: sonucError.message }, { status: 500 });
      }

      // Ders sonuçlarına sonuc_id ekle
      if (inserted) {
        for (const sonuc of inserted) {
          dersSonuclari
            .filter((ds: any) => ds.katilimci_id === sonuc.katilimci_id)
            .forEach((ds: any) => ds.sonuc_id = sonuc.id);
        }
      }
    }

    // Ders sonuçlarını kaydet
    for (let i = 0; i < dersSonuclari.length; i += batchSize) {
      const batch = dersSonuclari.slice(i, i + batchSize);
      const { error: dersError } = await supabase
        .from('ea_ders_sonuclari')
        .insert(batch);

      if (dersError) {
        console.error('[EA Publish] Ders sonuç insert error:', dersError);
      }
    }

    // 8. SIRALAMA HESAPLA
    const { data: siraliSonuclar } = await supabase
      .from('ea_sonuclar')
      .select('id, lgs_puan, toplam_net')
      .eq('sinav_id', sinavId)
      .order('lgs_puan', { ascending: false })
      .order('toplam_net', { ascending: false });

    if (siraliSonuclar) {
      const toplamKatilimci = siraliSonuclar.length;
      
      for (let i = 0; i < siraliSonuclar.length; i++) {
        const yuzdelik = ((toplamKatilimci - i) / toplamKatilimci) * 100;
        
        await supabase
          .from('ea_sonuclar')
          .update({ 
            sira: i + 1,
            yuzdelik: parseFloat(yuzdelik.toFixed(2)),
          })
          .eq('id', siraliSonuclar[i].id);
      }
    }

    // 9. SINAV DURUMUNU GÜNCELLE
    const now = new Date().toISOString();
    await supabase
      .from('ea_sinavlar')
      .update({ 
        durum: yayinSecenegi === 'hemen' ? 'yayinlandi' : 'zamanli_yayin',
        yayinlanma_tarihi: yayinSecenegi === 'hemen' ? now : null,
        hesaplama_tarihi: now,
        is_published: yayinSecenegi === 'hemen',
        updated_at: now,
      })
      .eq('id', sinavId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    return NextResponse.json({
      success: true,
      message: yayinSecenegi === 'hemen' 
        ? 'Sınav başarıyla hesaplandı ve yayınlandı' 
        : 'Sınav hesaplandı, zamanlı yayın bekliyor',
      istatistikler: {
        katilimciSayisi: katilimcilar.length,
        dersSonucuSayisi: dersSonuclari.length,
        hesaplamaSuresi: `${duration}ms`,
      },
    });

  } catch (err: any) {
    console.error('[EA Publish] Exception:', err);
    
    // Hata durumunda sınavı işaretle
    const supabase = getServiceRoleClient();
    await supabase
      .from('ea_sinavlar')
      .update({ durum: 'hata' })
      .eq('id', params.id);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
