import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// ─────────────────────────────────────────────────────────────────────────────
// GET - Sınav derslerini getir
// Step 3+ için gerekli
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

  // 1️⃣ Auth kontrolü
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2️⃣ exam_id kontrolü
  const examId = params.examId;
  if (!examId) {
    return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
  }

  // 3️⃣ Ders listesini çek (RLS aktif)
  const { data: lessons, error: lessonsError } = await supabase
    .from('exam_lessons')
    .select('*')
    .eq('exam_id', examId)
    .order('sort_order', { ascending: true });

  if (lessonsError) {
    console.error('Lessons fetch error:', lessonsError);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }

  if (!lessons || lessons.length === 0) {
    return NextResponse.json(
      { error: 'No lessons found for this exam' },
      { status: 404 }
    );
  }

  // 4️⃣ Toplam soru sayısını hesapla
  const totalQuestions = lessons.reduce(
    (sum: number, l: { question_count: number }) => sum + l.question_count,
    0
  );

  return NextResponse.json({
    success: true,
    lessons: lessons.map((l: {
      id: string;
      lesson_code: string;
      lesson_name: string;
      question_count: number;
      sort_order: number;
    }) => ({
      id: l.id,
      code: l.lesson_code,
      name: l.lesson_name,
      questionCount: l.question_count,
      order: l.sort_order,
    })),
    totalQuestions,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST - Yeni ders kaydet
// Step 2 için
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

  // 1️⃣ Auth kontrolü
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2️⃣ Body
  const { lessons } = await req.json();

  if (!Array.isArray(lessons) || lessons.length === 0) {
    return NextResponse.json(
      { error: 'Lessons array is required' },
      { status: 400 }
    );
  }

  // 3️⃣ DB rows
  const lessonRows = lessons.map((lesson) => ({
    exam_id: params.examId,
    lesson_code: lesson.code,
    lesson_name: lesson.name,
    question_count: lesson.questionCount,
    sort_order: lesson.order,
  }));

  // 4️⃣ Insert (RLS AKTİF)
  const { error: insertError } = await supabase
    .from('exam_lessons')
    .insert(lessonRows);

  if (insertError) {
    console.error(insertError);
    return NextResponse.json(
      { error: 'Failed to insert exam lessons' },
      { status: 500 }
    );
  }

  const totalQuestions = lessonRows.reduce(
    (sum: number, l) => sum + l.question_count,
    0
  );

  return NextResponse.json({
    success: true,
    lessonCount: lessonRows.length,
    totalQuestions,
  });
}
