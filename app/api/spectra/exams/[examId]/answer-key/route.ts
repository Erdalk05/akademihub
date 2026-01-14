import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// ============================================================================
// SPECTRA STEP 3 — CEVAP ANAHTARI API
// ANAYASA v2.0 + EK PROTOKOL v2.1 Uyumlu
// ============================================================================
// - POST: Cevap anahtarı kaydet
// - Auth + organization guard
// - exam_lessons ile uyumluluk kontrolü
// - Kitapçık uyumsuzluğu HARD BLOCK
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type BookletType = 'A' | 'B' | 'C' | 'D' | null;

interface AnswerKeyEntry {
  questionNo: number;
  lessonCode: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | null; // null = iptal
  bookletType: BookletType;
}

interface AnswerKeyPayload {
  bookletType: BookletType;
  answers: AnswerKeyEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// POST - Cevap anahtarı kaydet
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
  let body: AnswerKeyPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Geçersiz JSON formatı' },
      { status: 400 }
    );
  }

  const { bookletType, answers } = body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json(
      { error: 'Cevap anahtarı boş olamaz' },
      { status: 400 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4️⃣ Kullanıcının organization_id'sini al
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
  // 5️⃣ Sınavı kontrol et (organization guard)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, organization_id, total_questions')
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
  // 6️⃣ exam_lessons kontrolü (soru sayısı uyumu)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: lessons, error: lessonsError } = await supabase
    .from('exam_lessons')
    .select('lesson_code, question_count, sort_order')
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
      { status: 409 }
    );
  }

  // Toplam soru sayısını hesapla
  const expectedTotalQuestions = lessons.reduce(
    (sum: number, l) => sum + l.question_count,
    0
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 7️⃣ Kitapçık ve soru sayısı validasyonu
  // ─────────────────────────────────────────────────────────────────────────
  
  // Kitapçık tipi validasyonu
  const validBookletTypes = ['A', 'B', 'C', 'D', null];
  if (!validBookletTypes.includes(bookletType)) {
    return NextResponse.json(
      { error: 'Geçersiz kitapçık tipi' },
      { status: 400 }
    );
  }

  // Tüm cevapların aynı kitapçık tipine sahip olması gerekli
  const hasBookletMismatch = answers.some(
    (a) => a.bookletType !== bookletType
  );
  if (hasBookletMismatch) {
    return NextResponse.json(
      { error: 'Kitapçık tipi uyumsuzluğu: Tüm cevaplar aynı kitapçık tipinde olmalı' },
      { status: 409 }
    );
  }

  // Soru sayısı kontrolü
  if (answers.length !== expectedTotalQuestions) {
    return NextResponse.json(
      {
        error: `Soru sayısı uyumsuzluğu: Beklenen ${expectedTotalQuestions}, gelen ${answers.length}`,
      },
      { status: 400 }
    );
  }

  // Cevap validasyonu
  const validAnswers = ['A', 'B', 'C', 'D', 'E', null];
  for (const answer of answers) {
    if (!validAnswers.includes(answer.correctAnswer)) {
      return NextResponse.json(
        { error: `Soru ${answer.questionNo}: Geçersiz cevap (${answer.correctAnswer})` },
        { status: 400 }
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8️⃣ Mevcut cevap anahtarını sil
  // ─────────────────────────────────────────────────────────────────────────
  const { error: deleteError } = await supabase
    .from('exam_answer_keys')
    .delete()
    .eq('exam_id', examId)
    .eq('organization_id', organizationId);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    return NextResponse.json(
      { error: 'Mevcut cevap anahtarı silinemedi' },
      { status: 500 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9️⃣ Yeni cevap anahtarını kaydet (normalize JSONB)
  // ─────────────────────────────────────────────────────────────────────────
  
  // Ders sırasını çıkar
  const dersSirasi = lessons.map((l) => l.lesson_code);

  // answer_key JSONB formatı
  const answerKeyJsonb = answers.map((a) => ({
    soruNo: a.questionNo,
    dersKodu: a.lessonCode,
    dogruCevap: a.correctAnswer,
    kitapcikTipi: a.bookletType,
  }));

  const { error: insertError } = await supabase
    .from('exam_answer_keys')
    .insert({
      organization_id: organizationId,
      exam_id: examId,
      answer_key: answerKeyJsonb,
      ders_sirasi: dersSirasi,
      exam_type: bookletType ? 'BOOKLET' : 'SINGLE',
    });

  if (insertError) {
    console.error('Insert error:', insertError);
    return NextResponse.json(
      { error: 'Cevap anahtarı kaydedilemedi' },
      { status: 500 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 🔟 Başarılı yanıt
  // ─────────────────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    message: 'Cevap anahtarı başarıyla kaydedildi',
    totalQuestions: answers.length,
    bookletType,
    dersSirasi,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET - Mevcut cevap anahtarını getir
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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2️⃣ exam_id kontrolü
  const examId = params.examId;
  if (!examId) {
    return NextResponse.json(
      { error: 'Exam ID is required' },
      { status: 400 }
    );
  }

  // 3️⃣ Cevap anahtarını getir (RLS aktif)
  const { data: answerKey, error: answerKeyError } = await supabase
    .from('exam_answer_keys')
    .select('*')
    .eq('exam_id', examId)
    .single();

  if (answerKeyError && answerKeyError.code !== 'PGRST116') {
    console.error('Answer key fetch error:', answerKeyError);
    return NextResponse.json(
      { error: 'Cevap anahtarı alınamadı' },
      { status: 500 }
    );
  }

  if (!answerKey) {
    return NextResponse.json(
      { exists: false, answerKey: null },
      { status: 200 }
    );
  }

  return NextResponse.json({
    exists: true,
    answerKey: answerKey.answer_key,
    dersSirasi: answerKey.ders_sirasi,
    examType: answerKey.exam_type,
    createdAt: answerKey.created_at,
    updatedAt: answerKey.updated_at,
  });
}
