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
    // Dinamik insert objesi - sadece var olan kolonları ekle
    const examInsertData: Record<string, any> = {
      name: step1Data.sinavAdi,
      exam_date: step1Data.sinavTarihi || new Date().toISOString().split('T')[0],
      exam_type: step1Data.sinavTuru,
      total_questions: step2Data.cevapAnahtari.toplamSoru,
      organization_id: organizationId,
      status: 'active',
      source: 'spectra', // ✅ Spectra Wizard ile oluşturulan sınav
    };

    // Opsiyonel alanlar (tabloda yoksa hata vermez)
    if (academicYearId) examInsertData.academic_year_id = academicYearId;
    if (step1Data.sinifSeviyesi) examInsertData.grade_level = step1Data.sinifSeviyesi;
    if (step1Data.aciklama) examInsertData.description = step1Data.aciklama;

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert(examInsertData)
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:139',message:'BEFORE hesaplaTopluSonuclar',data:{satirlarCount:step4Data.parseResult.satirlar?.length||0,cevapAnahtariItemsCount:step2Data.cevapAnahtari?.items?.length||0,sinavKonfigExists:!!sinavKonfig},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    let sonuclar = hesaplaTopluSonuclar(
      step4Data.parseResult.satirlar,
      step2Data.cevapAnahtari,
      sinavKonfig,
      examId
    );

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:150',message:'AFTER hesaplaTopluSonuclar',data:{sonuclarCount:sonuclar?.length||0,firstSonuc:sonuclar?.[0]?{ogrenciAdi:sonuclar[0].ogrenciAdi,toplamDogru:sonuclar[0].toplamDogru,toplamNet:sonuclar[0].toplamNet}:null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion

    sonuclar = ekleTohminiPuanlar(sonuclar, step1Data.sinavTuru);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. KATILIMCILARI VE SONUÇLARI KAYDET (Dashboard uyumlu kolonlar)
    // ─────────────────────────────────────────────────────────────────────────
    // Dashboard şu kolonları okuyor: correct_count, wrong_count, empty_count, net, score, rank, class_name, answers
    // Bu kolonları exam_participants'a ekliyoruz
    
    let insertedCount = 0;
    const participantInserts = sonuclar.map((sonuc, index) => ({
      exam_id: examId,
      organization_id: organizationId,
      student_id: sonuc.studentId || null,
      participant_type: sonuc.isMisafir ? 'guest' : 'institution',
      guest_name: sonuc.ogrenciAdi || null,
      guest_class: sonuc.sinif || null,
      class_name: sonuc.sinif || null,
      match_status: sonuc.eslesmeDurumu || 'pending',
      // Sonuç kolonları:
      correct_count: sonuc.toplamDogru || 0,
      wrong_count: sonuc.toplamYanlis || 0,
      empty_count: sonuc.toplamBos || 0,
      net: sonuc.toplamNet || 0,
      score: sonuc.tahminiPuan || null,
      rank: sonuc.kurumSirasi || (index + 1),
      answers: sonuc.cevaplar ? JSON.stringify(sonuc.cevaplar) : null,
    }));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:180',message:'participantInserts created',data:{count:participantInserts?.length||0,firstInsert:participantInserts?.[0]?{exam_id:participantInserts[0].exam_id,participant_type:participantInserts[0].participant_type,correct_count:participantInserts[0].correct_count,net:participantInserts[0].net}:null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // ⚠️ Boş kontrol - kritik debug
    if (participantInserts.length === 0) {
      console.error('❌ participantInserts BOŞ!', { sonuclarCount: sonuclar.length });
      return NextResponse.json({ 
        success: false, 
        message: 'Katılımcı verisi oluşturulamadı. Lütfen optik dosyayı kontrol edin.',
        debug: { sonuclarCount: sonuclar.length }
      }, { status: 400 });
    }

    // Batch insert
    const { data: insertedParticipants, error: participantError } = await supabase
      .from('exam_participants')
      .insert(participantInserts)
      .select('id');

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:205',message:'AFTER INSERT',data:{success:!participantError,insertedCount:insertedParticipants?.length||0,errorMessage:participantError?.message||null,errorCode:participantError?.code||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (participantError) {
      console.error('❌ exam_participants INSERT hatası:', participantError.message);
      console.error('Hata kodu:', participantError.code);
      console.error('İlk kayıt:', JSON.stringify(participantInserts[0], null, 2));
      
      // KRİTİK: Hata durumunda HEMEN return yap
      return NextResponse.json({ 
        success: false, 
        message: `Katılımcı kayıt hatası: ${participantError.message}`,
        error: participantError.code
      }, { status: 500 });
    }

    insertedCount = insertedParticipants?.length || 0;
    console.log(`✅ ${insertedCount} katılımcı kaydedildi`);

    if (insertedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Katılımcı kaydedilemedi - boş sonuç',
      }, { status: 500 });
    }

    // Ayrıca exam_results tablosuna da yaz (eski sistem uyumluluğu için)
    if (insertedParticipants && insertedParticipants.length > 0) {
      for (let i = 0; i < insertedParticipants.length; i++) {
        const participantId = insertedParticipants[i].id;
        const sonuc = sonuclar[i];

        // exam_results tablosuna da yaz
        const { error: resultError } = await supabase
          .from('exam_results')
          .insert({
            exam_participant_id: participantId,
            total_correct: sonuc.toplamDogru || 0,
            total_wrong: sonuc.toplamYanlis || 0,
            total_blank: sonuc.toplamBos || 0,
            total_net: sonuc.toplamNet || 0,
            organization_rank: sonuc.kurumSirasi,
            class_rank: sonuc.sinifSirasi,
            percentile: sonuc.yuzdelikDilim,
            estimated_score: sonuc.tahminiPuan,
            answers_raw: sonuc.cevaplar ? JSON.stringify(sonuc.cevaplar) : null,
          });

        if (resultError) {
          console.warn('exam_results kayıt uyarısı:', resultError.message);
        }

        // Ders bazlı sonuçlar
        if (sonuc.dersSonuclari) {
          const sectionResults = sonuc.dersSonuclari.map(ders => ({
            exam_result_id: participantId,
            exam_section_id: sectionIdMap.get(ders.dersKodu) || null,
            correct_count: ders.dogru,
            wrong_count: ders.yanlis,
            blank_count: ders.bos,
            net: ders.net,
          }));

          await supabase.from('exam_result_sections').insert(sectionResults);
        }
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
