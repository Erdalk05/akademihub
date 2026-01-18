/**
 * Exam Analytics - Sınavlar API
 * GET: Sınav listesini getir
 * POST: Yeni sınav oluştur (Wizard Adım 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/exams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const durum = searchParams.get('durum');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    let query = supabase
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
          ea_dersler:ders_id (
            id,
            ders_kodu,
            ders_adi,
            renk_kodu
          )
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Durum filtresi
    if (durum) {
      query = query.eq('durum', durum);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[EA Sinavlar] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error('[EA Sinavlar] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/exam-analytics/exams
// WIZARD ADIM 1: Sınav + Dersler Oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      academicYearId,
      sinavAdi,
      sinavTarihi,
      sinifSeviyesi,
      sinavTuru,
      sureDakika,
      yanlisKatsayi,
      dersler,
      userId,
    } = body;

    console.log('🔍 [BACKEND] POST body received:', { organizationId, sinavAdi, sinavTuru, derslerCount: dersler?.length });

    // Validasyon
    if (!organizationId) {
      console.log('❌ [BACKEND] Validation FAILED: organizationId missing');
      return NextResponse.json({ error: 'organizationId gerekli' }, { status: 400 });
    }
    if (!sinavAdi || sinavAdi.trim().length < 3) {
      console.log('❌ [BACKEND] Validation FAILED: sinavAdi invalid:', sinavAdi);
      return NextResponse.json({ error: 'Sınav adı en az 3 karakter olmalı' }, { status: 400 });
    }
    if (!sinavTuru) {
      console.log('❌ [BACKEND] Validation FAILED: sinavTuru missing');
      return NextResponse.json({ error: 'Sınav türü gerekli' }, { status: 400 });
    }

    // NOTE: dersler validation removed - will be handled in separate endpoint
    // when implementing ea_sinav_dersler insert

    const supabase = getServiceRoleClient();

    // Toplam soru sayısını hesapla
    const toplamSoru = dersler?.reduce((total: number, ders: any) => total + (ders.soruSayisi || 0), 0) || 0;
    
    console.log('🔍 [BACKEND] toplamSoru calculated:', { toplamSoru, derslerLength: dersler?.length });

    // Sınav kodu oluştur (LGS-2026-001 formatı)
    const yil = new Date().getFullYear();
    
    let sinavKodu = `${sinavTuru.toUpperCase()}-${yil}-001`; // default
    
    try {
      const { data: lastSinav, error: codeError } = await supabase
        .from('ea_sinavlar')
        .select('sinav_kodu')
        .eq('organization_id', organizationId)
        .ilike('sinav_kodu', `${sinavTuru.toUpperCase()}-${yil}-%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!codeError && lastSinav?.sinav_kodu) {
        const match = lastSinav.sinav_kodu.match(/-(\d+)$/);
        if (match) {
          const siraNo = parseInt(match[1]) + 1;
          sinavKodu = `${sinavTuru.toUpperCase()}-${yil}-${siraNo.toString().padStart(3, '0')}`;
        }
      }
    } catch (err) {
      // Sınav kodu oluştururken hata olsa bile devam et (default kod kullan)
      console.warn('⚠️ [BACKEND] Sınav kodu generation fallback:', err);
    }

    console.log('🔍 [BACKEND] BEFORE ea_sinavlar insert:', { organizationId, sinavKodu, sinavAdi, toplamSoru });

    // 1. SINAV OLUŞTUR
    // Boş stringleri null'a çevir (UUID alanları için)
    const safeAcademicYearId = academicYearId && academicYearId.trim() !== '' ? academicYearId : null;
    const safeUserId = userId && userId.trim() !== '' ? userId : null;

    const { data: sinav, error: sinavError } = await supabase
      .from('ea_sinavlar')
      .insert({
        organization_id: organizationId,
        academic_year_id: safeAcademicYearId,
        sinav_kodu: sinavKodu,
        sinav_adi: sinavAdi.trim(),
        sinav_tarihi: sinavTarihi || null,
        sinif_seviyesi: sinifSeviyesi ?? null,
        sinav_tipi: sinavTuru.toLowerCase(),
        toplam_soru: toplamSoru,
        sure_dakika: sureDakika ?? 120,
        yanlis_katsayi: yanlisKatsayi ?? 0.3333,
        durum: 'taslak',
        is_published: false,
        created_by: safeUserId,
      })
      .select('id, sinav_kodu')
      .single();

    if (sinavError) {
      console.error('❌ [BACKEND] ea_sinavlar INSERT FAILED:', {
        message: sinavError.message,
        code: sinavError.code,
        details: sinavError.details,
        hint: sinavError.hint
      });
      return NextResponse.json({ 
        error: `Sınav oluşturulamadı: ${sinavError.message}`,
        details: sinavError.details || sinavError.hint
      }, { status: 400 });
    }

    // ✅ SUCCESS — Sınav başarıyla oluşturuldu
    console.log('✅ [BACKEND] SUCCESS - exam created:', { sinavId: sinav.id, sinavKodu: sinav.sinav_kodu });

    // TODO: Ders dağılımı (ea_sinav_dersler) ayrı bir endpoint'te yapılacak
    // Örnek: PATCH /api/admin/exam-analytics/exams/:id/subjects
    // Şu an wizard Step 1 sadece sınav kaydı oluşturuyor.

    return NextResponse.json({
      success: true,
      sinavId: sinav.id,
      sinavKodu: sinav.sinav_kodu,
      message: 'Sınav başarıyla oluşturuldu',
    }, { status: 201 });

  } catch (err: any) {
    console.error('[EA Sinavlar] POST exception:', err);
    return NextResponse.json({ 
      error: 'İç sunucu hatası',
      message: err.message 
    }, { status: 500 });
  }
}
