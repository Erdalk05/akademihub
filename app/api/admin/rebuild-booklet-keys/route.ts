import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function assertAuthorized(req: NextRequest) {
  const expected = process.env.ADMIN_RECALC_TOKEN;
  const given = req.headers.get('x-admin-recalc-token');

  if (!expected) throw new Error('ADMIN_RECALC_TOKEN env tanımlı değil');
  if (!given || given !== expected) {
    const err: any = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}

type AnswerKeyRow = {
  soruNo: number;
  dogruCevap: string; // 'A'..'E'
  dersKodu: string;
  dersAdi?: string;
  kitapcikSoruNo?: { A?: number; B?: number; C?: number; D?: number };
  kitapcikCevaplari?: { A?: string; B?: string; C?: string; D?: string };
  kazanimKodu?: string;
  kazanimMetni?: string;
};

export async function POST(req: NextRequest) {
  try {
    assertAuthorized(req);

    const body = await req.json();
    const examId = body?.examId as string | undefined;

    if (!examId) {
      return NextResponse.json({ ok: false, error: 'examId gerekli' }, { status: 400 });
    }

    console.log(`[REBUILD-BOOKLET] START examId=${examId}`);

    const supabase = getServiceRoleClient();

    // 1) Exam + answer_key
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('id, answer_key, booklets')
      .eq('id', examId)
      .single();

    if (examErr || !exam) {
      return NextResponse.json(
        { ok: false, error: examErr?.message || 'exam not found' },
        { status: 404 },
      );
    }

    const answerKey = (exam as any).answer_key as AnswerKeyRow[] | null;
    if (!answerKey || !Array.isArray(answerKey) || answerKey.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'exams.answer_key boş veya beklenen formatta değil' },
        { status: 400 },
      );
    }

    // 2) Exam tests
    const { data: tests, error: testsErr } = await supabase
      .from('exam_tests')
      .select('id, subject_code, test_name')
      .eq('exam_id', examId);

    if (testsErr) {
      return NextResponse.json({ ok: false, error: testsErr.message }, { status: 500 });
    }

    const testIds = (tests || []).map((t: any) => t.id);
    if (testIds.length === 0) {
      return NextResponse.json({ ok: false, error: 'Bu sınav için exam_tests bulunamadı' }, { status: 400 });
    }

    // 3) Delete existing booklet keys for these tests
    const { count: deletedCount, error: delErr } = await supabase
      .from('booklet_answer_keys')
      .delete({ count: 'exact' })
      .in('test_id', testIds);

    if (delErr) {
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
    }
    console.log(`[REBUILD-BOOKLET] deleted booklet_answer_keys=${deletedCount ?? 0}`);

    // 4) Rebuild correctly
    const now = new Date().toISOString();
    const inserts: any[] = [];

    const byDersKodu = new Map<string, AnswerKeyRow[]>();
    const byDersAdi = new Map<string, AnswerKeyRow[]>();
    for (const r of answerKey) {
      const k = String(r.dersKodu || '').toUpperCase();
      if (k) {
        if (!byDersKodu.has(k)) byDersKodu.set(k, []);
        byDersKodu.get(k)!.push(r);
      }
      const a = String(r.dersAdi || '').toUpperCase();
      if (a) {
        if (!byDersAdi.has(a)) byDersAdi.set(a, []);
        byDersAdi.get(a)!.push(r);
      }
    }

    const rawBooklets = (exam as any).booklets as unknown;
    const booklets =
      Array.isArray(rawBooklets) && rawBooklets.length > 0
        ? rawBooklets
            .map((b: any) => String(b).toUpperCase())
            .filter((b: string) => b === 'A' || b === 'B' || b === 'C' || b === 'D')
        : (['A', 'B'] as const);

    for (const test of tests || []) {
      const subjectCode = String((test as any).subject_code || '').toUpperCase();
      const testName = String((test as any).test_name || '').toUpperCase();
      if (!subjectCode && !testName) continue;

      const testSorulari =
        (subjectCode && byDersKodu.get(subjectCode)) ||
        (testName && byDersAdi.get(testName)) ||
        [];

      if (testSorulari.length === 0) {
        console.warn(
          `[REBUILD-BOOKLET] WARN eşleşmeyen test: test_id=${(test as any).id} subject_code="${subjectCode}" test_name="${testName}"`,
        );
        continue;
      }

      for (const booklet of booklets as Array<'A' | 'B' | 'C' | 'D'>) {
        const answers = [...testSorulari]
          .sort((a, b) => {
            const aNo = a.kitapcikSoruNo?.[booklet] ?? a.soruNo;
            const bNo = b.kitapcikSoruNo?.[booklet] ?? b.soruNo;
            return (aNo || 0) - (bNo || 0);
          })
          // ✅ KRİTİK: kitapçık cevabı varsa onu kullan, yoksa dogruCevap
          .map(s => (s.kitapcikCevaplari?.[booklet] ?? s.dogruCevap) ?? null);

        const competency_mapping = testSorulari.map(s => ({
          soruNo: s.soruNo,
          kazanimKodu: s.kazanimKodu,
          kazanimMetni: s.kazanimMetni,
        }));

        inserts.push({
          test_id: (test as any).id,
          booklet_type: booklet,
          answers,
          competency_mapping,
          created_at: now,
        });
      }
    }

    if (inserts.length > 0) {
      const { error: insErr } = await supabase.from('booklet_answer_keys').insert(inserts);
      if (insErr) {
        return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
      }
    }

    console.log(`[REBUILD-BOOKLET] inserted booklet_answer_keys=${inserts.length}`);
    console.log(`[REBUILD-BOOKLET] DONE examId=${examId} rebuiltTests=${(tests || []).length}`);

    return NextResponse.json({
      ok: true,
      rebuiltTests: (tests || []).length,
      deletedKeys: deletedCount ?? 0,
      insertedKeys: inserts.length,
      bookletsUsed: booklets,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    console.error('[REBUILD-BOOKLET] ERROR', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Sunucu hatası' }, { status });
  }
}


