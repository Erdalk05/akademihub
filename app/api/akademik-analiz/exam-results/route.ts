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
    // ✅ SONUÇ KAYNAĞI SEÇİMİ (FALLBACK'Lİ)
    // ============================================================
    // 1) exam_student_results (yeni)
    // 2) exam_student_analytics (varsa snapshot)
    // 3) student_exam_results (legacy)
    const toplamSoru = Number(exam.total_questions || 90);
    const wrongDiv = String(exam.exam_type || 'LGS').toUpperCase() === 'LGS' ? 3 : 4;

    // 1) NEW: exam_student_results
    const { data: newResults, error: newErr } = await supabase
      .from('exam_student_results')
      .select(`*, student:students(*)`)
      .eq('exam_id', examId)
      .order('rank_in_exam', { ascending: true });

    if (newErr) {
      console.warn('[Exam Results API] exam_student_results okunamadı:', newErr);
    }

    // Yardımcı: guardians map (student_id -> guardians[])
    const buildGuardiansMap = async (studentIds: string[]) => {
      const map = new Map<string, any[]>();
      if (studentIds.length === 0) return map;
      const { data: guardians, error: gErr } = await supabase
        .from('guardians')
        .select('student_id, first_name, last_name, relation, phone, phone2, email, guardian_type')
        .in('student_id', studentIds);
      if (gErr) {
        console.warn('[Exam Results API] guardians okunamadı:', gErr);
        return map;
      }
      (guardians || []).forEach((g: any) => {
        const sid = String(g.student_id);
        if (!map.has(sid)) map.set(sid, []);
        map.get(sid)!.push(g);
      });
      return map;
    };

    // Yardımcı: öğrenciNo -> students.id map (legacy sonuçlar için)
    const mapStudentNoToId = async (studentNos: string[]) => {
      const m = new Map<string, any>();
      if (studentNos.length === 0) return m;
      const { data: students, error: sErr } = await supabase
        .from('students')
        .select('*')
        .in('student_no', studentNos);
      if (sErr) {
        console.warn('[Exam Results API] students map okunamadı:', sErr);
        return m;
      }
      (students || []).forEach((s: any) => {
        m.set(String(s.student_no), s);
      });
      return m;
    };

    let ogrenciler: any[] = [];

    if ((newResults || []).length > 0) {
      const studentIds = Array.from(new Set((newResults || []).map((r: any) => String(r.student_id || '')).filter(Boolean)));
      const guardiansByStudent = await buildGuardiansMap(studentIds);

      ogrenciler = (newResults || []).map((r: any, index: number) => {
        const subj = (r.subject_results || {}) as Record<string, any>;
        const dersBazli = Object.entries(subj).map(([dersKodu, v]) => ({
          dersKodu,
          dersAdi: getDersAdi(dersKodu),
          dogru: Number((v as any)?.correct ?? 0),
          yanlis: Number((v as any)?.wrong ?? 0),
          bos: Number((v as any)?.empty ?? 0),
          net: Number((v as any)?.net ?? 0),
        }));

        const puanRaw = (r.scaled_score ?? r.raw_score ?? null) as number | null;
        const puan = puanRaw !== null ? Math.round(Number(puanRaw) * 100) / 100 : null;

        const student = (r.student || {}) as any;
        const fullName =
          String(student.full_name || '').trim() ||
          `${String(student.first_name || '').trim()} ${String(student.last_name || '').trim()}`.trim() ||
          String(r.student_name || '').trim() ||
          'Bilinmeyen';

        const sid = String(r.student_id || '');
        const guardians = guardiansByStudent.get(sid) || [];
        const primaryGuardian =
          guardians.find(g => g.guardian_type === 'primary' || g.guardian_type === 'legal') ||
          guardians[0] ||
          null;

        return {
          id: r.id,
          ogrenciNo: String(student.student_no || r.student_no || ''),
          ogrenciAdi: fullName,
          sinifNo: student.class_name || student.enrolled_class || student.class || r.class_name || null,
          kitapcik: 'A',
          toplamDogru: Number(r.total_correct || 0),
          toplamYanlis: Number(r.total_wrong || 0),
          toplamBos: Number(r.total_empty || 0),
          toplamNet: Number(r.total_net || 0),
          toplamPuan: puan,
          siralama: Number(r.rank_in_exam || index + 1),
          sinifSira: r.rank_in_class || null,
          dersBazli,
          percentile: r.percentile ?? null,
          veli: primaryGuardian
            ? {
                adSoyad: `${String(primaryGuardian.first_name || '').trim()} ${String(primaryGuardian.last_name || '').trim()}`.trim(),
                yakinlik: primaryGuardian.relation || primaryGuardian.guardian_type || null,
                telefon: primaryGuardian.phone || null,
                telefon2: primaryGuardian.phone2 || null,
                email: primaryGuardian.email || null,
              }
            : null,
          veliler: guardians.map(g => ({
            adSoyad: `${String(g.first_name || '').trim()} ${String(g.last_name || '').trim()}`.trim(),
            yakinlik: g.relation || g.guardian_type || null,
            telefon: g.phone || null,
            telefon2: g.phone2 || null,
            email: g.email || null,
            tip: g.guardian_type || null,
          })),
        };
      });
    } else {
      // 2) SNAPSHOT: exam_student_analytics
      const { data: analytics, error: aErr } = await supabase
        .from('exam_student_analytics')
        .select('*')
        .eq('exam_id', examId)
        .order('rank_in_exam', { ascending: true });

      if (!aErr && (analytics || []).length > 0) {
        const studentNos = Array.from(new Set((analytics || []).map((r: any) => String(r.student_no || '')).filter(Boolean)));
        const studentByNo = await mapStudentNoToId(studentNos);
        const studentIds = Array.from(new Set(Array.from(studentByNo.values()).map((s: any) => String(s.id))));
        const guardiansByStudent = await buildGuardiansMap(studentIds);

        ogrenciler = (analytics || []).map((r: any, index: number) => {
          const subj = (r.subject_performance || r.subject_results || {}) as Record<string, any>;
          const dersBazli = Object.entries(subj).map(([dersKodu, v]) => ({
            dersKodu,
            dersAdi: getDersAdi(dersKodu),
            dogru: Number((v as any)?.correct ?? 0),
            yanlis: Number((v as any)?.wrong ?? 0),
            bos: Number((v as any)?.empty ?? 0),
            net: Number((v as any)?.net ?? 0),
          }));

          const studentNo = String(r.student_no || '');
          const student = studentByNo.get(studentNo) || null;
          const sid = student?.id ? String(student.id) : '';
          const guardians = sid ? guardiansByStudent.get(sid) || [] : [];
          const primaryGuardian =
            guardians.find(g => g.guardian_type === 'primary' || g.guardian_type === 'legal') ||
            guardians[0] ||
            null;

          return {
            id: r.id,
            ogrenciNo: studentNo,
            ogrenciAdi: String(r.student_name || student?.full_name || '').trim() || 'Bilinmeyen',
            sinifNo: String(r.class_name || student?.class_name || student?.enrolled_class || ''),
            kitapcik: 'A',
            toplamDogru: Number(r.total_correct || 0),
            toplamYanlis: Number(r.total_wrong || 0),
            toplamBos: Number(r.total_empty || 0),
            toplamNet: Number(r.total_net || 0),
            toplamPuan: null,
            siralama: Number(r.rank_in_exam || index + 1),
            sinifSira: r.rank_in_class || null,
            dersBazli,
            percentile: r.percentile ?? null,
            veli: primaryGuardian
              ? {
                  adSoyad: `${String(primaryGuardian.first_name || '').trim()} ${String(primaryGuardian.last_name || '').trim()}`.trim(),
                  yakinlik: primaryGuardian.relation || primaryGuardian.guardian_type || null,
                  telefon: primaryGuardian.phone || null,
                  telefon2: primaryGuardian.phone2 || null,
                  email: primaryGuardian.email || null,
                }
              : null,
            veliler: guardians.map(g => ({
              adSoyad: `${String(g.first_name || '').trim()} ${String(g.last_name || '').trim()}`.trim(),
              yakinlik: g.relation || g.guardian_type || null,
              telefon: g.phone || null,
              telefon2: g.phone2 || null,
              email: g.email || null,
              tip: g.guardian_type || null,
            })),
          };
        });
      } else {
        // 3) LEGACY: student_exam_results (tablo varsa)
        const { data: legacy, error: lErr } = await supabase
          .from('student_exam_results')
          .select('*')
          .eq('exam_id', examId)
          .order('general_rank', { ascending: true });

        if (lErr) {
          console.warn('[Exam Results API] student_exam_results okunamadı:', lErr);
        } else {
          const studentNos = Array.from(new Set((legacy || []).map((r: any) => String(r.student_no || '')).filter(Boolean)));
          const studentByNo = await mapStudentNoToId(studentNos);
          const studentIds = Array.from(new Set(Array.from(studentByNo.values()).map((s: any) => String(s.id))));
          const guardiansByStudent = await buildGuardiansMap(studentIds);

          ogrenciler = (legacy || []).map((r: any, index: number) => {
            const studentNo = String(r.student_no || '');
            const student = studentByNo.get(studentNo) || null;
            const sid = student?.id ? String(student.id) : '';
            const guardians = sid ? guardiansByStudent.get(sid) || [] : [];
            const primaryGuardian =
              guardians.find(g => g.guardian_type === 'primary' || g.guardian_type === 'legal') ||
              guardians[0] ||
              null;

            return {
              id: r.id,
              ogrenciNo: studentNo,
              ogrenciAdi: String(r.student_name || student?.full_name || '').trim() || 'Bilinmeyen',
              sinifNo: String(r.class_name || student?.class_name || student?.enrolled_class || ''),
              kitapcik: String(r.booklet || 'A'),
              toplamDogru: Number(r.total_correct || 0),
              toplamYanlis: Number(r.total_wrong || 0),
              toplamBos: Number(r.total_empty || 0),
              toplamNet: Number(r.total_net || 0),
              toplamPuan: typeof r.total_score === 'number' ? r.total_score : (r.total_score ? Number(r.total_score) : null),
              siralama: Number(r.general_rank || index + 1),
              sinifSira: r.class_rank || null,
              dersBazli: [], // legacy'de ders kırılımı yoksa boş gelir
              percentile: null,
              veli: primaryGuardian
                ? {
                    adSoyad: `${String(primaryGuardian.first_name || '').trim()} ${String(primaryGuardian.last_name || '').trim()}`.trim(),
                    yakinlik: primaryGuardian.relation || primaryGuardian.guardian_type || null,
                    telefon: primaryGuardian.phone || null,
                    telefon2: primaryGuardian.phone2 || null,
                    email: primaryGuardian.email || null,
                  }
                : null,
              veliler: guardians.map(g => ({
                adSoyad: `${String(g.first_name || '').trim()} ${String(g.last_name || '').trim()}`.trim(),
                yakinlik: g.relation || g.guardian_type || null,
                telefon: g.phone || null,
                telefon2: g.phone2 || null,
                email: g.email || null,
                tip: g.guardian_type || null,
              })),
            };
          });
        }
      }
    }

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

