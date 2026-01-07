import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// SPECTRA - ÖĞRENCI EŞLEŞTİRME API
// Manuel eşleştirme işlemleri
// ============================================================================

export const dynamic = 'force-dynamic';

/**
 * POST /api/spectra/match
 * Bir katılımcıyı öğrenciyle eşleştir veya misafir olarak işaretle
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();

    const { participantId, studentId, isGuest, organizationId } = body;

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: 'Participant ID gerekli' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID gerekli' },
        { status: 400 }
      );
    }

    // Eğer misafir olarak işaretlenecekse
    if (isGuest) {
      const { error } = await supabase
        .from('exam_participants')
        .update({
          student_id: null,
          participant_type: 'guest',
          match_status: 'guest',
          match_confidence: 1.0,
        })
        .eq('id', participantId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Misafir işaretleme hatası:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Katılımcı misafir olarak işaretlendi',
        participantId,
        matchStatus: 'guest',
      });
    }

    // Öğrenci ile eşleştir
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID veya isGuest gerekli' },
        { status: 400 }
      );
    }

    // Öğrencinin varlığını kontrol et
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_no, first_name, last_name')
      .eq('id', studentId)
      .eq('organization_id', organizationId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Öğrenci bulunamadı' },
        { status: 404 }
      );
    }

    // Eşleştirme yap
    const { error: updateError } = await supabase
      .from('exam_participants')
      .update({
        student_id: studentId,
        participant_type: 'institution',
        match_status: 'matched',
        match_confidence: 1.0, // Manuel eşleştirme = %100 güven
      })
      .eq('id', participantId)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Eşleştirme hatası:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Eşleştirme başarılı',
      participantId,
      studentId,
      studentName: `${student.first_name} ${student.last_name}`,
      matchStatus: 'matched',
    });
  } catch (error: any) {
    console.error('Match API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/spectra/match?examId=xxx&organizationId=xxx
 * Eşleşme bekleyen katılımcıları ve mevcut öğrencileri getir
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const organizationId = searchParams.get('organizationId');

    if (!examId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'examId ve organizationId gerekli' },
        { status: 400 }
      );
    }

    // Eşleşme bekleyen katılımcıları çek
    const { data: pendingParticipants, error: pendingError } = await supabase
      .from('exam_participants')
      .select('id, guest_name, class_name, answers')
      .eq('exam_id', examId)
      .eq('organization_id', organizationId)
      .eq('match_status', 'pending');

    if (pendingError) {
      console.error('Pending participants error:', pendingError);
    }

    // Mevcut öğrencileri çek
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, student_no, first_name, last_name, class')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('first_name');

    if (studentsError) {
      console.error('Students fetch error:', studentsError);
    }

    return NextResponse.json({
      success: true,
      pendingParticipants: (pendingParticipants || []).map((p: any) => ({
        id: p.id,
        opticalName: p.guest_name || 'İsimsiz',
        opticalStudentNo: '-',
        guestClass: p.class_name || '-',
      })),
      availableStudents: (students || []).map((s: any) => ({
        id: s.id,
        studentNo: s.student_no || '-',
        name: `${s.first_name} ${s.last_name}`,
        className: s.class || '-',
      })),
    });
  } catch (error: any) {
    console.error('Match GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

