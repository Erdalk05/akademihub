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
    .select('id, class')
    .eq('organization_id', organizationId);

  if (!students || students.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const studentIds = students.map((s: { id: string }) => s.id);
  const studentClassMap: Record<string, string> = {};
  students.forEach((s: { id: string; class: string | null }) => {
    studentClassMap[s.id] = s.class || 'Bilinmiyor';
  });

  const { data: results } = await supabase
    .from('student_exam_results')
    .select('student_id, total_net')
    .in('student_id', studentIds);

  const classStats: Record<string, { students: Set<string>; total: number; count: number }> = {};

  (results || []).forEach((r: { student_id: string; total_net: number | null }) => {
    const className = studentClassMap[r.student_id] || 'Bilinmiyor';
    if (!classStats[className]) {
      classStats[className] = { students: new Set(), total: 0, count: 0 };
    }
    classStats[className].students.add(r.student_id);
    classStats[className].total += r.total_net || 0;
    classStats[className].count += 1;
  });

  const data = Object.entries(classStats)
    .map(([sinif, s]) => ({
      sinif,
      ogrenci_sayisi: s.students.size,
      ortalama_net: s.count > 0 ? Math.round((s.total / s.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.ortalama_net - a.ortalama_net);

  return NextResponse.json({ data });
}
// ✅ ready

