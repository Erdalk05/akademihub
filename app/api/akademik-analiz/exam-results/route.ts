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
    
    // Öğrenci sonuçlarını getir
    const { data: results, error: resultsError } = await supabase
      .from('student_exam_results')
      .select('*')
      .eq('exam_id', examId)
      .order('general_rank', { ascending: true });
    
    if (resultsError) {
      console.error('[Exam Results API] Sonuçlar hatası:', resultsError);
      return NextResponse.json({ error: resultsError.message }, { status: 500 });
    }
    
    // Testleri getir (ders bazlı sonuçlar için)
    const { data: tests } = await supabase
      .from('exam_tests')
      .select('*')
      .eq('exam_id', examId)
      .order('test_order', { ascending: true });
    
    // Veriyi dönüştür
    const ogrenciler = (results || []).map((r: any, index: number) => {
      // Ders bazlı sonuçları hesapla (eğer cevaplar varsa)
      let dersBazli: any[] = [];
      
      // Eğer test sonuçları varsa onları kullan
      // Şimdilik exam'deki answer_key'den ders bilgilerini çıkaralım
      if (exam.answer_key && Array.isArray(exam.answer_key)) {
        const dersGruplari: Record<string, { dogru: number; yanlis: number; bos: number; total: number }> = {};
        
        // Cevap anahtarından dersleri grupla
        exam.answer_key.forEach((cevap: any) => {
          if (!dersGruplari[cevap.dersKodu]) {
            dersGruplari[cevap.dersKodu] = { dogru: 0, yanlis: 0, bos: 0, total: 0 };
          }
          dersGruplari[cevap.dersKodu].total++;
        });
        
        // Her ders için ortalama hesapla (gerçek veriler olmadan tahmini)
        const toplamSoru = exam.answer_key.length || 90;
        const dogru = r.total_correct || 0;
        const yanlis = r.total_wrong || 0;
        
        Object.entries(dersGruplari).forEach(([dersKodu, vals]) => {
          const oran = vals.total / toplamSoru;
          const dersDogru = Math.round(dogru * oran);
          const dersYanlis = Math.round(yanlis * oran);
          const dersBos = vals.total - dersDogru - dersYanlis;
          const dersNet = dersDogru - (dersYanlis / (exam.exam_type === 'LGS' ? 3 : 4));
          
          dersBazli.push({
            dersKodu,
            dersAdi: getDersAdi(dersKodu),
            dogru: dersDogru,
            yanlis: dersYanlis,
            bos: Math.max(0, dersBos),
            net: parseFloat(dersNet.toFixed(2)),
            basariOrani: vals.total > 0 ? Math.round((dersDogru / vals.total) * 100) : 0
          });
        });
      }
      
      return {
        id: r.id,
        ogrenciNo: r.student_no || '',
        ogrenciAdi: r.student_name || 'Bilinmeyen',
        sinifNo: r.class_name || null,
        kitapcik: r.booklet || 'A',
        toplamDogru: r.total_correct || 0,
        toplamYanlis: r.total_wrong || 0,
        toplamBos: r.total_empty || 0,
        toplamNet: parseFloat(r.total_net) || 0,
        toplamPuan: parseFloat(r.total_score) || 0,
        siralama: r.general_rank || index + 1,
        sinifSira: r.class_rank || null,
        dersBazli
      };
    });
    
    // İstatistikleri hesapla
    const toplamOgrenci = ogrenciler.length;
    const toplamNet = ogrenciler.reduce((s: number, o: any) => s + o.toplamNet, 0);
    const ortalamaNet = toplamOgrenci > 0 ? toplamNet / toplamOgrenci : 0;
    
    return NextResponse.json({
      exam: {
        id: exam.id,
        ad: exam.name,
        tarih: exam.exam_date,
        tip: exam.exam_type || 'LGS',
        toplamSoru: exam.total_questions || 90,
        toplamOgrenci,
        ortalamaNet: parseFloat(ortalamaNet.toFixed(2)),
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

