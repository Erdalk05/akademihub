import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// GET - Sınavları Listele (İstatistiklerle Birlikte)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);

    // Query parametrelerini al
    const organizationId = searchParams.get('organizationId');
    const academicYearId = searchParams.get('academicYearId');
    const status = searchParams.get('status');

    // organizationId zorunlu
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId parametresi zorunludur', exams: [] },
        { status: 400 }
      );
    }

    // 1. ADIM: exams tablosundan sınavları getir
    let examsQuery = supabase
      .from('exams')
      .select(`
        id,
        name,
        exam_date,
        exam_type,
        status,
        organization_id,
        academic_year_id,
        created_at
      `)
      .eq('organization_id', organizationId)
      .order('exam_date', { ascending: false });

    // Opsiyonel filtreler
    if (academicYearId) {
      examsQuery = examsQuery.eq('academic_year_id', academicYearId);
    }

    if (status) {
      examsQuery = examsQuery.eq('status', status);
    }

    const { data: exams, error: examsError } = await examsQuery;

    if (examsError) {
      console.error('[API] Exams query error:', examsError);
      return NextResponse.json(
        { error: examsError.message, exams: [] },
        { status: 500 }
      );
    }

    // Sınav yoksa boş dön
    if (!exams || exams.length === 0) {
      return NextResponse.json({ exams: [], message: 'Sınav bulunamadı' });
    }

    // 2. ADIM: Her sınav için student_exam_results'tan istatistikleri hesapla
    const examIds = exams.map((exam) => exam.id);

    const { data: resultsData, error: resultsError } = await supabase
      .from('student_exam_results')
      .select('exam_id, total_net')
      .in('exam_id', examIds);

    if (resultsError) {
      console.error('[API] Results query error:', resultsError);
      // Hata olsa bile sınavları döndür, istatistikler 0 olur
    }

    // 3. ADIM: İstatistikleri sınav bazında grupla
    const statsMap: Record<string, { count: number; totalNet: number }> = {};

    if (resultsData && resultsData.length > 0) {
      for (const result of resultsData) {
        const examId = result.exam_id;

        if (!statsMap[examId]) {
          statsMap[examId] = { count: 0, totalNet: 0 };
        }

        statsMap[examId].count += 1;
        statsMap[examId].totalNet += result.total_net ?? 0;
      }
    }

    // 4. ADIM: Sınavları istatistiklerle zenginleştir
    const enrichedExams = exams.map((exam) => {
      const stats = statsMap[exam.id] || { count: 0, totalNet: 0 };

      const averageNet =
        stats.count > 0
          ? Math.round((stats.totalNet / stats.count) * 100) / 100
          : 0;

      return {
        id: exam.id,
        name: exam.name ?? 'İsimsiz Sınav',
        exam_date: exam.exam_date,
        exam_type: exam.exam_type ?? 'LGS',
        status: exam.status ?? 'pending',
        created_at: exam.created_at,
        total_students: stats.count,
        average_net: averageNet,
      };
    });

    // 5. ADIM: Başarılı response
    return NextResponse.json({
      exams: enrichedExams,
      total: enrichedExams.length,
      message: 'Sınavlar başarıyla getirildi',
    });

  } catch (error: any) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu', details: error.message, exams: [] },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Yeni Sınav Oluştur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const { name, exam_date, exam_type, organization_id, academic_year_id } = body;

    // Validasyon
    if (!name || !organization_id) {
      return NextResponse.json(
        { error: 'name ve organization_id zorunludur' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('exams')
      .insert({
        name,
        exam_date: exam_date || new Date().toISOString(),
        exam_type: exam_type || 'LGS',
        organization_id,
        academic_year_id,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      exam: data,
      message: 'Sınav başarıyla oluşturuldu',
    });

  } catch (error: any) {
    console.error('[API] POST error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error.message },
      { status: 500 }
    );
  }
}