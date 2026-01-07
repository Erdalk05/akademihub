import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// SPECTRA - SINAV WIZARD API
// Yeni sınav ekleme endpoint'i
// ============================================================================

interface SinavBilgisi {
  sinavAdi: string;
  sinavTarihi: string;
  sinavTuru: string;
  sinifSeviyesi: string;
  toplamSoru: number;
  kitapcikSayisi?: number;
}

interface CevapAnahtariSatir {
  soruNo: number;
  dogruCevap: string;
  kitapcikTuru?: string;
  dersBilgisi?: string;
  konuBilgisi?: string;
  kazanimBilgisi?: string;
  puan?: number;
}

interface OgrenciSonuc {
  ogrenciId?: string;
  ogrenciNo?: string;
  ad: string;
  soyad: string;
  sinif: string;
  cevaplar: string[];
  kitapcikTuru?: string;
  isMisafir?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sinavBilgisi,
      cevapAnahtari,
      ogrenciSonuclari,
      organizationId,
      academicYearId,
    } = body as {
      sinavBilgisi: SinavBilgisi;
      cevapAnahtari: CevapAnahtariSatir[];
      ogrenciSonuclari: OgrenciSonuc[];
      organizationId: string;
      academicYearId?: string | null;
    };

    // Validation
    if (!sinavBilgisi?.sinavAdi) {
      return NextResponse.json(
        { ok: false, error: 'Sınav adı gerekli' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { ok: false, error: 'Organization ID gerekli' },
        { status: 400 }
      );
    }

    if (!cevapAnahtari || cevapAnahtari.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Cevap anahtarı gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 1. Sınavı kaydet
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        name: sinavBilgisi.sinavAdi,
        exam_date: sinavBilgisi.sinavTarihi || new Date().toISOString().split('T')[0],
        exam_type: sinavBilgisi.sinavTuru || 'LGS',
        grade_level: sinavBilgisi.sinifSeviyesi || '8',
        total_questions: sinavBilgisi.toplamSoru || cevapAnahtari.length,
        organization_id: organizationId,
        academic_year_id: academicYearId || null,
        status: 'active',
        booklet_count: sinavBilgisi.kitapcikSayisi || 1,
      })
      .select('id')
      .single();

    if (examError) {
      console.error('❌ Sınav kayıt hatası:', examError);
      return NextResponse.json(
        { ok: false, error: 'Sınav kaydedilemedi: ' + examError.message },
        { status: 500 }
      );
    }

    const examId = exam.id;

    // 2. Cevap anahtarını kaydet
    const answerKeyRows = cevapAnahtari.map((item) => ({
      exam_id: examId,
      question_number: item.soruNo,
      correct_answer: item.dogruCevap,
      booklet_type: item.kitapcikTuru || 'A',
      subject: item.dersBilgisi || null,
      topic: item.konuBilgisi || null,
      learning_outcome: item.kazanimBilgisi || null,
      points: item.puan || 1,
    }));

    const { error: answerKeyError } = await supabase
      .from('exam_answer_keys')
      .insert(answerKeyRows);

    if (answerKeyError) {
      console.error('❌ Cevap anahtarı kayıt hatası:', answerKeyError);
      // Sınavı sil (rollback)
      await supabase.from('exams').delete().eq('id', examId);
      return NextResponse.json(
        { ok: false, error: 'Cevap anahtarı kaydedilemedi: ' + answerKeyError.message },
        { status: 500 }
      );
    }

    // 3. Öğrenci sonuçlarını hesapla ve kaydet
    if (ogrenciSonuclari && ogrenciSonuclari.length > 0) {
      const participantRows: any[] = [];

      for (const ogrenci of ogrenciSonuclari) {
        // Net hesapla
        let correct = 0;
        let wrong = 0;
        let empty = 0;

        const booklet = ogrenci.kitapcikTuru || 'A';
        const relevantAnswerKey = cevapAnahtari.filter(
          (a) => !a.kitapcikTuru || a.kitapcikTuru === booklet
        );

        ogrenci.cevaplar.forEach((cevap, idx) => {
          const correctAnswer = relevantAnswerKey[idx]?.dogruCevap;
          if (!cevap || cevap === '' || cevap === ' ') {
            empty++;
          } else if (cevap.toUpperCase() === correctAnswer?.toUpperCase()) {
            correct++;
          } else {
            wrong++;
          }
        });

        const net = correct - wrong * 0.25;
        const totalQuestions = relevantAnswerKey.length || sinavBilgisi.toplamSoru;
        const score = (net / totalQuestions) * 500; // Basit puan hesabı

        participantRows.push({
          exam_id: examId,
          student_id: ogrenci.ogrenciId || null, // null = misafir
          guest_name: ogrenci.isMisafir ? `${ogrenci.ad} ${ogrenci.soyad}` : null,
          class_name: ogrenci.sinif || '',
          answers: ogrenci.cevaplar,
          booklet_type: booklet,
          correct_count: correct,
          wrong_count: wrong,
          empty_count: empty,
          net: parseFloat(net.toFixed(2)),
          score: parseFloat(score.toFixed(2)),
          organization_id: organizationId,
        });
      }

      // Sıralama ekle
      participantRows.sort((a, b) => b.net - a.net);
      participantRows.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      const { error: participantError } = await supabase
        .from('exam_participants')
        .insert(participantRows);

      if (participantError) {
        console.error('❌ Katılımcı kayıt hatası:', participantError);
        // Rollback
        await supabase.from('exam_answer_keys').delete().eq('exam_id', examId);
        await supabase.from('exams').delete().eq('id', examId);
        return NextResponse.json(
          { ok: false, error: 'Öğrenci sonuçları kaydedilemedi: ' + participantError.message },
          { status: 500 }
        );
      }

      // 4. Sınav istatistiklerini güncelle
      const avgNet = participantRows.reduce((a, b) => a + b.net, 0) / participantRows.length;
      
      await supabase
        .from('exams')
        .update({
          participant_count: participantRows.length,
          avg_net: parseFloat(avgNet.toFixed(2)),
        })
        .eq('id', examId);
    }

    return NextResponse.json({
      ok: true,
      examId,
      message: 'Sınav başarıyla kaydedildi',
      stats: {
        totalQuestions: cevapAnahtari.length,
        participantCount: ogrenciSonuclari?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('❌ Wizard API hatası:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

