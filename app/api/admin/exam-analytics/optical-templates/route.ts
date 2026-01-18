/**
 * Exam Analytics - Optik Şablonlar API
 * GET: Şablon listesini getir (Global + Kuruma özel)
 * POST: Yeni şablon oluştur (Kuruma özel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/optical-templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Global şablonlar (organization_id = NULL) + Kuruma özel şablonlar
    const { data, error } = await supabase
      .from('ea_optik_sablonlar')
      .select('*')
      .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('sablon_adi', { ascending: true });

    if (error) {
      console.error('[EA Optik Şablonlar] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Duplike şablonları filtrele (Kuruma özel olan önceliklidir)
    const sablonMap = new Map();
    data?.forEach(sablon => {
      const existing = sablonMap.get(sablon.sablon_adi);
      // Kuruma özel şablon varsa onu kullan, yoksa global'i al
      if (!existing || (sablon.organization_id && !existing.organization_id)) {
        sablonMap.set(sablon.sablon_adi, sablon);
      }
    });

    const uniqueSablonlar = Array.from(sablonMap.values())
      .sort((a, b) => {
        // Önce default olanlar
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        // Sonra isme göre
        return a.sablon_adi.localeCompare(b.sablon_adi, 'tr');
      });

    return NextResponse.json({ data: uniqueSablonlar });
  } catch (err: any) {
    console.error('[EA Optik Şablonlar] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/exam-analytics/optical-templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      sablonAdi,
      sablonTuru = 'sabit',
      aciklama,
      satirFormat = 'FIXED',
      alanTanimlari,
      ogrenciNoBaslangic,
      ogrenciNoUzunluk,
      cevapBaslangic,
      cevapUzunluk,
      userId,
    } = body;

    if (!organizationId || !sablonAdi || !alanTanimlari) {
      return NextResponse.json(
        { error: 'organizationId, sablonAdi ve alanTanimlari zorunlu' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('ea_optik_sablonlar')
      .insert({
        organization_id: organizationId,
        sablon_adi: sablonAdi,
        sablon_turu: sablonTuru,
        aciklama: aciklama,
        satir_format: satirFormat,
        alan_tanimlari: alanTanimlari,
        ogrenci_no_baslangic: ogrenciNoBaslangic,
        ogrenci_no_uzunluk: ogrenciNoUzunluk,
        cevap_baslangic: cevapBaslangic,
        cevap_uzunluk: cevapUzunluk,
        is_active: true,
        is_default: false, // Kuruma özel şablonlar default olamaz
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('[EA Optik Şablonlar] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error('[EA Optik Şablonlar] POST exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
