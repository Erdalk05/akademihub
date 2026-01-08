import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import type { WizardStep1Data, WizardStep2Data, WizardStep3Data, WizardStep4Data, OgrenciSonuc } from '@/types/spectra-wizard';
import { hesaplaTopluSonuclar, hesaplaIstatistikler, ekleTohminiPuanlar } from '@/lib/spectra-wizard/scoring-engine';
import { SINAV_KONFIGURASYONLARI } from '@/lib/spectra-wizard/exam-configs';

export const dynamic = 'force-dynamic';

// ============================================================================
// SPECTRA - SINAV WIZARD API (V2)
// Yeni sınav ekleme endpoint'i - Güncellenmiş format
// ============================================================================

interface WizardRequestBody {
  organizationId: string;
  academicYearId: string;
  draftExamId: string;
  step1Data: WizardStep1Data;
  step2Data: WizardStep2Data;
  step3Data?: WizardStep3Data;
  step4Data: WizardStep4Data;
}

export async function POST(request: NextRequest) {
  try {
    const body: WizardRequestBody = await request.json();
    const { organizationId, academicYearId, draftExamId, step1Data, step2Data, step3Data, step4Data } = body;

    // Validation
    if (!step1Data?.sinavAdi) {
      return NextResponse.json({ success: false, message: 'Sınav adı gerekli' }, { status: 400 });
    }
    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'Organization ID gerekli' }, { status: 400 });
    }
    if (!step2Data?.cevapAnahtari?.items?.length) {
      return NextResponse.json({ success: false, message: 'Cevap anahtarı gerekli' }, { status: 400 });
    }
    if (!step4Data?.parseResult?.satirlar?.length) {
      return NextResponse.json({ success: false, message: 'Öğrenci verisi gerekli' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const sinavKonfig = SINAV_KONFIGURASYONLARI[step1Data.sinavTuru];

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SINAVI KAYDET
    // ─────────────────────────────────────────────────────────────────────────
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        name: step1Data.sinavAdi,
        exam_date: step1Data.sinavTarihi || new Date().toISOString().split('T')[0],
        exam_type: step1Data.sinavTuru,
        grade_level: step1Data.sinifSeviyesi,
        total_questions: step2Data.cevapAnahtari.toplamSoru,
        organization_id: organizationId,
        academic_year_id: academicYearId || null,
        status: 'active',
        booklet_count: step1Data.kitapcikTurleri.length,
        wrong_coefficient: step1Data.yanlisKatsayisi,
        description: step1Data.aciklama || null,
      })
      .select('id')
      .single();

    if (examError) {
      console.error('❌ Sınav kayıt hatası:', examError);
      return NextResponse.json({ success: false, message: examError.message }, { status: 500 });
    }

    const examId = exam.id;

    // ─────────────────────────────────────────────────────────────────────────
    // 2. DERS BÖLÜMLERINI KAYDET (exam_sections)
    // ─────────────────────────────────────────────────────────────────────────
    const dersSirasi = step2Data.cevapAnahtari.dersSirasi || [];
    const dersGruplari = new Map<string, { items: typeof step2Data.cevapAnahtari.items; sortOrder: number }>();

    step2Data.cevapAnahtari.items.forEach(item => {
      if (!dersGruplari.has(item.dersKodu)) {
        dersGruplari.set(item.dersKodu, { items: [], sortOrder: dersSirasi.indexOf(item.dersKodu) });
      }
      dersGruplari.get(item.dersKodu)!.items.push(item);
    });

    const sectionInserts = Array.from(dersGruplari.entries()).map(([dersKodu, data]) => ({
      exam_id: examId,
      name: data.items[0]?.dersAdi || dersKodu,
      code: dersKodu,
      question_count: data.items.length,
      sort_order: data.sortOrder >= 0 ? data.sortOrder : 999,
    }));

    const { data: sections, error: sectionsError } = await supabase
      .from('exam_sections')
      .insert(sectionInserts)
      .select('id, code');

    if (sectionsError) {
      console.error('❌ Section kayıt hatası:', sectionsError);
      // Devam et, kritik değil
    }

    const sectionIdMap = new Map<string, string>();
    sections?.forEach(s => sectionIdMap.set(s.code, s.id));

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CEVAP ANAHTARINI KAYDET (exam_answer_keys)
    // ─────────────────────────────────────────────────────────────────────────
    const answerKeyInserts = step2Data.cevapAnahtari.items.map(item => ({
      exam_id: examId,
      question_number: item.soruNo,
      correct_answer: item.dogruCevap || '',
      section_code: item.dersKodu,
      section_id: sectionIdMap.get(item.dersKodu) || null,
      kazanim_code: item.kazanimKodu || null,
      kazanim_text: item.kazanimAciklamasi || null,
      is_cancelled: item.iptal || false,
      booklet_answers: item.kitapcikCevaplari ? JSON.stringify(item.kitapcikCevaplari) : null,
    }));

    const { error: answerKeyError } = await supabase
      .from('exam_answer_keys')
      .insert(answerKeyInserts);

    if (answerKeyError) {
      console.error('❌ Cevap anahtarı kayıt hatası:', answerKeyError);
      // Devam et
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SONUÇLARI HESAPLA
    // ─────────────────────────────────────────────────────────────────────────
    let sonuclar = hesaplaTopluSonuclar(
      step4Data.parseResult.satirlar,
      step2Data.cevapAnahtari,
      sinavKonfig,
      examId
    );

    sonuclar = ekleTohminiPuanlar(sonuclar, step1Data.sinavTuru);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. KATILIMCILARI VE SONUÇLARI KAYDET
    // ─────────────────────────────────────────────────────────────────────────
    for (const sonuc of sonuclar) {
      // Katılımcı ekle
      const { data: participant, error: participantError } = await supabase
        .from('exam_participants')
        .insert({
          exam_id: examId,
          organization_id: organizationId,
          student_id: sonuc.studentId || null,
          participant_type: sonuc.isMisafir ? 'guest' : 'institution',
          guest_name: sonuc.isMisafir ? sonuc.ogrenciAdi : null,
          guest_class: sonuc.sinif || null,
          match_status: sonuc.eslesmeDurumu,
          optical_student_no: sonuc.ogrenciNo,
          optical_name: sonuc.ogrenciAdi,
          booklet_type: sonuc.kitapcik,
        })
        .select('id')
        .single();

      if (participantError) {
        console.error('Katılımcı kayıt hatası:', participantError);
        continue;
      }

      const participantId = participant.id;

      // Sonuç ekle
      const { data: result, error: resultError } = await supabase
        .from('exam_results')
        .insert({
          exam_participant_id: participantId,
          total_correct: sonuc.toplamDogru,
          total_wrong: sonuc.toplamYanlis,
          total_blank: sonuc.toplamBos,
          total_net: sonuc.toplamNet,
          organization_rank: sonuc.kurumSirasi,
          class_rank: sonuc.sinifSirasi,
          percentile: sonuc.yuzdelikDilim,
          estimated_score: sonuc.tahminiPuan,
          answers_raw: sonuc.cevaplar ? JSON.stringify(sonuc.cevaplar) : null,
        })
        .select('id')
        .single();

      if (resultError) {
        console.error('Sonuç kayıt hatası:', resultError);
        continue;
      }

      // Ders bazlı sonuçlar
      if (result && sonuc.dersSonuclari) {
        const sectionResults = sonuc.dersSonuclari.map(ders => ({
          exam_result_id: result.id,
          exam_section_id: sectionIdMap.get(ders.dersKodu) || null,
          correct_count: ders.dogru,
          wrong_count: ders.yanlis,
          blank_count: ders.bos,
          net: ders.net,
        }));

        await supabase.from('exam_result_sections').insert(sectionResults);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. İSTATİSTİKLERİ HESAPLA VE KAYDET
    // ─────────────────────────────────────────────────────────────────────────
    const istatistikler = hesaplaIstatistikler(sonuclar);

    await supabase
      .from('exams')
      .update({
        participant_count: istatistikler.toplamKatilimci,
        average_net: istatistikler.ortalamaNet,
        highest_net: istatistikler.enYuksekNet,
        lowest_net: istatistikler.enDusukNet,
        statistics_json: JSON.stringify(istatistikler),
        is_published: true,
      })
      .eq('id', examId);

    return NextResponse.json({
      success: true,
      examId,
      message: 'Sınav başarıyla kaydedildi',
      stats: {
        participants: istatistikler.toplamKatilimci,
        averageNet: istatistikler.ortalamaNet,
      },
    });

  } catch (error: any) {
    console.error('❌ Wizard API hatası:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
