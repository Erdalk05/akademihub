// ============================================================================
// SPECTRA - EXAM SUMMARY API
// Route: /api/spectra/exams/[examId]/summary
// PDF Header için gerekli tüm bilgileri döndürür
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import type { ExamSummary } from '@/lib/spectra/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;

    if (!examId) {
      return NextResponse.json(
        { success: false, message: 'examId gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 1. Sınav bilgilerini al
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        id,
        name,
        exam_date,
        exam_type,
        status,
        total_questions,
        organization_id,
        organizations (
          id,
          name
        )
      `)
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      console.error('[SPECTRA/SUMMARY] Exam not found:', examError);
      return NextResponse.json(
        { success: false, message: 'Sınav bulunamadı' },
        { status: 404 }
      );
    }

    // 2. Katılımcı sayısını al (exam_participants)
    const { count: participantCount } = await supabase
      .from('exam_participants')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId);

    // 3. Sonuç sayısını al (exam_results via join)
    const { count: resultsCount } = await supabase
      .from('exam_results')
      .select(`
        id,
        exam_participants!inner (exam_id)
      `, { count: 'exact', head: true })
      .eq('exam_participants.exam_id', examId);

    // 4. İstatistikleri hesapla
    const { data: statsData } = await supabase
      .from('exam_results')
      .select(`
        total_net,
        exam_participants!inner (exam_id)
      `)
      .eq('exam_participants.exam_id', examId);

    let statistics;
    if (statsData && statsData.length > 0) {
      const nets = statsData.map(r => r.total_net);
      const sortedNets = [...nets].sort((a, b) => a - b);
      
      statistics = {
        averageNet: nets.reduce((a, b) => a + b, 0) / nets.length,
        maxNet: Math.max(...nets),
        minNet: Math.min(...nets),
        medianNet: sortedNets[Math.floor(sortedNets.length / 2)],
      };
    }

    // Response
    const organization = exam.organizations as unknown as { id: string; name: string } | null;
    
    const summary: ExamSummary = {
      exam: {
        id: exam.id,
        name: exam.name,
        exam_date: exam.exam_date,
        exam_type: exam.exam_type,
        status: exam.status,
        total_questions: exam.total_questions,
      },
      organization: {
        id: organization?.id || exam.organization_id,
        name: organization?.name || 'Bilinmeyen Kurum',
      },
      participantCount: participantCount || 0,
      resultsCount: resultsCount || 0,
      statistics,
    };

    return NextResponse.json({
      success: true,
      ...summary,
    });

  } catch (error: unknown) {
    console.error('[SPECTRA/SUMMARY] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
