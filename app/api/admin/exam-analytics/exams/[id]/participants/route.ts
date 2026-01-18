/**
 * Exam Analytics - Katılımcılar API
 * GET: Katılımcı listesini getir
 * POST: Katılımcıları kaydet (Wizard Adım 4)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/exams/:id/participants
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sinavId = params.id;

    const supabase = getServiceRoleClient();

    const { data, error, count } = await supabase
      .from('ea_katilimcilar')
      .select(`
        *,
        students:student_id (
          id,
          student_no,
          first_name,
          last_name,
          class,
          section
        )
      `, { count: 'exact' })
      .eq('sinav_id', sinavId)
      .order('sira', { ascending: true });

    if (error) {
      console.error('[EA Katilimcilar] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count,
    });
  } catch (err: any) {
    console.error('[EA Katilimcilar] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/exam-analytics/exams/:id/participants
// WIZARD ADIM 4: Katılımcıları ve cevaplarını kaydet
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sinavId = params.id;
    const body = await request.json();
    const {
      organizationId,
      katilimcilar, // Parsed katılımcı listesi
      hamDosyaAdi,
      hamDosyaIcerik,
      sinavDersleri, // [{dersId, baslangicSoru, bitisSoru}, ...]
      userId,
    } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId gerekli' }, { status: 400 });
    }
    if (!katilimcilar || katilimcilar.length === 0) {
      return NextResponse.json({ error: 'En az 1 katılımcı gerekli' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Sınavı kontrol et
    const { data: sinav, error: sinavError } = await supabase
      .from('ea_sinavlar')
      .select('id, durum, toplam_soru')
      .eq('id', sinavId)
      .single();

    if (sinavError || !sinav) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    // 1. HAM DOSYAYI KAYDET (Arşiv için)
    let hamYuklemeId = null;
    if (hamDosyaAdi && hamDosyaIcerik) {
      const { data: hamYukleme, error: hamError } = await supabase
        .from('ea_ham_yuklemeler')
        .insert({
          sinav_id: sinavId,
          organization_id: organizationId,
          dosya_adi: hamDosyaAdi,
          dosya_icerigi: hamDosyaIcerik,
          satir_sayisi: katilimcilar.length,
          basarili_satir: katilimcilar.filter((k: any) => k.studentId).length,
          hatali_satir: katilimcilar.filter((k: any) => !k.studentId).length,
          yukleyen_id: userId,
          islem_durumu: 'yuklendi',
        })
        .select('id')
        .single();

      if (!hamError && hamYukleme) {
        hamYuklemeId = hamYukleme.id;
      }
    }

    // 2. Mevcut katılımcıları temizle (yeniden yükleme için)
    await supabase
      .from('ea_katilimcilar')
      .delete()
      .eq('sinav_id', sinavId);

    // 3. KATILIMCILARI KAYDET (BULK INSERT)
    const katilimciKayitlari = katilimcilar.map((k: any, index: number) => ({
      sinav_id: sinavId,
      organization_id: organizationId,
      student_id: k.studentId || null,
      katilimci_tipi: k.studentId ? 'asil' : 'misafir',
      // Misafir bilgileri
      misafir_ogrenci_no: k.studentId ? null : k.ogrenciNo,
      misafir_tc_no: k.studentId ? null : k.tcNo,
      misafir_ad_soyad: k.studentId ? null : k.adSoyad,
      misafir_sinif: k.studentId ? null : k.sinif,
      misafir_sube: k.studentId ? null : k.sube,
      // Ortak alanlar
      katilimci_adi: k.adSoyad,
      ogrenci_no: k.ogrenciNo,
      kitapcik: k.kitapcik || 'A',
      ham_satir_no: k.satirNo || index + 1,
      ham_yukleme_id: hamYuklemeId,
      eslesme_durumu: k.studentId ? 'eslesti' : 'bulunamadi',
      sira: index + 1,
      katildi: true,
      katilim_tarihi: new Date().toISOString(),
    }));

    // Batch insert (1000'er kayıt)
    const batchSize = 1000;
    const insertedKatilimcilar: any[] = [];

    for (let i = 0; i < katilimciKayitlari.length; i += batchSize) {
      const batch = katilimciKayitlari.slice(i, i + batchSize);
      const { data: inserted, error: katilimciError } = await supabase
        .from('ea_katilimcilar')
        .insert(batch)
        .select('id, sira');

      if (katilimciError) {
        console.error('[EA Katilimcilar] Batch insert error:', katilimciError);
        return NextResponse.json({ error: katilimciError.message }, { status: 500 });
      }

      if (inserted) {
        insertedKatilimcilar.push(...inserted);
      }
    }

    // 4. KATILIMCI CEVAPLARINI KAYDET
    if (sinavDersleri && sinavDersleri.length > 0) {
      const cevapKayitlari: any[] = [];

      for (let i = 0; i < katilimcilar.length; i++) {
        const katilimci = katilimcilar[i];
        const katilimciId = insertedKatilimcilar.find((k: any) => k.sira === i + 1)?.id;
        
        if (!katilimciId || !katilimci.cevaplar) continue;

        // Her ders için cevapları ayır
        for (const ders of sinavDersleri) {
          const baslangic = (ders.baslangicSoru || 1) - 1;
          const bitis = ders.bitisSoru || baslangic + ders.soruSayisi;
          const dersCevaplari = katilimci.cevaplar.substring(baslangic, bitis);

          if (dersCevaplari) {
            cevapKayitlari.push({
              katilimci_id: katilimciId,
              ders_id: ders.dersId,
              cevap_dizisi: dersCevaplari,
              cevaplar: dersCevaplari.split(''), // JSONB format
            });
          }
        }
      }

      // Batch insert cevaplar
      if (cevapKayitlari.length > 0) {
        for (let i = 0; i < cevapKayitlari.length; i += batchSize) {
          const batch = cevapKayitlari.slice(i, i + batchSize);
          const { error: cevapError } = await supabase
            .from('ea_katilimci_cevaplar')
            .insert(batch);

          if (cevapError) {
            console.error('[EA Katilimcilar] Cevap insert error:', cevapError);
          }
        }
      }
    }

    // 5. SINAV DURUMUNU GÜNCELLE
    const { error: updateError } = await supabase
      .from('ea_sinavlar')
      .update({
        durum: 'veri_yuklendi',
        katilimci_sayisi: katilimcilar.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sinavId);

    if (updateError) {
      console.error('[EA Katilimcilar] Sınav update error:', updateError);
    }

    // Ham yükleme durumunu güncelle
    if (hamYuklemeId) {
      await supabase
        .from('ea_ham_yuklemeler')
        .update({ islem_durumu: 'tamamlandi' })
        .eq('id', hamYuklemeId);
    }

    return NextResponse.json({
      success: true,
      message: 'Katılımcılar kaydedildi',
      toplam: katilimcilar.length,
      asil: katilimcilar.filter((k: any) => k.studentId).length,
      misafir: katilimcilar.filter((k: any) => !k.studentId).length,
    });

  } catch (err: any) {
    console.error('[EA Katilimcilar] POST exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
