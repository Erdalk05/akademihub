import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, hasServiceRole } from '@/lib/supabase/server';

export const runtime = 'nodejs';

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


