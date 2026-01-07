import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// SPECTRA - KARNE API
// Otomatik karne oluşturma ve indirme
// ============================================================================

export const dynamic = 'force-dynamic';

/**
 * GET /api/spectra/report-card?studentId=xxx&period=xxx
 * Öğrenci karne verilerini getir
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const organizationId = searchParams.get('organizationId');
    const period = searchParams.get('period') || 'current';

    if (!studentId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'studentId ve organizationId gerekli' },
        { status: 400 }
      );
    }

    // Öğrenci bilgileri
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_no, class')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Öğrenci bulunamadı' },
        { status: 404 }
      );
    }

    // Kurum bilgileri
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, logo_url')
      .eq('id', organizationId)
      .single();

    // Son 6 ayın sınavları
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: examResults, error: examError } = await supabase
      .from('exam_participants')
      .select(`
        net,
        rank,
        correct_count,
        wrong_count,
        empty_count,
        created_at,
        exam:exams (
          id,
          name,
          exam_date,
          exam_type
        )
      `)
      .eq('student_id', studentId)
      .not('net', 'is', null)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    if (examError) {
      console.error('Exam results error:', examError);
    }

    // Sınıf arkadaşlarının sayısı (her sınav için)
    const examsWithTotal = await Promise.all(
      (examResults || []).map(async (result: any) => {
        const { count } = await supabase
          .from('exam_participants')
          .select('id', { count: 'exact', head: true })
          .eq('exam_id', result.exam?.id)
          .not('net', 'is', null);

        return {
          id: result.exam?.id,
          name: result.exam?.name || 'Sınav',
          date: result.exam?.exam_date || result.created_at,
          net: result.net,
          rank: result.rank || 0,
          totalStudents: count || 1,
          sections: [], // Ders bazlı veri ayrıca çekilebilir
        };
      })
    );

    // AI profil
    const { data: aiProfile } = await supabase
      .from('student_ai_profiles')
      .select('strength_areas, weakness_areas, recommendations, dropout_risk, performance_risk')
      .eq('student_id', studentId)
      .single();

    // Karne verisi
    const reportCardData = {
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        studentNo: student.student_no || '-',
        className: student.class || '-',
      },
      organization: {
        name: organization?.name || 'AkademiHub',
        logoUrl: organization?.logo_url,
      },
      period: {
        name: '2025-2026 1. Dönem',
        startDate: sixMonthsAgo.toISOString(),
        endDate: new Date().toISOString(),
      },
      exams: examsWithTotal,
      aiAnalysis: aiProfile
        ? {
            strengths: aiProfile.strength_areas || [],
            weaknesses: aiProfile.weakness_areas || [],
            recommendations: (aiProfile.recommendations || []).map((r: any) =>
              typeof r === 'string' ? r : r.reason || ''
            ),
            riskLevel: getRiskLevel(aiProfile.dropout_risk, aiProfile.performance_risk),
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      data: reportCardData,
    });
  } catch (error: any) {
    console.error('Report card error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/spectra/report-card
 * Toplu karne oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();
    const { studentIds, organizationId, period } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'studentIds array gerekli' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId gerekli' },
        { status: 400 }
      );
    }

    // Toplu işlem durumu döndür (gerçek PDF oluşturma client-side yapılacak)
    return NextResponse.json({
      success: true,
      message: `${studentIds.length} öğrenci için karne hazırlanıyor`,
      studentCount: studentIds.length,
      // Client bu ID'leri kullanarak tek tek GET yapabilir
      studentIds,
    });
  } catch (error: any) {
    console.error('Bulk report card error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

function getRiskLevel(
  dropoutRisk: number | null,
  performanceRisk: number | null
): 'low' | 'medium' | 'high' | 'critical' {
  const maxRisk = Math.max(dropoutRisk || 0, performanceRisk || 0);
  if (maxRisk >= 0.7) return 'critical';
  if (maxRisk >= 0.5) return 'high';
  if (maxRisk >= 0.3) return 'medium';
  return 'low';
}

