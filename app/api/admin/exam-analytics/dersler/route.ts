/**
 * Exam Analytics - Dersler API
 * GET: Ders listesini getir
 * POST: Yeni ders oluştur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/dersler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const supabase = getServiceRoleClient();

    // Global dersler (organization_id = NULL) + Kuruma özel dersler
    const derslerQuery = supabase
      .from('ea_dersler')
      .select('*')
      .eq('is_active', true)
      .order('sira_no', { ascending: true });

    const { data, error } = organizationId
      ? await derslerQuery.or(`organization_id.is.null,organization_id.eq.${organizationId}`)
      : await derslerQuery.is('organization_id', null);

    if (error) {
      console.error('[EA Dersler] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Duplike dersleri filtrele (Kuruma özel olan önceliklidir)
    const dersMap = new Map();
    data?.forEach(ders => {
      const existing = dersMap.get(ders.ders_kodu);
      // Kuruma özel ders varsa onu kullan, yoksa global'i al
      if (!existing || (ders.organization_id && !existing.organization_id)) {
        dersMap.set(ders.ders_kodu, ders);
      }
    });

    const uniqueDersler = Array.from(dersMap.values())
      .sort((a, b) => a.sira_no - b.sira_no);

    return NextResponse.json({ data: uniqueDersler });
  } catch (err: any) {
    console.error('[EA Dersler] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/exam-analytics/dersler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      dersKodu,
      dersAdi,
      dersKategori,
      maxSoruSayisi = 40,
      minSoruSayisi = 1,
      aciklama,
      renkKodu,
      userId,
    } = body;

    if (!organizationId || !dersKodu || !dersAdi) {
      return NextResponse.json(
        { error: 'organizationId, dersKodu ve dersAdi zorunlu' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Sıra numarasını bul
    const { data: lastDers } = await supabase
      .from('ea_dersler')
      .select('sira_no')
      .eq('organization_id', organizationId)
      .order('sira_no', { ascending: false })
      .limit(1)
      .single();

    const siraNo = (lastDers?.sira_no || 0) + 1;

    const { data, error } = await supabase
      .from('ea_dersler')
      .insert({
        organization_id: organizationId,
        ders_kodu: dersKodu.toUpperCase(),
        ders_adi: dersAdi,
        ders_kategori: dersKategori,
        max_soru_sayisi: maxSoruSayisi,
        min_soru_sayisi: minSoruSayisi,
        aciklama: aciklama,
        renk_kodu: renkKodu || '#3B82F6',
        sira_no: siraNo,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('[EA Dersler] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error('[EA Dersler] POST exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
