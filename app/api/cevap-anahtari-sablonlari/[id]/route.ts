import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, hasServiceRole } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const UpdateSchema = z.object({
  sablon_adi: z.string().min(2).max(200).optional(),
  aciklama: z.string().max(2000).optional().nullable(),
});

// DELETE /api/cevap-anahtari-sablonlari/:id (soft delete)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
    const { id } = await ctx.params;
    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .from('cevap_anahtari_sablonlari')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Beklenmeyen hata' }, { status: 500 });
  }
}

// PUT /api/cevap-anahtari-sablonlari/:id (update name/description)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (typeof parsed.data.sablon_adi === 'string') payload.sablon_adi = parsed.data.sablon_adi;
    if (parsed.data.aciklama !== undefined) payload.aciklama = parsed.data.aciklama ?? null;

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('cevap_anahtari_sablonlari')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Beklenmeyen hata' }, { status: 500 });
  }
}


