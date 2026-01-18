// ============================================================================
// SPECTRA - OPTICAL UPLOAD API
// Route: /api/spectra/exams/[examId]/optical/upload
// TXT/DAT dosya parse + katılımcı + sonuç üretme
// SCORING: FAZ 1 Core Engine (lib/scoring-engine/core.ts)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { parseOpticalText } from '@/lib/scoring-engine/adapters/optical-adapter';
import { buildWizardPayloadFromOpticalAndSupabase } from '@/lib/scoring-engine/adapters/optical-supabase-adapter';
import { adaptWizardPayloadToScoringInput } from '@/lib/scoring-engine/adapters/wizard-adapter';
import { scoreExam } from '@/lib/scoring-engine/core';
import { writeExamAuditLog } from '@/lib/audit/examAudit';
import type { OpticalUploadResult } from '@/lib/spectra/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Optik Dosya Yükle ve İşle
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;

    if (!examId) {
      return NextResponse.json(
        { success: false, message: 'examId gerekli' },
        { status: 400 }
      );
    }

    // FormData al
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const recalculateResults = formData.get('recalculate_results') !== 'false';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Dosya gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 1. Sınav bilgilerini al
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, name, exam_type, organization_id, total_questions')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { success: false, message: 'Sınav bulunamadı' },
        { status: 404 }
      );
    }

    // 2. Dosyayı oku
    const fileContent = await file.text();

    // 3. Optik veriyi parse et (FAZ 3 adapter)
    const { studentAnswers } = parseOpticalText(fileContent);

    if (!studentAnswers || studentAnswers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Dosya parse edilemedi veya cevap bulunamadı',
        errors: ['Geçerli optik veri bulunamadı'],
      }, { status: 400 });
    }

    // 4. Öğrenci eşleştirmesi yap
    const { data: students } = await supabase
      .from('students')
      .select('id, student_no, first_name, last_name')
      .eq('organization_id', exam.organization_id);

    const studentMap = new Map<string, string>();
    students?.forEach(s => {
      studentMap.set(s.student_no, s.id);
    });

    // 5. Her katılımcı için işlem yap
    const result: OpticalUploadResult = {
      insertedParticipants: 0,
      insertedResults: 0,
      updatedResults: 0,
      errors: [],
      warnings: [],
    };

    // Parse edilen öğrencileri grupla (basit format: her satır bir öğrenci)
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Basit format parse: "STUDENT_NO|NAME|CLASS|BOOKLET|ANSWERS"
        const parts = line.split('|');
        const studentNo = parts[0]?.trim() || '';
        const studentName = parts[1]?.trim() || `Öğrenci ${i + 1}`;
        const className = parts[2]?.trim() || '';
        const booklet = (parts[3]?.trim() || 'A') as 'A' | 'B' | 'C' | 'D';
        
        const studentId = studentNo ? studentMap.get(studentNo) : null;

        // 6. Katılımcı payload hazırla
        const participantData = {
          exam_id: examId,
          organization_id: exam.organization_id,
          student_id: studentId,
          participant_type: studentId ? 'institution' : 'guest',
          participant_name: studentName,
          guest_name: studentId ? null : studentName,
          guest_class: className,
          class_name: className,
          match_status: studentId ? 'matched' : 'pending',
          answers: JSON.stringify(studentAnswers.slice(i * exam.total_questions, (i + 1) * exam.total_questions)),
          booklet_type: booklet,
        };

        // 7. exam_participants UPSERT
        const { data: participant, error: participantError } = await supabase
          .from('exam_participants')
          .upsert(participantData, { onConflict: 'exam_id,student_id' })
          .select('id')
          .single();

        if (participantError || !participant) {
          result.errors.push(`Satır ${i + 1}: Katılımcı kaydedilemedi - ${participantError?.message || 'Unknown error'}`);
          continue;
        }

        const participantId = participant.id;
        result.insertedParticipants++;

        // 8. Scoring (FAZ 1 CORE ENGINE - TEK KAYNAK)
        if (!recalculateResults) {
          continue;
        }

        try {
          // ✅ FAZ 3: Supabase + Optical → WizardPayload
          const wizardPayload = await buildWizardPayloadFromOpticalAndSupabase(
            supabase,
            examId,
            participantId,
            {
              type: 'text',
              payload: line, // Ham optik satırı
            }
          );

          // ✅ FAZ 2: WizardPayload → ScoringInput
          const scoringInput = adaptWizardPayloadToScoringInput(wizardPayload);

          // ✅ FAZ 1: TEK VE ZORUNLU SCORING
          const scoringResult = scoreExam(scoringInput);

          // 9. exam_results UPSERT (SADECE scoreExam çıktısı)
          const { error: resultError } = await supabase
            .from('exam_results')
            .upsert({
              exam_participant_id: participantId,
              total_correct: scoringResult.totalCorrect,
              total_wrong: scoringResult.totalWrong,
              total_empty: scoringResult.totalEmpty,
              total_cancelled: scoringResult.totalCancelled,
              total_net: scoringResult.totalNet,
              total_score: scoringResult.totalScore,
              lesson_breakdown: scoringResult.lessonBreakdowns.map(lb => ({
                lesson_code: lb.lessonCode || lb.lessonName,
                lesson_name: lb.lessonName,
                correct: lb.correct,
                wrong: lb.wrong,
                empty: lb.empty,
                cancelled: lb.cancelled || 0,
                net: lb.net,
              })),
              // ✅ IMMUTABLE SNAPSHOT (Replay için)
              scoring_snapshot: {
                engine_version: '1.0',
                preset: scoringResult.appliedPreset,
                booklet: scoringResult.booklet,
                input_payload: wizardPayload,
                output_result: scoringResult,
                calculated_at: new Date().toISOString(),
              },
              calculated_at: new Date().toISOString(),
            }, { onConflict: 'exam_participant_id' });

          if (resultError) {
            result.errors.push(`Satır ${i + 1}: Sonuç kaydedilemedi - ${resultError.message}`);
          } else {
            result.insertedResults++;

            // ✅ AUDIT LOG
            await writeExamAuditLog({
              action: 'RECALC',
              entityType: 'exam_result',
              entityId: participantId,
              examId: examId,
              studentId: studentId,
              organizationId: exam.organization_id,
              description: `Optical upload scoring via FAZ 1 core engine`,
              metadata: {
                preset: scoringResult.appliedPreset,
                booklet: scoringResult.booklet,
                totalNet: scoringResult.totalNet,
                totalScore: scoringResult.totalScore,
              },
            });
          }

        } catch (scoringError: any) {
          result.errors.push(`Satır ${i + 1}: Scoring hatası - ${scoringError?.message || 'Unknown error'}`);
          console.error('[OPTICAL] Scoring error:', scoringError);
        }

      } catch (lineError: any) {
        result.errors.push(`Satır ${i + 1}: Parse hatası - ${lineError?.message || 'Unknown error'}`);
        continue;
      }
    }

    // 10. Sınav istatistiklerini güncelle
    if (result.insertedParticipants > 0) {
      const { count: totalParticipants } = await supabase
        .from('exam_participants')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId);

      await supabase
        .from('exams')
        .update({
          participant_count: totalParticipants || 0,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', examId);
    }

    console.log(`[OPTICAL] ✅ Processed ${file.name}: ${result.insertedParticipants} participants, ${result.insertedResults} results (FAZ 1 Core Engine)`);

    return NextResponse.json({
      success: true,
      ...result,
      parseInfo: {
        fileName: file.name,
        totalLines: lines.length,
        successfulLines: result.insertedParticipants,
        errorLines: result.errors.length,
        engine: 'FAZ 1 Core (lib/scoring-engine/core.ts)',
      },
    });

  } catch (error: unknown) {
    console.error('[OPTICAL] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
