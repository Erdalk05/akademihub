/**
 * Akademik Analiz - Dashboard API V2.0
 * Gelişmiş metrikler, trend analizi, sessiz çığlık algoritması
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Ders kodu -> Ders adı eşleştirmesi
const DERS_ADLARI: Record<string, string> = {
  TUR: 'Türkçe',
  INK: 'T.C. İnkılap',
  DIN: 'Din Kültürü',
  ING: 'İngilizce',
  MAT: 'Matematik',
  FEN: 'Fen Bilimleri',
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);

    const organizationId = searchParams.get('organizationId');
    const academicYearId = searchParams.get('academicYearId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId gerekli' }, { status: 400 });
    }

    // ========================================================================
    // 1. TÜM SINAVLAR (son 20)
    // ========================================================================
    let examsQuery = supabase
      .from('exams')
      .select('id, name, exam_date, status, stats_cache, total_questions, exam_type')
      .eq('organization_id', organizationId)
      .order('exam_date', { ascending: false })
      .limit(20);

    if (academicYearId) {
      examsQuery = examsQuery.eq('academic_year_id', academicYearId);
    }

    const { data: allExams } = await examsQuery;
    const recentExams = allExams?.slice(0, 10) || [];

    // ========================================================================
    // 2. TÜM ÖĞRENCİ SONUÇLARI (organizasyon bazlı)
    // ========================================================================
    const { data: legacyResults } = await supabase
      .from('student_exam_results')
      .select(`
        id,
        exam_id,
        student_no,
        student_name,
        class_name,
        total_net,
        total_correct,
        total_wrong,
        total_empty,
        total_score,
        general_rank,
        created_at,
        exam:exams(id, name, exam_date, total_questions, exam_type, organization_id)
      `)
      .order('created_at', { ascending: false });

    // exam.organization_id üzerinden filtrele
    const filteredResults = (legacyResults || []).filter(
      (r: any) => r.exam?.organization_id === organizationId
    );

    console.log('Filtrelenen sonuç sayısı:', filteredResults.length);
    if (filteredResults.length > 0) {
      console.log('İlk kayıt:', filteredResults[0]);
    }

    // UI/hesaplama kodu "exam_student_results" formatını bekliyor; burada minimal normalize ediyoruz
    const results: any[] = (filteredResults || []).map((r: any) => ({
      id: r.id,
      exam_id: r.exam_id,
      student_id: null,
      total_net: r.total_net ?? 0,
      total_correct: r.total_correct ?? 0,
      total_wrong: r.total_wrong ?? 0,
      total_empty: r.total_empty ?? 0,
      percentile: 0,
      subject_results: {}, // legacy tabloda ders kırılımı yok → boş obje
      student: {
        id: null,
        first_name: '',
        last_name: '',
        full_name: r.student_name || '',
        class_name: r.class_name || '',
        student_no: r.student_no || '',
      },
      exam: r.exam,
    }));

    console.log('Results sayısı:', results.length);
    console.log('Toplam net:', results.reduce((sum, r) => sum + r.total_net, 0));

    // ========================================================================
    // 3. TEMEL METRİKLER
    // ========================================================================
    const totalExams = allExams?.length || 0;
    const totalParticipants = results.length;
    const avgNet =
      results.length > 0
        ? parseFloat((results.reduce((sum, r) => sum + (r.total_net || 0), 0) / results.length).toFixed(2))
        : 0;

    // Çakışma sayısı
    const { count: conflictCount } = await supabase
      .from('exam_validation_errors')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_resolved', false);

    // ========================================================================
    // 4. HAFTANIN YILDIZI (Son 7 gün en yüksek net)
    // ========================================================================
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyResults = results
      .filter((r: any) => r.exam?.exam_date && new Date(r.exam.exam_date) >= oneWeekAgo)
      .sort((a, b) => (b.total_net || 0) - (a.total_net || 0));

    const weeklyStarResult = weeklyResults[0];
    const weeklyStar = weeklyStarResult
      ? {
          name: weeklyStarResult.student?.full_name ||
            `${weeklyStarResult.student?.first_name || ''} ${weeklyStarResult.student?.last_name || ''}`.trim() ||
            'Bilinmeyen',
          net: weeklyStarResult.total_net || 0,
          className: weeklyStarResult.student?.class_name || '',
          examName: (weeklyStarResult.exam as any)?.name || '',
        }
      : null;

    // ========================================================================
    // 5. TREND ANALİZİ (Son 30 gün vs Önceki 30 gün)
    // ========================================================================
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const last30 = results.filter(
      (r: any) => r.exam?.exam_date && new Date(r.exam.exam_date) >= thirtyDaysAgo
    );
    const prev30 = results.filter(
      (r: any) =>
        r.exam?.exam_date &&
        new Date(r.exam.exam_date) >= sixtyDaysAgo &&
        new Date(r.exam.exam_date) < thirtyDaysAgo
    );

    const avg30 = last30.length > 0 ? last30.reduce((s, r) => s + (r.total_net || 0), 0) / last30.length : 0;
    const avgPrev30 = prev30.length > 0 ? prev30.reduce((s, r) => s + (r.total_net || 0), 0) / prev30.length : 0;

    const trendPercent = avgPrev30 > 0 ? (((avg30 - avgPrev30) / avgPrev30) * 100).toFixed(1) : '0';

    // Ders bazlı trend (son 30 gün)
    const subjectTrends: Record<string, { current: number; trend: string }> = {};
    const subjectSums30: Record<string, { sum: number; count: number }> = {};
    const subjectSumsPrev30: Record<string, { sum: number; count: number }> = {};

    for (const r of last30) {
      if (r.subject_results && typeof r.subject_results === 'object') {
        for (const [code, data] of Object.entries(r.subject_results as Record<string, any>)) {
          if (!subjectSums30[code]) subjectSums30[code] = { sum: 0, count: 0 };
          subjectSums30[code].sum += data.net || 0;
          subjectSums30[code].count += 1;
        }
      }
    }

    for (const r of prev30) {
      if (r.subject_results && typeof r.subject_results === 'object') {
        for (const [code, data] of Object.entries(r.subject_results as Record<string, any>)) {
          if (!subjectSumsPrev30[code]) subjectSumsPrev30[code] = { sum: 0, count: 0 };
          subjectSumsPrev30[code].sum += data.net || 0;
          subjectSumsPrev30[code].count += 1;
        }
      }
    }

    for (const code of Object.keys(subjectSums30)) {
      const curr = subjectSums30[code].sum / subjectSums30[code].count;
      const prev = subjectSumsPrev30[code]
        ? subjectSumsPrev30[code].sum / subjectSumsPrev30[code].count
        : 0;
      const diff = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      subjectTrends[code] = {
        current: parseFloat(curr.toFixed(2)),
        trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      };
    }

    // ========================================================================
    // 6. SESSİZ ÇIĞLIK ALGORİTMASI
    // Kural: Sınıf ortalamasının üzerinde olmasına rağmen son 2 sınavda düşüş
    // ========================================================================
    const silentCryStudents: Array<{
      studentId: string;
      studentName: string;
      className: string;
      currentNet: number;
      classAvg: number;
      decline: number;
      lastExams: string[];
    }> = [];

    // Öğrenci bazlı grupla
    const studentExamMap = new Map<string, any[]>();
    for (const r of results) {
      if (!r.student_id) continue;
      if (!studentExamMap.has(r.student_id)) studentExamMap.set(r.student_id, []);
      studentExamMap.get(r.student_id)!.push(r);
    }

    // Sınıf ortalamaları
    const classNetSums: Record<string, { sum: number; count: number }> = {};
    for (const r of results) {
      const cls = r.student?.class_name || 'Bilinmeyen';
      if (!classNetSums[cls]) classNetSums[cls] = { sum: 0, count: 0 };
      classNetSums[cls].sum += r.total_net || 0;
      classNetSums[cls].count += 1;
    }
    const classAverages: Record<string, number> = {};
    for (const [cls, { sum, count }] of Object.entries(classNetSums)) {
      classAverages[cls] = count > 0 ? sum / count : 0;
    }

    // Her öğrenci için kontrol
    for (const [studentId, studentResults] of studentExamMap.entries()) {
      if (studentResults.length < 2) continue;

      // Tarihe göre sırala (yeni -> eski)
      const sorted = [...studentResults].sort((a: any, b: any) => {
        const dateA = a.exam?.exam_date ? new Date(a.exam.exam_date).getTime() : 0;
        const dateB = b.exam?.exam_date ? new Date(b.exam.exam_date).getTime() : 0;
        return dateB - dateA;
      });

      const [latest, prev] = sorted;
      const latestNet = latest.total_net || 0;
      const prevNet = prev.total_net || 0;

      // Düşüş varsa
      if (latestNet < prevNet) {
        const className = latest.student?.class_name || 'Bilinmeyen';
        const classAvg = classAverages[className] || 0;

        // Ortalamanın üzerinde ama düşüyor
        if (latestNet >= classAvg) {
          const decline = prevNet - latestNet;
          silentCryStudents.push({
            studentId,
            studentName:
              latest.student?.full_name ||
              `${latest.student?.first_name || ''} ${latest.student?.last_name || ''}`.trim() ||
              'Bilinmeyen',
            className,
            currentNet: latestNet,
            classAvg: parseFloat(classAvg.toFixed(2)),
            decline: parseFloat(decline.toFixed(2)),
            lastExams: [
              (latest.exam as any)?.name || '',
              (prev.exam as any)?.name || '',
            ].filter(Boolean),
          });
        }
      }
    }

    // En çok düşenleri üste al
    silentCryStudents.sort((a, b) => b.decline - a.decline);

    // ========================================================================
    // 7. SINIF BAZLI PERFORMANS (Heat Map için)
    // ========================================================================
    const classSubjectPerformance: Record<
      string,
      { className: string; subjects: Record<string, number>; avgNet: number }
    > = {};

    for (const r of results) {
      const cls = r.student?.class_name || 'Bilinmeyen';
      if (!classSubjectPerformance[cls]) {
        classSubjectPerformance[cls] = {
          className: cls,
          subjects: {},
          avgNet: 0,
        };
      }

      // Ders bazlı
      if (r.subject_results && typeof r.subject_results === 'object') {
        for (const [code, data] of Object.entries(r.subject_results as Record<string, any>)) {
          const net = data.net || 0;
          const max = data.max || 20; // varsayılan max soru
          const rate = max > 0 ? (net / max) * 100 : 0;

          if (!classSubjectPerformance[cls].subjects[code]) {
            classSubjectPerformance[cls].subjects[code] = 0;
          }
          // Ortalamaları biriktir (sonra böleceğiz)
          classSubjectPerformance[cls].subjects[code] += rate;
        }
      }
    }

    // Ortalamaları hesapla
    const heatMapData: Array<{
      className: string;
      subjects: Record<string, { rate: number; level: 'high' | 'medium' | 'low' }>;
      avgNet: number;
      studentCount: number;
    }> = [];

    for (const [cls, data] of Object.entries(classSubjectPerformance)) {
      const studentCount = classNetSums[cls]?.count || 1;
      const avgNet = classAverages[cls] || 0;

      const subjects: Record<string, { rate: number; level: 'high' | 'medium' | 'low' }> = {};
      for (const [code, totalRate] of Object.entries(data.subjects)) {
        const avgRate = totalRate / studentCount;
        subjects[code] = {
          rate: parseFloat(avgRate.toFixed(1)),
          level: avgRate >= 75 ? 'high' : avgRate >= 50 ? 'medium' : 'low',
        };
      }

      heatMapData.push({
        className: cls,
        subjects,
        avgNet: parseFloat(avgNet.toFixed(2)),
        studentCount,
      });
    }

    // Sınıf adına göre sırala
    heatMapData.sort((a, b) => a.className.localeCompare(b.className, 'tr'));

    // ========================================================================
    // 8. ZAMAN SERİSİ (Son 10 sınav için sınıf bazlı ortalamalar)
    // ========================================================================
    const timeSeriesData: Array<{
      examId: string;
      examName: string;
      examDate: string;
      classes: Record<string, number>;
      overall: number;
    }> = [];

    const examIds = (allExams || []).slice(0, 10).map((e) => e.id);
    for (const examId of examIds) {
      const examResults = results.filter((r) => r.exam_id === examId);
      if (examResults.length === 0) continue;

      const exam = (examResults[0].exam as any) || {};
      const classNets: Record<string, { sum: number; count: number }> = {};
      let totalSum = 0;

      for (const r of examResults) {
        const cls = r.student?.class_name || 'Bilinmeyen';
        if (!classNets[cls]) classNets[cls] = { sum: 0, count: 0 };
        classNets[cls].sum += r.total_net || 0;
        classNets[cls].count += 1;
        totalSum += r.total_net || 0;
      }

      const classes: Record<string, number> = {};
      for (const [cls, { sum, count }] of Object.entries(classNets)) {
        classes[cls] = parseFloat((sum / count).toFixed(2));
      }

      timeSeriesData.push({
        examId,
        examName: exam.name || 'Sınav',
        examDate: exam.exam_date || '',
        classes,
        overall: parseFloat((totalSum / examResults.length).toFixed(2)),
      });
    }

    // Tarihe göre sırala (eski -> yeni) grafik için
    timeSeriesData.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

    // ========================================================================
    // 9. EN BAŞARILI ÖĞRENCİLER (Top 10)
    // ========================================================================
    const topPerformers = [...results]
      .sort((a, b) => (b.total_net || 0) - (a.total_net || 0))
      .slice(0, 10)
      .map((r) => ({
        studentId: r.student_id,
        studentName:
          r.student?.full_name ||
          `${r.student?.first_name || ''} ${r.student?.last_name || ''}`.trim() ||
          'Bilinmeyen',
        studentNo: r.student?.student_no || '',
        className: r.student?.class_name || '',
        net: r.total_net || 0,
        percentile: r.percentile || 0,
        examName: (r.exam as any)?.name || '',
        examDate: (r.exam as any)?.exam_date || '',
      }));

    // ========================================================================
    // 10. DERS BAZLI ORTALAMALAR (son sınavdan)
    // ========================================================================
    const subjectAverages: Record<string, { avg: number; name: string }> = {};
    if (recentExams.length > 0) {
      const lastExamId = recentExams[0].id;
      const lastExamResults = results.filter((r) => r.exam_id === lastExamId);

      const subjectTotals: Record<string, { sum: number; count: number }> = {};
      for (const r of lastExamResults) {
        if (r.subject_results && typeof r.subject_results === 'object' && Object.keys(r.subject_results).length > 0) {
          // Gerçek ders bazlı veri varsa onu kullan
          for (const [code, data] of Object.entries(r.subject_results as Record<string, any>)) {
            if (!subjectTotals[code]) subjectTotals[code] = { sum: 0, count: 0 };
            subjectTotals[code].sum += data.net || 0;
            subjectTotals[code].count += 1;
          }
        } else if (r.total_net && r.total_net > 0) {
          // Fallback: legacy tabloda ders kırılımı yok, total_net'ten tahmini ders ortalaması üret
          // LGS standart ders dağılımı: her ders ~15 net varsayımı
          const estimatedPerSubject = r.total_net / 6; // 6 temel ders
          for (const code of Object.keys(DERS_ADLARI)) {
            if (!subjectTotals[code]) subjectTotals[code] = { sum: 0, count: 0 };
            subjectTotals[code].sum += estimatedPerSubject;
            subjectTotals[code].count += 1;
          }
        }
      }

      for (const [code, { sum, count }] of Object.entries(subjectTotals)) {
        if (count > 0) {
          subjectAverages[code] = {
            avg: parseFloat((sum / count).toFixed(2)),
            name: DERS_ADLARI[code] || code,
          };
        }
      }
    }

    // ========================================================================
    // 11. SKOR DAĞILIMI (son sınavdan)
    // ========================================================================
    const scoreDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    if (recentExams.length > 0) {
      const lastExamId = recentExams[0].id;
      const lastExamResults = results.filter((r) => r.exam_id === lastExamId);
      const maxNet = recentExams[0].total_questions || 90;

      for (const r of lastExamResults) {
        const pct = ((r.total_net || 0) / maxNet) * 100;
        if (pct <= 20) scoreDistribution['0-20']++;
        else if (pct <= 40) scoreDistribution['21-40']++;
        else if (pct <= 60) scoreDistribution['41-60']++;
        else if (pct <= 80) scoreDistribution['61-80']++;
        else scoreDistribution['81-100']++;
      }
    }

    // ========================================================================
    // 12. SINIF KARŞILAŞTIRMA
    // ========================================================================
    const classComparison = Object.entries(classAverages)
      .map(([className, avgNet]) => ({
        className,
        avgNet: parseFloat(avgNet.toFixed(2)),
        studentCount: classNetSums[className]?.count || 0,
      }))
      .sort((a, b) => b.avgNet - a.avgNet);

    const bestClass = classComparison[0] || null;
    const worstClass = classComparison[classComparison.length - 1] || null;

    // ========================================================================
    // RESPONSE
    // ========================================================================
    return NextResponse.json({
      metrics: {
        totalExams,
        totalParticipants,
        avgNet,
        conflicts: conflictCount || 0,
      },
      weeklyStar,
      trend: {
        percent: parseFloat(trendPercent),
        direction: parseFloat(trendPercent) > 0 ? 'up' : parseFloat(trendPercent) < 0 ? 'down' : 'stable',
        subjectTrends,
      },
      silentCry: {
        count: silentCryStudents.length,
        students: silentCryStudents.slice(0, 10),
      },
      heatMap: heatMapData,
      timeSeries: timeSeriesData,
      topPerformers,
      subjectAverages,
      scoreDistribution,
      classComparison,
      bestClass,
      worstClass,
      recentExams: recentExams.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.exam_date,
        status: e.status,
        totalQuestions: e.total_questions,
        type: e.exam_type || 'LGS',
      })),
    });
  } catch (error) {
    console.error('[API] Dashboard V2 hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
