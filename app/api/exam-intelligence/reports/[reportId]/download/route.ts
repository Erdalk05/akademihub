import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRls } from '../../../_utils/supabaseRls';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/exam-intelligence/reports/:reportId/download
 * - RLS ile kullanıcı raporu görebiliyor mu kontrol eder
 * - Storage signed URL üretip döner (bucket public olmasa bile çalışır)
 */
export async function GET(_req: NextRequest, { params }: { params: { reportId: string } }) {
  const rls = getSupabaseRls();
  const service = getServiceRoleClient();

  const reportId = String(params?.reportId || '').trim();
  if (!reportId) return NextResponse.json({ ok: false, error: 'reportId gerekli' }, { status: 400 });

  // RLS: raporu okuyabiliyor mu?
  const { data: row, error } = await rls
    .from('generated_reports')
    .select('id, file_url, file_path, organization_id, format')
    .eq('id', reportId)
    .single();

  if (error || !row) return NextResponse.json({ ok: false, error: 'Rapor bulunamadı veya yetkiniz yok' }, { status: 404 });
  if (!row.file_path) return NextResponse.json({ ok: false, error: 'Rapor henüz üretilmemiş (file_path yok)' }, { status: 409 });

  const bucket = process.env.SUPABASE_REPORTS_BUCKET || 'generated-reports';
  const { data: signed, error: sErr } = await service.storage.from(bucket).createSignedUrl(String(row.file_path), 60 * 10); // 10 dk
  if (sErr || !signed?.signedUrl) return NextResponse.json({ ok: false, error: sErr?.message || 'Signed URL üretilemedi' }, { status: 500 });

  return NextResponse.json({ ok: true, data: { signedUrl: signed.signedUrl } }, { status: 200 });
}


