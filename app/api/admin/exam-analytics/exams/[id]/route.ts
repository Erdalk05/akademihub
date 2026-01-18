/**
 * Exam Analytics - Sınav Detay API
 * GET: Sınav detayını getir
 * PATCH: Sınavı güncelle (Wizard Adım 3 - Optik şablon)
 * DELETE: Sınavı sil
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/exams/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sinavId = params.id;

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('ea_sinavlar')
      .select(`
        *,
        ea_sinav_dersler (
          id,
          ders_id,
          ders_kodu,
          soru_sayisi,
          sira_no,
          baslangic_soru,
          bitis_soru,
          dogru_puan,
          yanlis_puan,
          ea_dersler:ders_id (
            id,
            ders_kodu,
            ders_adi,
            renk_kodu
          )
        ),
        ea_cevap_anahtarlari (
          id,
          ders_id,
          kitapcik,
          cevap_dizisi,
          soru_sayisi,
          is_active
        ),
        ea_optik_sablonlar:optik_sablon_id (
          id,
          sablon_adi,
          format_tipi
        )
      `)
      .eq('id', sinavId)
      .single();

    if (error) {
      console.error('[EA Sinav Detay] GET error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Katılımcı sayısını al
    const { count: katilimciSayisi } = await supabase
      .from('ea_katilimcilar')
      .select('id', { count: 'exact', head: true })
      .eq('sinav_id', sinavId);

    return NextResponse.json({
      data: {
        ...data,
        katilimci_sayisi: katilimciSayisi || 0,
      },
    });
  } catch (err: any) {
    console.error('[EA Sinav Detay] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/exam-analytics/exams/:id
// WIZARD ADIM 3: Optik şablon güncelle + genel güncelleme
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sinavId = params.id;
    const body = await request.json();

    const supabase = getServiceRoleClient();

    // İzin verilen alanlar
    const allowedFields = [
      'sinav_adi',
      'sinav_tarihi',
      'sinif_seviyesi',
      'sure_dakika',
      'yanlis_katsayi',
      'optik_sablon_id',
      'durum',
      'aciklama',
    ];

    // Sadece izin verilen alanları al
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Camelcase'den snake_case'e çevir
    if (body.sinavAdi) updateData.sinav_adi = body.sinavAdi;
    if (body.sinavTarihi) updateData.sinav_tarihi = body.sinavTarihi;
    if (body.sinifSeviyesi) updateData.sinif_seviyesi = body.sinifSeviyesi;
    if (body.sureDakika) updateData.sure_dakika = body.sureDakika;
    if (body.yanlisKatsayi) updateData.yanlis_katsayi = body.yanlisKatsayi;
    if (body.optikSablonId !== undefined) updateData.optik_sablon_id = body.optikSablonId;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('ea_sinavlar')
      .update(updateData)
      .eq('id', sinavId)
      .select()
      .single();

    if (error) {
      console.error('[EA Sinav Detay] PATCH error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('[EA Sinav Detay] PATCH exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/exam-analytics/exams/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sinavId = params.id;

    const supabase = getServiceRoleClient();

    // Önce sınavı kontrol et
    const { data: sinav, error: checkError } = await supabase
      .from('ea_sinavlar')
      .select('id, durum, is_published')
      .eq('id', sinavId)
      .single();

    if (checkError || !sinav) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    // Yayınlanmış sınav silinemez
    if (sinav.is_published) {
      return NextResponse.json(
        { error: 'Yayınlanmış sınav silinemez. Önce yayından kaldırın.' },
        { status: 400 }
      );
    }

    // Soft delete: durumu 'silindi' yap
    const { error } = await supabase
      .from('ea_sinavlar')
      .update({ 
        durum: 'silindi',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sinavId);

    if (error) {
      console.error('[EA Sinav Detay] DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sınav silindi',
    });
  } catch (err: any) {
    console.error('[EA Sinav Detay] DELETE exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
