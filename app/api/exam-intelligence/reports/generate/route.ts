import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { getSupabaseRls } from '../../_utils/supabaseRls';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { buildExcelBuffer } from '@/lib/reporting/serverExcel';
import { ReportTablePdf } from '@/lib/reporting/serverPdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Payload = {
  report: {
    organizationId: string;
    entityType: string;
    entityId?: string | null;
    section?: string;
  };
  title: string;
  filename: string;
  format: 'pdf' | 'excel';
  sheetName?: string;
  subtitle?: string;
  headers: Record<string, string>;
  rows: any[];
};

function safeSlug(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const rls = getSupabaseRls();
  const service = getServiceRoleClient();
  try {
    const body = (await req.json()) as Payload;

    const organizationId = String(body?.report?.organizationId || '').trim();
    const entityType = String(body?.report?.entityType || '').trim();
    const entityId = body?.report?.entityId ? String(body.report.entityId) : null;
    const section = String(body?.report?.section || '').trim() || null;
    const title = String(body?.title || '').trim();
    const filenameBase = String(body?.filename || '').trim();
    const format = String(body?.format || '').trim() as 'pdf' | 'excel';

    if (!organizationId) return NextResponse.json({ ok: false, error: 'organizationId gerekli' }, { status: 400 });
    if (!entityType) return NextResponse.json({ ok: false, error: 'entityType gerekli' }, { status: 400 });
    if (!title) return NextResponse.json({ ok: false, error: 'title gerekli' }, { status: 400 });
    if (!filenameBase) return NextResponse.json({ ok: false, error: 'filename gerekli' }, { status: 400 });
    if (format !== 'pdf' && format !== 'excel') return NextResponse.json({ ok: false, error: 'format pdf|excel olmalı' }, { status: 400 });

    const { data: userRes } = await rls.auth.getUser();
    const userId = userRes?.user?.id || null;

    const now = new Date();
    const nowIso = now.toISOString();
    const ymd = nowIso.slice(0, 10);
    const ext = format === 'excel' ? 'xlsx' : 'pdf';
    const filename = `${safeSlug(filenameBase)}_${ymd}.${ext}`;

    // 1) DB row (RLS ile insert)
    const { data: created, error: insErr } = await rls
      .from('generated_reports')
      .insert({
        organization_id: organizationId,
        entity_type: entityType,
        entity_id: entityId,
        section,
        format,
        status: 'generating',
        title,
        filename,
        metadata: {
          rowCount: Array.isArray(body?.rows) ? body.rows.length : 0,
          headerCount: Object.keys(body?.headers || {}).length,
          source: 'server_generate',
        },
        requested_by: userId,
        requested_at: nowIso,
      } as any)
      .select('id')
      .single();

    if (insErr || !created?.id) {
      return NextResponse.json({ ok: false, error: insErr?.message || 'generated_reports insert başarısız' }, { status: 403 });
    }

    const reportId = String(created.id);

    // 2) Generate bytes
    let bytes: Buffer;
    let contentType: string;

    if (format === 'excel') {
      bytes = buildExcelBuffer({ rows: body.rows || [], headers: body.headers || {}, sheetName: body.sheetName || title });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      const { pdf } = await import('@react-pdf/renderer');
      const orientation = Object.keys(body.headers || {}).length > 8 ? 'landscape' : 'portrait';
      const instance = pdf(
        React.createElement(ReportTablePdf, {
          title,
          subtitle: body.subtitle || null,
          headers: body.headers || {},
          rows: body.rows || [],
          orientation: orientation as any,
        }),
      );
      const buf = await instance.toBuffer();
      bytes = Buffer.from(buf);
      contentType = 'application/pdf';
    }

    // 3) Upload to Storage (service role)
    const bucket = process.env.SUPABASE_REPORTS_BUCKET || 'generated-reports';
    const filePath = `org/${organizationId}/${ymd}/${reportId}/${filename}`;

    const blob = new Blob([bytes], { type: contentType });
    const { error: upErr } = await service.storage.from(bucket).upload(filePath, blob, {
      contentType,
      upsert: true,
    });

    if (upErr) {
      await service
        .from('generated_reports')
        .update({ status: 'failed', metadata: { uploadError: upErr.message }, updated_at: new Date().toISOString() } as any)
        .eq('id', reportId);
      return NextResponse.json(
        {
          ok: false,
          error: `Storage upload başarısız: ${upErr.message}. Supabase Storage’da '${bucket}' bucket'ı var mı ve service role key doğru mu?`,
          reportId,
        },
        { status: 500 },
      );
    }

    // 4) URL (public varsa) + fallback signed
    let fileUrl: string | null = null;
    try {
      const pub = service.storage.from(bucket).getPublicUrl(filePath);
      fileUrl = pub?.data?.publicUrl || null;
    } catch {
      fileUrl = null;
    }

    if (!fileUrl) {
      const { data: signed } = await service.storage.from(bucket).createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 gün
      fileUrl = signed?.signedUrl || null;
    }

    // 5) Update row
    await service
      .from('generated_reports')
      .update({
        status: 'generated_server',
        file_url: fileUrl,
        file_path: filePath,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', reportId);

    return NextResponse.json({ ok: true, data: { reportId, fileUrl, filePath, bucket } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Sunucu hatası' }, { status: 500 });
  }
}


