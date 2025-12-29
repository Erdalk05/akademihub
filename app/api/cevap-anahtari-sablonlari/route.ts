import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient, hasServiceRole } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const CreateSchema = z.object({
  sablon_adi: z.string().min(2).max(200),
  aciklama: z.string().max(2000).optional().nullable(),
  sinav_turu: z.string().max(50).optional().nullable(),
  sinif_seviyesi: z.string().max(20).optional().nullable(),
  cevap_anahtari: z.array(z.any()).min(1),
  // ✅ Ders sırası - kullanıcının sürükle-bırak ile belirlediği sıra
  ders_sirasi: z.array(z.string()).optional().nullable(),
  organization_id: z.string().uuid().optional().nullable(),
});

// GET /api/cevap-anahtari-sablonlari?organization_id=...
export async function GET(req: NextRequest) {
  try {
    if (!hasServiceRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase service role key eksik. Vercel/Supabase env: SUPABASE_SERVICE_ROLE_KEY tanımlanmalı.',
        },
        { status: 500 },
      );
    }
    const organizationId = req.nextUrl.searchParams.get('organization_id') || undefined;
    const supabase = getServiceRoleClient();

    let query = supabase
      .from('cevap_anahtari_sablonlari')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    } else {
      query = query.is('organization_id', null);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, hint: 'Tablo yoksa Supabase migration çalıştırılmamış olabilir.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: data || [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Beklenmeyen hata' }, { status: 500 });
  }
}

// POST /api/cevap-anahtari-sablonlari
export async function POST(req: NextRequest) {
  try {
    if (!hasServiceRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase service role key eksik. Vercel/Supabase env: SUPABASE_SERVICE_ROLE_KEY tanımlanmalı.',
        },
        { status: 500 },
      );
    }
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const payload = {
      sablon_adi: parsed.data.sablon_adi,
      aciklama: parsed.data.aciklama ?? null,
      sinav_turu: parsed.data.sinav_turu ?? null,
      sinif_seviyesi: parsed.data.sinif_seviyesi ?? null,
      cevap_anahtari: parsed.data.cevap_anahtari,
      // ✅ Ders sırası - kullanıcının sürükle-bırak ile belirlediği sıra
      ders_sirasi: parsed.data.ders_sirasi ?? null,
      organization_id: parsed.data.organization_id ?? null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cevap_anahtari_sablonlari')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, hint: 'RLS/policy yerine tablo varlığını kontrol edin (migration).' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Beklenmeyen hata' }, { status: 500 });
  }
}


