/**
 * Cevap Anahtarı Şablonları API
 * GET: Şablon listesini getir
 * POST: Yeni şablon oluştur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/answer-keys
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const sinavTipi = searchParams.get('sinavTipi');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId gerekli' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    let query = supabase
      .from('ea_cevap_anahtari_sablonlar')
      .select(`
        *,
        kitapciklar:ea_cevap_anahtari_kitapciklar(
          id,
          kitapcik_kodu,
          cevap_dizisi,
          is_primary
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (sinavTipi) {
      query = query.eq('sinav_tipi', sinavTipi);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Answer Keys] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[Answer Keys] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/exam-analytics/answer-keys
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      sablonAdi,
      sinavTipi,
      toplamSoru,
      dersDagilimi,
      kitapciklar,
      userId,
    } = body;

    // Validasyon
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId gerekli' }, { status: 400 });
    }
    if (!sablonAdi || sablonAdi.trim().length < 3) {
      return NextResponse.json({ error: 'Şablon adı en az 3 karakter olmalı' }, { status: 400 });
    }
    if (!toplamSoru || toplamSoru <= 0) {
      return NextResponse.json({ error: 'Toplam soru sayısı gerekli' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Boş string'leri null'a çevir
    const safeUserId = userId && userId.trim() !== '' ? userId : null;

    // 1. Şablon oluştur
    const { data: sablon, error: sablonError } = await supabase
      .from('ea_cevap_anahtari_sablonlar')
      .insert({
        organization_id: organizationId,
        sablon_adi: sablonAdi.trim(),
        sinav_tipi: sinavTipi || 'custom',
        toplam_soru: toplamSoru,
        ders_dagilimi: dersDagilimi || [],
        created_by: safeUserId,
      })
      .select('id')
      .single();

    if (sablonError) {
      console.error('[Answer Keys] Şablon oluşturma hatası:', sablonError);
      return NextResponse.json({
        error: `Şablon oluşturulamadı: ${sablonError.message}`,
      }, { status: 400 });
    }

    // 2. Kitapçıkları oluştur (varsa)
    if (kitapciklar && kitapciklar.length > 0) {
      const kitapcikData = kitapciklar.map((k: any, index: number) => ({
        sablon_id: sablon.id,
        kitapcik_kodu: k.kitapcikKodu,
        cevap_dizisi: k.cevapDizisi || '',
        is_primary: index === 0,
      }));

      const { error: kitapcikError } = await supabase
        .from('ea_cevap_anahtari_kitapciklar')
        .insert(kitapcikData);

      if (kitapcikError) {
        console.error('[Answer Keys] Kitapçık oluşturma hatası:', kitapcikError);
        // Şablonu geri al
        await supabase.from('ea_cevap_anahtari_sablonlar').delete().eq('id', sablon.id);
        return NextResponse.json({
          error: `Kitapçık oluşturulamadı: ${kitapcikError.message}`,
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      sablonId: sablon.id,
      message: 'Cevap anahtarı şablonu başarıyla oluşturuldu',
    }, { status: 201 });

  } catch (err: any) {
    console.error('[Answer Keys] POST exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
