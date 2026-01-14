import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// ============================================================================
// SPECTRA STEP 4 — SCORING CONFIG API
// ANAYASA v2.0 + EK PROTOKOL v2.1 Uyumlu
// ============================================================================
// - GET: Mevcut config + lesson listesi
// - POST: Upsert config (insert veya update)
// - Auth + organization guard
// - lesson_weights ARRAY validasyonu
// - Scoring engine import ETME
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PresetName = 'LGS' | 'TYT' | 'AYT' | null;
type CancelledPolicy = 'count_as_correct' | 'exclude_from_total';
type Status = 'draft' | 'ready';

interface LessonWeight {
  lesson_id: string;
  weight: number;
}

interface ScoringConfigPayload {
  scoring_type: 'preset' | 'custom';
  preset_name?: PresetName;
  correct_score: number;
  wrong_penalty: number;
  empty_score: number;
  cancelled_question_policy: CancelledPolicy;
  lesson_weights: LessonWeight[];
  status: Status;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESET DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

const PRESET_DEFAULTS: Record<string, Partial<ScoringConfigPayload>> = {
  LGS: {
    correct_score: 1.0,
    wrong_penalty: 0.33, // yanlış / 3
    empty_score: 0,
    cancelled_question_policy: 'count_as_correct',
  },
  TYT: {
    correct_score: 1.0,
    wrong_penalty: 0.25, // yanlış / 4
    empty_score: 0,
    cancelled_question_policy: 'count_as_correct',
  },
  AYT: {
    correct_score: 1.0,
    wrong_penalty: 0.25, // yanlış / 4
    empty_score: 0,
    cancelled_question_policy: 'count_as_correct',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GET - Mevcut config + lessons
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
  // 3️⃣ exam_lessons'ı çek (lesson_weights için gerekli)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: lessons, error: lessonsError } = await supabase
    .from('exam_lessons')
    .select('id, lesson_code, lesson_name, question_count, sort_order')
    .eq('exam_id', examId)
    .order('sort_order', { ascending: true });

  if (lessonsError) {
    console.error('Lessons fetch error:', lessonsError);
    return NextResponse.json(
      { error: 'Ders bilgileri alınamadı' },
      { status: 500 }
    );
  }

  if (!lessons || lessons.length === 0) {
    return NextResponse.json(
      { error: 'Bu sınav için önce Step 2\'de ders tanımlaması yapılmalı' },
      { status: 404 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4️⃣ Mevcut config'i çek (varsa)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: config, error: configError } = await supabase
    .from('exam_scoring_configs')
    .select('*')
    .eq('exam_id', examId)
    .single();

  if (configError && configError.code !== 'PGRST116') {
    console.error('Config fetch error:', configError);
    return NextResponse.json(
      { error: 'Config alınamadı' },
      { status: 500 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5️⃣ Yanıt
  // ─────────────────────────────────────────────────────────────────────────
  return NextResponse.json({
    exists: !!config,
    config: config || null,
    lessons: lessons.map((l) => ({
      id: l.id,
      code: l.lesson_code,
      name: l.lesson_name,
      questionCount: l.question_count,
      order: l.sort_order,
    })),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST - Config kaydet (upsert)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
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
      { error: 'Oturum geçersiz veya süresi dolmuş' },
      { status: 401 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2️⃣ exam_id kontrolü
  // ─────────────────────────────────────────────────────────────────────────
  const examId = params.examId;
  if (!examId) {
    return NextResponse.json(
      { error: 'Sınav ID gerekli' },
      { status: 400 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3️⃣ Body parse
  // ─────────────────────────────────────────────────────────────────────────
  let body: ScoringConfigPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Geçersiz JSON formatı' },
      { status: 400 }
    );
  }

  const {
    scoring_type,
    preset_name,
    correct_score,
    wrong_penalty,
    empty_score,
    cancelled_question_policy,
    lesson_weights,
    status,
  } = body;

  // ─────────────────────────────────────────────────────────────────────────
  // 4️⃣ Validation
  // ─────────────────────────────────────────────────────────────────────────
  
  // Scoring type kontrolü
  if (!['preset', 'custom'].includes(scoring_type)) {
    return NextResponse.json(
      { error: 'Geçersiz scoring_type (preset veya custom olmalı)' },
      { status: 400 }
    );
  }

  // Preset kontrolü
  if (scoring_type === 'preset' && !['LGS', 'TYT', 'AYT'].includes(preset_name || '')) {
    return NextResponse.json(
      { error: 'Geçersiz preset_name (LGS, TYT, AYT olmalı)' },
      { status: 400 }
    );
  }

  // Cancelled policy kontrolü
  if (!['count_as_correct', 'exclude_from_total'].includes(cancelled_question_policy)) {
    return NextResponse.json(
      { error: 'Geçersiz cancelled_question_policy' },
      { status: 400 }
    );
  }

  // Status kontrolü
  if (!['draft', 'ready'].includes(status)) {
    return NextResponse.json(
      { error: 'Geçersiz status (draft veya ready olmalı)' },
      { status: 400 }
    );
  }

  // lesson_weights validasyonu
  if (!Array.isArray(lesson_weights)) {
    return NextResponse.json(
      { error: 'lesson_weights bir array olmalı' },
      { status: 400 }
    );
  }

  for (const weight of lesson_weights) {
    if (!weight.lesson_id || typeof weight.weight !== 'number') {
      return NextResponse.json(
        { error: 'lesson_weights formatı hatalı: {lesson_id: string, weight: number}' },
        { status: 400 }
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5️⃣ Kullanıcının organization_id'sini al
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
  // 6️⃣ Sınavı kontrol et (organization guard)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, organization_id')
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
  // 7️⃣ exam_lessons kontrolü (lesson_weights eşleşmesi için)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: lessons, error: lessonsError } = await supabase
    .from('exam_lessons')
    .select('id')
    .eq('exam_id', examId);

  if (lessonsError) {
    console.error('Lessons fetch error:', lessonsError);
    return NextResponse.json(
      { error: 'Ders bilgileri alınamadı' },
      { status: 500 }
    );
  }

  if (!lessons || lessons.length === 0) {
    return NextResponse.json(
      { error: 'Bu sınav için önce Step 2\'de ders tanımlaması yapılmalı' },
      { status: 409 }
    );
  }

  const validLessonIds = new Set(lessons.map((l) => l.id));

  // lesson_weights'teki lesson_id'lerin geçerli olup olmadığını kontrol et
  for (const weight of lesson_weights) {
    if (!validLessonIds.has(weight.lesson_id)) {
      return NextResponse.json(
        {
          error: `Geçersiz lesson_id: ${weight.lesson_id} (Bu sınava ait değil)`,
        },
        { status: 400 }
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8️⃣ UPSERT (insert or update)
  // ─────────────────────────────────────────────────────────────────────────
  
  const configData = {
    organization_id: organizationId,
    exam_id: examId,
    scoring_type,
    preset_name: preset_name || null,
    correct_score,
    wrong_penalty,
    empty_score,
    cancelled_question_policy,
    lesson_weights,
    status,
  };

  const { error: upsertError } = await supabase
    .from('exam_scoring_configs')
    .upsert(configData, {
      onConflict: 'exam_id', // exam_id UNIQUE constraint
    });

  if (upsertError) {
    console.error('Upsert error:', upsertError);
    return NextResponse.json(
      { error: 'Puanlama config kaydedilemedi' },
      { status: 500 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9️⃣ Başarılı yanıt
  // ─────────────────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    message: 'Puanlama config başarıyla kaydedildi',
    status,
    scoring_type,
    preset_name,
  });
}
