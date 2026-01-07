import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import {
  predictLGSScore,
  assessRisk,
  analyzeStrengthsWeaknesses,
  generateStudyRecommendations,
} from '@/lib/ai/prediction-engine';

// ============================================================================
// SPECTRA - AI ANALİZ API
// Öğrenci bazlı AI tahmin ve risk analizi
// ============================================================================

export const dynamic = 'force-dynamic';

/**
 * POST /api/spectra/ai-analyze
 * Tek öğrenci veya toplu AI analizi
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();

    const { studentId, studentIds, organizationId, examId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID gerekli' },
        { status: 400 }
      );
    }

    // Tek öğrenci analizi
    if (studentId) {
      const result = await analyzeStudent(supabase, studentId, organizationId);
      return NextResponse.json({ success: true, data: result });
    }

    // Toplu analiz
    if (studentIds && Array.isArray(studentIds)) {
      const results = await Promise.all(
        studentIds.map((id: string) => analyzeStudent(supabase, id, organizationId))
      );

      // Sonuçları DB'ye kaydet
      for (const result of results) {
        if (result) {
          await saveAIProfile(supabase, result, organizationId);
        }
      }

      return NextResponse.json({
        success: true,
        analyzed: results.filter(Boolean).length,
        failed: results.filter((r) => !r).length,
      });
    }

    // Sınava göre toplu analiz
    if (examId) {
      const { data: participants } = await supabase
        .from('exam_participants')
        .select('student_id')
        .eq('exam_id', examId)
        .not('student_id', 'is', null);

      const uniqueStudentIds = [...new Set((participants || []).map((p: any) => p.student_id))];

      const results = await Promise.all(
        uniqueStudentIds.map((id: string) => analyzeStudent(supabase, id, organizationId))
      );

      // Sonuçları DB'ye kaydet
      for (const result of results) {
        if (result) {
          await saveAIProfile(supabase, result, organizationId);
        }
      }

      return NextResponse.json({
        success: true,
        examined: examId,
        analyzed: results.filter(Boolean).length,
      });
    }

    return NextResponse.json(
      { success: false, error: 'studentId, studentIds veya examId gerekli' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('AI Analyze error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

/**
 * Tek öğrenci analizi
 */
async function analyzeStudent(supabase: any, studentId: string, organizationId: string) {
  try {
    // Öğrenci bilgilerini çek
    const { data: student } = await supabase
      .from('students')
      .select('id, first_name, last_name, class')
      .eq('id', studentId)
      .single();

    if (!student) return null;

    // Son 10 sınav sonucunu çek
    const { data: examResults } = await supabase
      .from('exam_participants')
      .select(`
        net,
        correct_count,
        wrong_count,
        empty_count,
        created_at,
        exam:exams (
          id,
          name,
          exam_type
        )
      `)
      .eq('student_id', studentId)
      .not('net', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!examResults || examResults.length === 0) {
      return null;
    }

    // Net geçmişi
    const recentNets = examResults.map((r: any) => r.net).reverse();
    const currentNet = recentNets[recentNets.length - 1];

    // Sınıf ortalamasını hesapla
    const { data: classmates } = await supabase
      .from('students')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('class', student.class)
      .eq('status', 'active');

    let classAverage = currentNet;
    if (classmates && classmates.length > 0) {
      const classmateIds = classmates.map((c: any) => c.id);
      const { data: classResults } = await supabase
        .from('exam_participants')
        .select('net')
        .in('student_id', classmateIds)
        .not('net', 'is', null)
        .order('created_at', { ascending: false })
        .limit(classmateIds.length);

      if (classResults && classResults.length > 0) {
        classAverage = classResults.reduce((sum: number, r: any) => sum + r.net, 0) / classResults.length;
      }
    }

    // Kurum ortalaması
    const { data: orgResults } = await supabase
      .from('exam_participants')
      .select('net')
      .eq('organization_id', organizationId)
      .not('net', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    const organizationAverage = orgResults && orgResults.length > 0
      ? orgResults.reduce((sum: number, r: any) => sum + r.net, 0) / orgResults.length
      : currentNet;

    // LGS tahmini
    const prediction = predictLGSScore(currentNet, recentNets, classAverage, organizationAverage);

    // Risk analizi
    const risk = assessRisk({
      currentNet,
      recentNets,
      classAverage,
      attendanceRate: undefined, // TODO: Devamsızlık verisi eklenebilir
      lastLoginDays: undefined,
    });

    // Güçlü/Zayıf alan analizi (ders bazlı veri gerekli)
    // Şimdilik basit versiyon
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (currentNet >= 70) {
      strengths.push('Genel performans iyi');
    }
    if (currentNet < 50) {
      weaknesses.push('Genel performans düşük');
    }

    // Öneriler
    const recommendations = generateStudyRecommendations(
      weaknesses.map((w) => ({ subject: w, score: currentNet }))
    );

    return {
      studentId,
      studentName: `${student.first_name} ${student.last_name}`,
      prediction,
      risk,
      strengths,
      weaknesses,
      recommendations,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Student analysis error:', studentId, error);
    return null;
  }
}

/**
 * AI profili kaydet
 */
async function saveAIProfile(supabase: any, result: any, organizationId: string) {
  try {
    const { error } = await supabase
      .from('student_ai_profiles')
      .upsert({
        student_id: result.studentId,
        organization_id: organizationId,
        dropout_risk: result.risk.dropoutRisk,
        performance_risk: result.risk.performanceRisk,
        predicted_lgs_score: result.prediction.predictedScore,
        strength_areas: result.strengths,
        weakness_areas: result.weaknesses,
        recommendations: result.recommendations,
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id',
      });

    if (error) {
      console.error('AI profile save error:', error);
    }
  } catch (err) {
    console.error('AI profile upsert error:', err);
  }
}

/**
 * GET /api/spectra/ai-analyze?studentId=xxx
 * Öğrencinin mevcut AI profilini getir
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId gerekli' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('student_ai_profiles')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Profil bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('AI Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

