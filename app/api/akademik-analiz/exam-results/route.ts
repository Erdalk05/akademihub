/**
 * Akademik Analiz - Sınav Sonuçları API
 * Detaylı öğrenci sonuçlarını getirir
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = getServiceRoleClient();
  
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    
    if (!examId) {
      return NextResponse.json({ error: 'examId gerekli' }, { status: 400 });
    }
    
    // Sınav bilgilerini getir
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();
    
    if (examError || !exam) {
      console.error('[Exam Results API] Sınav bulunamadı:', examError);
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    // ============================================================
    // ✅ GERÇEK SONUÇ KAYNAĞI: exam_student_results
    // ============================================================
    // Not: Eski student_exam_results tablosu legacy. Ders bazlı analiz için
    // gerçek kaynak subject_results alanıdır.
    const { data: results, error: resultsError } = await supabase
      .from('exam_student_results')
      .select(
        `
        *,
        student:students(id, student_number, first_name, last_name, class_name)
      `,
      )
      .eq('exam_id', examId)
      .order('rank_in_exam', { ascending: true });

    if (resultsError) {
      console.error('[Exam Results API] exam_student_results hatası:', resultsError);
      return NextResponse.json({ error: resultsError.message }, { status: 500 });
    }

    const toplamSoru = Number(exam.total_questions || 90);
    const wrongDiv = String(exam.exam_type || 'LGS').toUpperCase() === 'LGS' ? 3 : 4;

    const ogrenciler = (results || []).map((r: any, index: number) => {
      const subj = (r.subject_results || {}) as Record<string, any>;
      const dersBazli = Object.entries(subj).map(([dersKodu, v]) => ({
        dersKodu,
        dersAdi: getDersAdi(dersKodu),
        dogru: Number((v as any)?.correct ?? 0),
        yanlis: Number((v as any)?.wrong ?? 0),
        bos: Number((v as any)?.empty ?? 0),
        net: Number((v as any)?.net ?? 0),
      }));

      // Puan: scaled_score varsa onu, yoksa raw_score, yoksa null
      const puanRaw = (r.scaled_score ?? r.raw_score ?? null) as number | null;
      const puan = puanRaw !== null ? Math.round(Number(puanRaw) * 100) / 100 : null;

      // Öğrenci adı: DB’de zaten Türkçe büyük harf (biz böyle kaydediyoruz) ama yine de birleştir
      const firstName = String(r.student?.first_name || '').trim();
      const lastName = String(r.student?.last_name || '').trim();
      const fullName = `${firstName} ${lastName}`.trim() || 'Bilinmeyen';

      return {
        id: r.id,
        ogrenciNo: String(r.student?.student_number || ''),
        ogrenciAdi: fullName,
        sinifNo: r.student?.class_name || null,
        kitapcik: 'A', // exam_student_answers’da kitapçık tutulmadığı için burada güvenli varsayım
        toplamDogru: Number(r.total_correct || 0),
        toplamYanlis: Number(r.total_wrong || 0),
        toplamBos: Number(r.total_empty || 0),
        toplamNet: Number(r.total_net || 0),
        toplamPuan: puan,
        siralama: Number(r.rank_in_exam || index + 1),
        sinifSira: r.rank_in_class || null,
        dersBazli,
        percentile: r.percentile ?? null,
      };
    });

    // Ders ortalamaları (3. foto mantığı)
    const dersToplam: Record<string, { dogru: number; yanlis: number; bos: number; net: number; sayi: number }> = {};
    ogrenciler.forEach((o: any) => {
      (o.dersBazli || []).forEach((d: any) => {
        const k = String(d.dersKodu || '').toUpperCase();
        if (!k) return;
        if (!dersToplam[k]) dersToplam[k] = { dogru: 0, yanlis: 0, bos: 0, net: 0, sayi: 0 };
        dersToplam[k].dogru += Number(d.dogru || 0);
        dersToplam[k].yanlis += Number(d.yanlis || 0);
        dersToplam[k].bos += Number(d.bos || 0);
        dersToplam[k].net += Number(d.net || 0);
        dersToplam[k].sayi += 1;
      });
    });

    const dersOrtalamalari = Object.entries(dersToplam).map(([dersKodu, t]) => ({
      dersKodu,
      dersAdi: getDersAdi(dersKodu),
      ortDogru: t.sayi > 0 ? Math.round((t.dogru / t.sayi) * 100) / 100 : 0,
      ortYanlis: t.sayi > 0 ? Math.round((t.yanlis / t.sayi) * 100) / 100 : 0,
      ortBos: t.sayi > 0 ? Math.round((t.bos / t.sayi) * 100) / 100 : 0,
      ortNet: t.sayi > 0 ? Math.round((t.net / t.sayi) * 100) / 100 : 0,
    }));
    
    // İstatistikleri hesapla
    const toplamOgrenci = ogrenciler.length;
    const toplamNet = ogrenciler.reduce((s: number, o: any) => s + o.toplamNet, 0);
    const ortalamaNet = toplamOgrenci > 0 ? toplamNet / toplamOgrenci : 0;

    const puanli = ogrenciler.filter((o: any) => typeof o.toplamPuan === 'number');
    const ortalamaPuan = puanli.length > 0
      ? puanli.reduce((s: number, o: any) => s + (o.toplamPuan || 0), 0) / puanli.length
      : null;
    const enYuksekPuan = puanli.length > 0 ? Math.max(...puanli.map((o: any) => o.toplamPuan || 0)) : null;
    
    return NextResponse.json({
      exam: {
        id: exam.id,
        ad: exam.name,
        tarih: exam.exam_date,
        tip: exam.exam_type || 'LGS',
        toplamSoru,
        toplamOgrenci,
        ortalamaNet: parseFloat(ortalamaNet.toFixed(2)),
        ortalamaPuan: ortalamaPuan !== null ? Math.round(ortalamaPuan * 100) / 100 : null,
        enYuksekPuan,
        wrongPenaltyDivisor: wrongDiv,
        dersOrtalamalari,
        ogrenciler
      }
    });
    
  } catch (error: any) {
    console.error('[Exam Results API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}

// Ders kodu -> Ders adı
function getDersAdi(kod: string): string {
  const map: Record<string, string> = {
    'TUR': 'Türkçe',
    'MAT': 'Matematik',
    'FEN': 'Fen Bilimleri',
    'SOS': 'Sosyal Bilgiler',
    'ING': 'İngilizce',
    'DIN': 'Din Kültürü',
    'TURKCE': 'Türkçe',
    'MATEMATIK': 'Matematik',
    'FEN_BILIMLERI': 'Fen Bilimleri',
    'SOSYAL_BILGILER': 'Sosyal Bilgiler',
    'INGILIZCE': 'İngilizce',
    'DIN_KULTURU': 'Din Kültürü'
  };
  return map[kod] || kod;
}

