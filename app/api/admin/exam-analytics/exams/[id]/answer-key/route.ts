/**
 * Exam Analytics - Cevap Anahtarı API
 * GET: Mevcut cevap anahtarını getir
 * POST: Cevap anahtarı kaydet (Wizard Adım 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/exams/:id/answer-key
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sinavId = params.id;

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('ea_cevap_anahtarlari')
      .select(`
        *,
        ea_dersler:ders_id (
          id,
          ders_kodu,
          ders_adi
        )
      `)
      .eq('sinav_id', sinavId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[EA CevapAnahtari] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[EA CevapAnahtari] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/exam-analytics/exams/:id/answer-key
// WIZARD ADIM 2: Cevap anahtarı kaydet
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sinavId = params.id;
    const body = await request.json();
    const {
      kitapcik = 'A',
      cevaplar, // [{dersId, cevapDizisi}, ...]
      userId,
    } = body;

    if (!cevaplar || cevaplar.length === 0) {
      return NextResponse.json(
        { error: 'En az 1 ders için cevap anahtarı gerekli' },
        { status: 400 }
      );
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

    // Mevcut cevap anahtarlarını pasife çek
    await supabase
      .from('ea_cevap_anahtarlari')
      .update({ is_active: false })
      .eq('sinav_id', sinavId);

    // Yeni cevap anahtarlarını ekle
    const cevapAnahtarlari = cevaplar.map((cevap: any) => ({
      sinav_id: sinavId,
      ders_id: cevap.dersId,
      kitapcik: kitapcik,
      cevap_dizisi: cevap.cevapDizisi,
      cevaplar: cevap.cevapDizisi.split('').filter((c: string) => c.trim()), // JSONB format
      soru_sayisi: cevap.cevapDizisi.length,
      is_active: true,
      created_by: userId,
    }));

    const { error: insertError } = await supabase
      .from('ea_cevap_anahtarlari')
      .insert(cevapAnahtarlari);

    if (insertError) {
      console.error('[EA CevapAnahtari] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Sınav durumunu güncelle
    const { error: updateError } = await supabase
      .from('ea_sinavlar')
      .update({
        durum: 'cevap_girildi',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sinavId);

    if (updateError) {
      console.error('[EA CevapAnahtari] Update error:', updateError);
    }

    // Toplam cevap sayısını hesapla
    const toplamCevap = cevaplar.reduce((total: number, c: any) => total + c.cevapDizisi.length, 0);

    return NextResponse.json({
      success: true,
      message: 'Cevap anahtarı kaydedildi',
      toplamCevap,
    });

  } catch (err: any) {
    console.error('[EA CevapAnahtari] POST exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
