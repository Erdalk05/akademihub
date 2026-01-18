/**
 * MEB Kazanımları API
 * GET: Kazanım listesini getir (arama destekli)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/exam-analytics/kazanimlar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dersKodu = searchParams.get('dersKodu');
    const sinifSeviyesi = searchParams.get('sinifSeviyesi');
    const sinavTuru = searchParams.get('sinavTuru');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = getServiceRoleClient();

    let query = supabase
      .from('ea_meb_kazanimlar')
      .select('*')
      .eq('is_active', true)
      .order('kazanim_kodu', { ascending: true })
      .limit(limit);

    // Ders filtresi
    if (dersKodu) {
      query = query.eq('ders_kodu', dersKodu.toUpperCase());
    }

    // Sınıf filtresi
    if (sinifSeviyesi) {
      query = query.eq('sinif_seviyesi', parseInt(sinifSeviyesi));
    }

    // Sınav türü filtresi
    if (sinavTuru) {
      query = query.contains('sinav_turleri', [sinavTuru.toLowerCase()]);
    }

    // Arama
    if (search && search.length >= 2) {
      query = query.or(`kazanim_kodu.ilike.%${search}%,kazanim_adi.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Kazanimlar] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[Kazanimlar] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
