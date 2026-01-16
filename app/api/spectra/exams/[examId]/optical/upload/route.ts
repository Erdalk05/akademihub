// ============================================================================
// SPECTRA - OPTICAL UPLOAD API
// Route: /api/spectra/exams/[examId]/optical/upload
// TXT/DAT dosya parse + katılımcı + sonuç üretme
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { parseOptikData, autoDetectSablon, OPTIK_SABLONLARI } from '@/lib/spectra-wizard/optical-parser';
import type { OptikFormSablonu } from '@/types/spectra-wizard';
import type { OpticalUploadResult, AnswerOption } from '@/lib/spectra/types';

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
    const templateId = formData.get('template_id') as string | null;
    const autoDetect = formData.get('auto_detect') !== 'false';
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

    // 3. Şablon belirle
    let template: OptikFormSablonu | null = null;

    if (templateId) {
      template = OPTIK_SABLONLARI.find(t => t.id === templateId) || null;
    }

    if (!template && autoDetect) {
      template = autoDetectSablon(fileContent, exam.exam_type);
    }

    if (!template) {
      // Varsayılan şablon (LGS 90 soru)
      template = OPTIK_SABLONLARI.find(t => t.id === 'meb-8-sinif-lgs') || OPTIK_SABLONLARI[0];
    }

    // 4. Optik veriyi parse et
    const parseResult = parseOptikData(fileContent, template);

    if (!parseResult.basarili && parseResult.satirlar.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Dosya parse edilemedi',
        errors: parseResult.hatalar.map(h => h.mesaj),
      }, { status: 400 });
    }

    // 5. Cevap anahtarını al
    const { data: answerKeys } = await supabase
      .from('exam_answer_keys')
      .select('question_number, correct_answer, section_code, is_cancelled')
      .eq('exam_id', examId)
      .order('question_number');

    // Cevap anahtarı map
    const answerKeyMap = new Map<number, { answer: AnswerOption; cancelled: boolean; section: string }>();
    answerKeys?.forEach(ak => {
      answerKeyMap.set(ak.question_number, {
        answer: ak.correct_answer as AnswerOption,
        cancelled: ak.is_cancelled || false,
        section: ak.section_code || '',
      });
    });

    // 6. Öğrenci eşleştirmesi yap
    const { data: students } = await supabase
      .from('students')
      .select('id, student_no, first_name, last_name')
      .eq('organization_id', exam.organization_id);

    const studentMap = new Map<string, string>();
    students?.forEach(s => {
      studentMap.set(s.student_no, s.id);
    });

    // 7-10. Her katılımcı için tek tek UPSERT yap
    const result: OpticalUploadResult = {
      insertedParticipants: 0,
      insertedResults: 0,
      updatedResults: 0,
      errors: [],
      warnings: [],
    };

    for (const satir of parseResult.satirlar) {
      if (satir.hatalar.some(h => typeof h === 'object' && h.seviye === 'error')) {
        result.errors.push(`Satır ${satir.satirNo}: Parse hatası`);
        continue;
      }

      // 7. Katılımcı payload hazırla
      const studentId = satir.ogrenciNo ? studentMap.get(satir.ogrenciNo) : null;
      const participantData = {
        exam_id: examId,
        organization_id: exam.organization_id,
        student_id: studentId,
        participant_type: studentId ? 'institution' : 'guest',
        participant_name: satir.ogrenciAdi || `Öğrenci ${satir.satirNo}`,
        guest_name: studentId ? null : satir.ogrenciAdi,
        guest_class: satir.sinif,
        class_name: satir.sinif,
        match_status: studentId ? 'matched' : 'pending',
        answers: JSON.stringify(satir.cevaplar),
        booklet_type: satir.kitapcik,
      };

      // 8. exam_participants UPSERT + exam_participant_id al
      const { data: participant, error: participantError } = await supabase
        .from('exam_participants')
        .upsert(participantData, { onConflict: 'exam_id,student_id' })
        .select('id')
        .single();

      if (participantError || !participant) {
        result.errors.push(`Satır ${satir.satirNo}: Katılımcı kaydedilemedi`);
        continue;
      }

      const participantId = participant.id;
      result.insertedParticipants++;

      // 9. Sonuç hesapla
      if (!recalculateResults || !answerKeys || answerKeys.length === 0) {
        continue;
      }

      const cevaplar = satir.cevaplar;

      let correct = 0;
      let wrong = 0;
      let empty = 0;
      let cancelled = 0;

      const lessonResults = new Map<string, { correct: number; wrong: number; empty: number; cancelled: number }>();

      cevaplar.forEach((cevap: AnswerOption, index: number) => {
        const questionNum = index + 1;
        const ak = answerKeyMap.get(questionNum);

        if (!ak) return;

        const lessonCode = ak.section;
        if (!lessonResults.has(lessonCode)) {
          lessonResults.set(lessonCode, { correct: 0, wrong: 0, empty: 0, cancelled: 0 });
        }
        const lessonResult = lessonResults.get(lessonCode)!;

        if (ak.cancelled) {
          cancelled++;
          lessonResult.cancelled++;
          lessonResult.correct++;
          correct++;
        } else if (!cevap) {
          empty++;
          lessonResult.empty++;
        } else if (cevap === ak.answer) {
          correct++;
          lessonResult.correct++;
        } else {
          wrong++;
          lessonResult.wrong++;
        }
      });

      const totalNet = correct - (wrong / 4);

      const lessonBreakdown = Array.from(lessonResults.entries()).map(([code, data]) => ({
        lesson_code: code,
        lesson_name: code,
        correct: data.correct,
        wrong: data.wrong,
        empty: data.empty,
        cancelled: data.cancelled,
        net: data.correct - (data.wrong / 4),
      }));

      // 10. exam_results UPSERT
      const { error: resultError } = await supabase
        .from('exam_results')
        .upsert({
          exam_participant_id: participantId,
          total_correct: correct,
          total_wrong: wrong,
          total_empty: empty,
          total_cancelled: cancelled,
          total_net: totalNet,
          total_score: totalNet * 5,
          lesson_breakdown: lessonBreakdown,
          scoring_snapshot: { type: 'auto', penalty: 0.25 },
          calculated_at: new Date().toISOString(),
        }, { onConflict: 'exam_participant_id' });

      if (resultError) {
        result.errors.push(`Satır ${satir.satirNo}: Sonuç kaydedilemedi`);
      } else {
        result.insertedResults++;
      }
    }

    // 11. Sınav istatistiklerini güncelle
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

    // 12. Warnings ekle
    if (parseResult.uyarilar.length > 0) {
      result.warnings = parseResult.uyarilar.map(u => u.mesaj);
    }

    console.log(`[OPTICAL] ✅ Processed ${file.name}: ${result.insertedParticipants} participants, ${result.insertedResults} results`);

    return NextResponse.json({
      success: true,
      ...result,
      parseInfo: {
        fileName: file.name,
        templateName: template.ad,
        totalLines: parseResult.toplamSatir,
        successfulLines: parseResult.basariliSatir,
        errorLines: parseResult.hataliSatir,
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
