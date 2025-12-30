/**
 * Akademik Analiz - Öğrenci Profili API
 * Longitudinal progress tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    
    const studentId = searchParams.get('studentId');
    const studentNo = searchParams.get('studentNo');
    const academicYearId = searchParams.get('academicYearId');
    const organizationId = searchParams.get('organizationId');
    
    // 🔴 GUARD: öğrenci eşleştirme (sessiz varsayım yasak)
    // studentId veya studentNo olmadan işlem yapmayız.
    if (!studentId && !studentNo) {
      return NextResponse.json({ error: 'studentId veya studentNo gerekli' }, { status: 400 });
    }
    
    // 1. Öğrenci bilgileri
    let student: any = null;

    if (studentId) {
      const { data } = await supabase
        .from('students')
        // ✅ Guard: DB şemasında olmayan kolonlara dokunma (student_number yok).
        .select('id, student_no, first_name, last_name, full_name, tc_no, photo_url, organization_id')
        .eq('id', studentId)
        .single();
      student = data || null;
    } else {
      let q = supabase
        .from('students')
        .select('id, student_no, first_name, last_name, full_name, tc_no, photo_url, organization_id')
        .eq('student_no', String(studentNo || '').trim());

      if (organizationId) {
        q = q.eq('organization_id', organizationId);
      }

      const { data, error } = await q;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 });
      }
      if (data.length > 1) {
        // 🔴 GUARD: birden fazla eşleşme varsa fallback yok, DUR
        return NextResponse.json(
          {
            error: 'Öğrenci eşleştirme belirsiz (aynı öğrenci numarası birden fazla kayıtta var). studentId ile tekrar deneyin.',
            matches: data.map((s: any) => ({ id: s.id, student_no: s.student_no, organization_id: s.organization_id })),
          },
          { status: 409 },
        );
      }
      student = data[0];
    }
    
    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 });
    }
    
    // 2. Tüm sınav sonuçları (gelişim trendi için)
    let resultsQuery = supabase
      .from('exam_student_results')
      .select(`
        id,
        total_correct,
        total_wrong,
        total_empty,
        total_net,
        raw_score,
        scaled_score,
        rank_in_exam,
        rank_in_class,
        percentile,
        subject_results,
        topic_results,
        ai_analysis,
        calculated_at,
        exam:exams(id, name, exam_date, total_questions, stats_cache, exam_type:exam_types(code, name))
      `)
      .eq('student_id', String(student.id))
      .order('calculated_at', { ascending: true });
    
    if (organizationId) {
      resultsQuery = resultsQuery.eq('organization_id', organizationId);
    }
    
    const { data: examResults } = await resultsQuery;
    
    // 3. Ders bazlı ortalamalar hesapla
    const subjectAverages: Record<string, { 
      totalNet: number; 
      count: number; 
      avgNet: number;
      trend: number;
    }> = {};
    
    if (examResults) {
      examResults.forEach(r => {
        if (r.subject_results && typeof r.subject_results === 'object') {
          Object.entries(r.subject_results).forEach(([subj, data]: [string, any]) => {
            if (!subjectAverages[subj]) {
              subjectAverages[subj] = { totalNet: 0, count: 0, avgNet: 0, trend: 0 };
            }
            subjectAverages[subj].totalNet += data.net || 0;
            subjectAverages[subj].count += 1;
          });
        }
      });
      
      Object.keys(subjectAverages).forEach(subj => {
        subjectAverages[subj].avgNet = 
          subjectAverages[subj].totalNet / subjectAverages[subj].count;
      });
    }
    
    // 4. Zayıf konular (son 3 sınavda %50 altı)
    const weakTopics: { topicId: string; topicName: string; successRate: number }[] = [];
    const recentResults = (examResults || []).slice(-3);
    
    const topicPerformance: Record<string, { correct: number; total: number }> = {};
    
    recentResults.forEach(r => {
      if (r.topic_results && typeof r.topic_results === 'object') {
        Object.entries(r.topic_results).forEach(([topicId, data]: [string, any]) => {
          if (!topicPerformance[topicId]) {
            topicPerformance[topicId] = { correct: 0, total: 0 };
          }
          topicPerformance[topicId].correct += data.correct || 0;
          topicPerformance[topicId].total += data.total || 0;
        });
      }
    });
    
    Object.entries(topicPerformance).forEach(([topicId, { correct, total }]) => {
      if (total > 0) {
        const rate = correct / total;
        if (rate < 0.5) {
          weakTopics.push({
            topicId,
            topicName: topicId, // Gerçek isim için topic tablosundan çekilebilir
            successRate: parseFloat((rate * 100).toFixed(1))
          });
        }
      }
    });
    
    // 5. Gelişim trendi
    const trendData = (examResults || []).map((r: any) => {
      const exam = Array.isArray(r.exam) ? r.exam[0] : r.exam;
      return {
        examId: exam?.id,
        examName: exam?.name,
        examDate: exam?.exam_date,
      totalNet: r.total_net,
      percentile: r.percentile,
      rank: r.rank_in_exam
      };
    });
    
    // 6. Genel istatistikler
    const stats = {
      totalExams: examResults?.length || 0,
      avgNet: examResults && examResults.length > 0
        ? (examResults.reduce((sum, r) => sum + (r.total_net || 0), 0) / examResults.length).toFixed(2)
        : '0',
      avgPercentile: examResults && examResults.length > 0
        ? (examResults.reduce((sum, r) => sum + (r.percentile || 0), 0) / examResults.length).toFixed(1)
        : '0',
      bestRank: examResults && examResults.length > 0
        ? Math.min(...examResults.map(r => r.rank_in_exam || 999))
        : null
    };

    // 7) UI için hazır profil (ogrenci-karne sayfası)
    const displayName =
      String(student.full_name || '').trim() ||
      `${String(student.first_name || '').trim()} ${String(student.last_name || '').trim()}`.trim() ||
      'Bilinmeyen';

    const dersAdi = (kod: string) => {
      const k = String(kod || '').toUpperCase();
      const map: Record<string, string> = {
        TUR: 'Türkçe',
        INK: 'T.C. İnkılap',
        SOS: 'T.C. İnkılap',
        DIN: 'Din Kültürü',
        ING: 'İngilizce',
        MAT: 'Matematik',
        FEN: 'Fen Bilimleri',
      };
      return map[k] || k;
    };

    const sinavlar = (examResults || []).map((r: any) => {
      const subj = (r.subject_results || {}) as Record<string, any>;
      const dersler = Object.entries(subj).map(([dersKodu, v]: [string, any]) => {
        const dogru = Number(v?.correct ?? 0);
        const yanlis = Number(v?.wrong ?? 0);
        const bos = Number(v?.empty ?? 0);
        const soruSayisi = Math.max(0, dogru + yanlis + bos);
        const net = Number(v?.net ?? 0);
        const basariOrani = soruSayisi > 0 ? Math.round((dogru / soruSayisi) * 100) : 0;
        return {
          dersKodu: String(dersKodu).toUpperCase(),
          dersAdi: dersAdi(dersKodu),
          soruSayisi,
          dogru,
          yanlis,
          bos,
          net,
          basariOrani,
        };
      });

      const exam = Array.isArray(r.exam) ? (r.exam[0] || {}) : (r.exam || {});
      const examTypeObj = Array.isArray(exam?.exam_type) ? (exam.exam_type[0] || {}) : (exam?.exam_type || {});
      const examTypeCode = String(examTypeObj?.code || examTypeObj?.name || exam?.exam_type || 'LGS');
      const totalStudents = Number(exam?.stats_cache?.totalStudents || 0);
      const puan = (r.scaled_score ?? r.raw_score ?? null);

      return {
        id: String(exam.id || r.id),
        sinavAdi: String(exam.name || 'Sınav'),
        tarih: String(exam.exam_date || r.calculated_at || ''),
        tip: examTypeCode,
        toplamDogru: Number(r.total_correct || 0),
        toplamYanlis: Number(r.total_wrong || 0),
        toplamBos: Number(r.total_empty || 0),
        toplamNet: Number(r.total_net || 0),
        toplamPuan: typeof puan === 'number' ? puan : (puan ? Number(puan) : 0),
        sira: Number(r.rank_in_exam || 0),
        toplamOgrenci: totalStudents,
        dersler,
      };
    });

    const profil = {
      ogrenciNo: String(student.student_no || ''),
      ogrenciAdi: displayName,
      sinif: '',
      okul: '',
      sinavlar,
      photo_url: student.photo_url || null,
    };
    
    return NextResponse.json({
      student,
      examHistory: examResults || [],
      subjectAverages,
      weakTopics: weakTopics.sort((a, b) => a.successRate - b.successRate).slice(0, 5),
      trendData,
      stats,
      profil,
    });
    
  } catch (error) {
    console.error('[API] Öğrenci profili hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

