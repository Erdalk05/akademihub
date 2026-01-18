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

    // Validasyon
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId gerekli' }, { status: 400 });
    }
    if (!sinavAdi || sinavAdi.trim().length < 3) {
      return NextResponse.json({ error: 'Sınav adı en az 3 karakter olmalı' }, { status: 400 });
    }
    if (!sinavTuru) {
      return NextResponse.json({ error: 'Sınav türü gerekli' }, { status: 400 });
    }
    if (!dersler || dersler.length === 0) {
      return NextResponse.json({ error: 'En az 1 ders gerekli' }, { status: 400 });
    }

    // Ders validasyonları - dersId VEYA dersKodu olmalı
    const eksikDersler = dersler.filter((ders: any) => !ders.dersId && !ders.dersKodu);
    if (eksikDersler.length > 0) {
      console.error('[EA Sinavlar] Eksik dersId ve dersKodu:', eksikDersler);
      return NextResponse.json({ 
        error: `Ders eşleştirmesi eksik: ${eksikDersler.length} derste hem dersId hem dersKodu bulunamadı`,
        eksikDersler: eksikDersler.map((d: any, i: number) => `Ders ${i + 1}: ${d.dersAdi || 'İsimsiz'}`)
      }, { status: 400 });
    }

    const gecersizSoruSayisi = dersler.filter((ders: any) => !ders.soruSayisi || ders.soruSayisi <= 0);
    if (gecersizSoruSayisi.length > 0) {
      console.error('[EA Sinavlar] Geçersiz soru sayısı:', gecersizSoruSayisi);
      return NextResponse.json({ 
        error: `Ders soru sayısı geçersiz: ${gecersizSoruSayisi.length} derste soru sayısı 0 veya boş`,
        gecersizDersler: gecersizSoruSayisi.map((d: any) => `${d.dersKodu || d.dersAdi || 'İsimsiz'}: ${d.soruSayisi || 0} soru`)
      }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Toplam soru sayısını hesapla
    const toplamSoru = dersler.reduce((total: number, ders: any) => total + (ders.soruSayisi || 0), 0);

    // Sınav kodu oluştur (LGS-2026-001 formatı)
    const yil = new Date().getFullYear();
    const { data: lastSinav } = await supabase
      .from('ea_sinavlar')
      .select('sinav_kodu')
      .eq('organization_id', organizationId)
      .ilike('sinav_kodu', `${sinavTuru.toUpperCase()}-${yil}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let siraNo = 1;
    if (lastSinav?.sinav_kodu) {
      const match = lastSinav.sinav_kodu.match(/-(\d+)$/);
      if (match) {
        siraNo = parseInt(match[1]) + 1;
      }
    }
    const sinavKodu = `${sinavTuru.toUpperCase()}-${yil}-${siraNo.toString().padStart(3, '0')}`;

    // 1. SINAV OLUŞTUR
    const { data: sinav, error: sinavError } = await supabase
      .from('ea_sinavlar')
      .insert({
        organization_id: organizationId,
        academic_year_id: academicYearId || null,
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
        created_by: userId,
      })
      .select('id, sinav_kodu')
      .single();

    if (sinavError) {
      console.error('[EA Sinavlar] Sınav oluşturma hatası:', sinavError);
      return NextResponse.json({ 
        error: `Sınav oluşturulamadı: ${sinavError.message}`,
        details: sinavError.details || sinavError.hint
      }, { status: 400 });
    }

    // ✅ SUCCESS — Sınav başarıyla oluşturuldu
    console.log('[EA Sinavlar] Sınav oluşturuldu:', sinav.id, sinav.sinav_kodu);

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
