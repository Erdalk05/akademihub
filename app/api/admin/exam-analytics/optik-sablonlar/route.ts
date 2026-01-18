/**
 * Optik Şablon API
 * GET: Şablon listesini getir (global + kurum)
 * POST: Yeni şablon oluştur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/optik-sablonlar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const supabase = getServiceRoleClient();

    // Global şablonlar (organization_id IS NULL) + Kurum şablonları
    let query = supabase
      .from('ea_optik_sablonlar')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (organizationId) {
      // Global + kurum şablonları
      query = query.or(`organization_id.is.null,organization_id.eq.${organizationId}`);
    } else {
      // Sadece global şablonlar
      query = query.is('organization_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Optik Sablonlar] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[Optik Sablonlar] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/exam-analytics/optik-sablonlar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      sablonAdi,
      aciklama,
      formatTipi = 'fixed_width',
      satirUzunlugu,
      alanTanimlari,
      cevapBaslangic,
      cevapUzunluk,
      userId,
    } = body;

    // Validasyon
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId gerekli' }, { status: 400 });
    }
    if (!sablonAdi || sablonAdi.trim().length < 3) {
      return NextResponse.json({ error: 'Şablon adı en az 3 karakter olmalı' }, { status: 400 });
    }
    if (!satirUzunlugu || satirUzunlugu < 50) {
      return NextResponse.json({ error: 'Satır uzunluğu en az 50 olmalı' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Boş string'leri null'a çevir
    const safeUserId = userId && userId.trim() !== '' ? userId : null;

    // Şablon oluştur
    const { data: sablon, error: sablonError } = await supabase
      .from('ea_optik_sablonlar')
      .insert({
        organization_id: organizationId,
        sablon_adi: sablonAdi.trim(),
        aciklama: aciklama || `${alanTanimlari?.length || 0} alan, ${satirUzunlugu} karakter`,
        format_tipi: formatTipi,
        satir_uzunlugu: satirUzunlugu,
        alan_tanimlari: alanTanimlari || [],
        cevap_baslangic: cevapBaslangic || 0,
        cevap_uzunluk: cevapUzunluk || 0,
        is_active: true,
        is_default: false,
        created_by: safeUserId,
      })
      .select('id')
      .single();

    if (sablonError) {
      console.error('[Optik Sablonlar] Oluşturma hatası:', sablonError);
      return NextResponse.json({
        error: `Şablon oluşturulamadı: ${sablonError.message}`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sablonId: sablon.id,
      message: 'Optik şablon başarıyla oluşturuldu',
    }, { status: 201 });

  } catch (err: any) {
    console.error('[Optik Sablonlar] POST exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
