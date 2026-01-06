import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRls } from '../_utils/supabaseRls';

export const dynamic = 'force-dynamic';

/**
 * generated_reports log endpoint (client-side export için)
 * Not: PDF/Excel client-side üretildiği için file_url tutulmaz; audit için metadata tutulur.
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseRls();
  try {
    const body = await req.json().catch(() => ({}));
    const report = body?.report || null;

    const organizationId = String(report?.organizationId || '').trim();
    const entityType = String(report?.entityType || '').trim();
    const entityId = report?.entityId ? String(report.entityId) : null;
    const section = String(body?.section || report?.section || body?.title || '').trim() || null;
    const format = String(body?.format || '').trim(); // pdf|excel
    const filename = String(body?.filename || '').trim() || null;
    const title = String(body?.title || '').trim() || null;
    const meta = body?.meta || null;

    if (!organizationId) return NextResponse.json({ ok: false, error: 'organizationId gerekli' }, { status: 400 });
    if (!format) return NextResponse.json({ ok: false, error: 'format gerekli' }, { status: 400 });
    if (!entityType) return NextResponse.json({ ok: false, error: 'entityType gerekli' }, { status: 400 });

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('generated_reports')
      .insert({
        organization_id: organizationId,
        entity_type: entityType,
        entity_id: entityId,
        section,
        format,
        status: 'generated_client',
        filename,
        title,
        metadata: meta,
        generated_at: now,
      } as any)
      .select('id')
      .single();

    if (error) {
      // tablo yoksa veya RLS izin vermezse export'u bozma
      return NextResponse.json({ ok: true, data: null, warning: error.message }, { status: 200 });
    }

    return NextResponse.json({ ok: true, data: { id: data.id } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: true, data: null, warning: e?.message || 'unknown' }, { status: 200 });
  }
}


