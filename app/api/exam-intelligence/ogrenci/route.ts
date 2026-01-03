import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const supabase = await getSupabase();
  const organizationId = new URL(request.url).searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId gerekli', data: [] });
  }

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, class')
    .eq('organization_id', organizationId);

  if (!students || students.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const studentIds = students.map((s: { id: string }) => s.id);

  const { data: results } = await supabase
    .from('student_exam_results')
    .select('student_id, total_net')
    .in('student_id', studentIds);

  const statsMap: Record<string, { total: number; count: number }> = {};
  (results || []).forEach((r: { student_id: string; total_net: number | null }) => {
    if (!statsMap[r.student_id]) statsMap[r.student_id] = { total: 0, count: 0 };
    statsMap[r.student_id].total += r.total_net || 0;
    statsMap[r.student_id].count += 1;
  });

  const data = students.map((s: { id: string; first_name: string; last_name: string; class: string | null }) => {
    const stats = statsMap[s.id] || { total: 0, count: 0 };
    return {
      student_id: s.id,
      ad_soyad: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
      sinif: s.class || 'Bilinmiyor',
      ortalama_net: stats.count > 0 ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
      sinav_sayisi: stats.count,
    };
  });

  return NextResponse.json({ data });
}
// ✅ ready

