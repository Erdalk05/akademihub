import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// ============================================================================
// SPECTRA STEP 5 — RESULTS API
// ANAYASA v2.0 + EK PROTOKOL v2.1 Uyumlu
// ============================================================================
// - GET: exam_results tablosundan sonuçları çek
// - Auth + organization guard
// - Hesaplama mantığı YOK, sadece DB okuma
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// GET - Sınav sonuçlarını getir
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 1️⃣ Auth kontrolü
  // ─────────────────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2️⃣ exam_id kontrolü
  // ─────────────────────────────────────────────────────────────────────────
  const examId = params.examId;
  if (!examId) {
    return NextResponse.json(
      { error: 'Exam ID is required' },
      { status: 400 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3️⃣ Kullanıcının organization_id'sini al
  // ─────────────────────────────────────────────────────────────────────────
  const { data: appUser, error: appUserError } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('auth_user_id', user.id)
    .single();

  if (appUserError || !appUser?.organization_id) {
    return NextResponse.json(
      { error: 'Kullanıcı organizasyonu bulunamadı' },
      { status: 401 }
    );
  }

  const organizationId = appUser.organization_id;

  // ─────────────────────────────────────────────────────────────────────────
  // 4️⃣ Sınavı kontrol et (organization guard)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, organization_id, name')
    .eq('id', examId)
    .eq('organization_id', organizationId)
    .single();

  if (examError || !exam) {
    return NextResponse.json(
      { error: 'Sınav bulunamadı veya erişim yetkiniz yok' },
      { status: 404 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5️⃣ exam_results'tan sonuçları çek (RLS aktif)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: results, error: resultsError } = await supabase
    .from('exam_results')
    .select('*')
    .eq('exam_id', examId)
    .order('total_net', { ascending: false }); // Net'e göre sıralı

  if (resultsError) {
    console.error('Results fetch error:', resultsError);
    return NextResponse.json(
      { error: 'Sonuçlar alınamadı' },
      { status: 500 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6️⃣ Sonuç yoksa boş array dön
  // ─────────────────────────────────────────────────────────────────────────
  if (!results || results.length === 0) {
    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        name: exam.name,
      },
      results: [],
      stats: {
        total_participants: 0,
        avg_net: 0,
        avg_score: 0,
        max_net: 0,
        min_net: 0,
      },
      message: 'Bu sınav için henüz hesaplama yapılmamış',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7️⃣ İstatistik hesapla
  // ─────────────────────────────────────────────────────────────────────────
  const totalParticipants = results.length;
  const avgNet = results.reduce((sum, r) => sum + Number(r.total_net), 0) / totalParticipants;
  const avgScore = results.reduce((sum, r) => sum + Number(r.total_score), 0) / totalParticipants;
  const maxNet = Math.max(...results.map((r) => Number(r.total_net)));
  const minNet = Math.min(...results.map((r) => Number(r.total_net)));

  // ─────────────────────────────────────────────────────────────────────────
  // 8️⃣ Yanıt
  // ─────────────────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    exam: {
      id: exam.id,
      name: exam.name,
    },
    results: results.map((r) => ({
      id: r.id,
      student_id: r.student_id,
      participant_name: r.participant_name,
      participant_identifier: r.participant_identifier,
      booklet_type: r.booklet_type,
      total_correct: r.total_correct,
      total_wrong: r.total_wrong,
      total_empty: r.total_empty,
      total_cancelled: r.total_cancelled,
      total_net: Number(r.total_net),
      total_score: Number(r.total_score),
      lesson_breakdown: r.lesson_breakdown,
      scoring_snapshot: r.scoring_snapshot,
      calculated_at: r.calculated_at,
    })),
    stats: {
      total_participants: totalParticipants,
      avg_net: parseFloat(avgNet.toFixed(2)),
      avg_score: parseFloat(avgScore.toFixed(2)),
      max_net: parseFloat(maxNet.toFixed(2)),
      min_net: parseFloat(minNet.toFixed(2)),
    },
  });
}
