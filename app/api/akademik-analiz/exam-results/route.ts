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
    const contract = (searchParams.get('contract') || '').toLowerCase(); // 'v1'
    
    // ✅ Bu endpoint sadece contract=v1 modunda çalışır (UI kırılmasın diye açıkça şart koşuyoruz)
    if (contract !== 'v1') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // ✅ Guard: examId yoksa 404 dön (sessiz fallback yasak)
    if (!examId) {
      return NextResponse.json({ error: 'examId gerekli' }, { status: 404 });
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
    const metaWarnings: string[] = [];
    const metaGuards: Array<{ level: 'INFO' | 'WARN' | 'ERROR'; area: string; message: string; detail?: any; at: string }> = [];
    const metaTables = new Set<string>(['exams']);

    // ============================================================
    // ✅ LEGACY DERS KIRILIMI ALGILAMA (PDF benzeri)
    // ============================================================
    // Eski tablolarda ders kırılımı JSON olarak değil, kolon olarak gelebilir.
    // Kolon adları kuruma göre değişebildiği için çok esnek arama yapıyoruz.
    const pickNumber = (obj: any, keys: string[]): number | null => {
      for (const k of keys) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== null && obj[k] !== undefined) {
          const n = Number(obj[k]);
          if (!Number.isNaN(n)) return n;
        }
      }
      return null;
    };

    const inferDersBazliFromRow = (row: any): any[] => {
      if (!row || typeof row !== 'object') return [];
      const out: any[] = [];

      const defs = [
        { code: 'TUR', name: getDersAdi('TUR'), synonyms: ['tur', 'turkce', 'turkçe'] },
        { code: 'INK', name: 'T.C. İnkılap', synonyms: ['ink', 'inkilap', 't.c', 'tc', 't.cinkilap', 'tcinkilap', 't.cinkılap'] },
        { code: 'DIN', name: getDersAdi('DIN'), synonyms: ['din', 'dinkulturu', 'dinkültürü'] },
        { code: 'ING', name: getDersAdi('ING'), synonyms: ['ing', 'ingilizce', 'yabanci', 'yabancidil', 'yabancı'] },
        { code: 'MAT', name: getDersAdi('MAT'), synonyms: ['mat', 'matematik'] },
        { code: 'FEN', name: getDersAdi('FEN'), synonyms: ['fen', 'fenbilimleri', 'fenbilgisi'] },
      ];

      for (const d of defs) {
        const nets: string[] = [];
        const dogru: string[] = [];
        const yanlis: string[] = [];
        const bos: string[] = [];

        for (const s of d.synonyms) {
          const base = s.replace(/[^a-z0-9]/gi, '').toLowerCase();
          // Net
          nets.push(`${base}_net`, `${base}net`, `${base}_n`, `${base}n`);
          // Doğru
          dogru.push(`${base}_dogru`, `${base}dogru`, `${base}_d`, `${base}d`, `${base}_correct`, `${base}correct`);
          // Yanlış
          yanlis.push(`${base}_yanlis`, `${base}yanlis`, `${base}_y`, `${base}y`, `${base}_wrong`, `${base}wrong`);
          // Boş
          bos.push(`${base}_bos`, `${base}bos`, `${base}_b`, `${base}b`, `${base}_empty`, `${base}empty`);
        }

        // Bazı dump’larda direkt kolon adı ders kodu ile olabilir
        nets.push(`${d.code.toLowerCase()}_net`, `${d.code.toLowerCase()}net`);
        dogru.push(`${d.code.toLowerCase()}_dogru`, `${d.code.toLowerCase()}dogru`);
        yanlis.push(`${d.code.toLowerCase()}_yanlis`, `${d.code.toLowerCase()}yanlis`);
        bos.push(`${d.code.toLowerCase()}_bos`, `${d.code.toLowerCase()}bos`);

        const net = pickNumber(row, nets);
        const c = pickNumber(row, dogru) ?? 0;
        const w = pickNumber(row, yanlis) ?? 0;
        const e = pickNumber(row, bos) ?? 0;

        // Eğer hiç veri yoksa ekleme
        if (net === null && c === 0 && w === 0 && e === 0) continue;

        // Net yoksa doğru/yanlış varsa hesapla
        const computedNet = net !== null ? net : (Number(c) - (Number(w) / wrongDiv));

        out.push({
          dersKodu: d.code,
          dersAdi: d.name,
          dogru: Number(c) || 0,
          yanlis: Number(w) || 0,
          bos: Number(e) || 0,
          net: Math.round(Number(computedNet) * 100) / 100,
          source: 'LEGACY_COLS',
        });
      }

      return out;
    };

    // 1) NEW: exam_student_results
    const { data: newResults, error: newErr } = await supabase
      .from('exam_student_results')
      .select(`*, student:students(*)`)
      .eq('exam_id', examId)
      .order('rank_in_exam', { ascending: true });

    if (newErr) {
      console.warn('[Exam Results API] exam_student_results okunamadı:', newErr);
      metaWarnings.push('exam_student_results okunamadı (fallback devreye girdi).');
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
    let resultSource: 'EXAM_STUDENT_RESULTS' | 'EXAM_STUDENT_ANALYTICS' | 'STUDENT_EXAM_RESULTS' | 'NONE' = 'NONE';

    if ((newResults || []).length > 0) {
      resultSource = 'EXAM_STUDENT_RESULTS';
      metaTables.add('exam_student_results');
      const studentIds = Array.from(new Set((newResults || []).map((r: any) => String(r.student_id || '')).filter(Boolean)));
      const guardiansByStudent = await buildGuardiansMap(studentIds);
      if (studentIds.length > 0) metaTables.add('guardians');

      // ✅ Enrichment: bazı sınavlarda exam_student_results.subject_results boş kalabiliyor.
      // Bu durumda exam_student_analytics tablosundan (varsa) ders kırılımını doldur.
      const hasAnySubjectResults =
        (newResults || []).some((r: any) => r?.subject_results && Object.keys(r.subject_results || {}).length > 0);

      let analyticsByStudentNo = new Map<string, any>();
      if (!hasAnySubjectResults) {
        metaWarnings.push('exam_student_results.subject_results boş → exam_student_analytics ile ders kırılımı zenginleştirildi.');
        metaTables.add('exam_student_analytics');
        const { data: aRows, error: aErr2 } = await supabase
          .from('exam_student_analytics')
          .select('student_no, subject_performance, subject_results')
          .eq('exam_id', examId);
        if (aErr2) {
          console.warn('[Exam Results API] enrichment için exam_student_analytics okunamadı:', aErr2);
          metaWarnings.push('exam_student_analytics okunamadı (ders kırılımı zenginleştirme başarısız olabilir).');
        } else {
          (aRows || []).forEach((r: any) => {
            const no = String(r.student_no || '').trim();
            if (no) analyticsByStudentNo.set(no, r);
          });
        }
      }

      ogrenciler = (newResults || []).map((r: any, index: number) => {
        const student = (r.student || {}) as any;
        const studentNoForEnrich = String(student.student_no || r.student_no || '').trim();
        const enrichRow = studentNoForEnrich ? analyticsByStudentNo.get(studentNoForEnrich) : null;
        const usedEnrichedSubject = !!(enrichRow && Object.keys((r.subject_results || {}) as any).length === 0);

        const subj =
          ((Object.keys((r.subject_results || {}) as any).length === 0 && enrichRow)
            ? (enrichRow.subject_performance || enrichRow.subject_results || {})
            : (r.subject_results || {})) as Record<string, any>;

        let dersBazli = Object.entries(subj).map(([dersKodu, v]) => ({
          dersKodu,
          dersAdi: getDersAdi(dersKodu),
          dogru: Number((v as any)?.correct ?? 0),
          yanlis: Number((v as any)?.wrong ?? 0),
          bos: Number((v as any)?.empty ?? 0),
          net: Number((v as any)?.net ?? 0),
          source: usedEnrichedSubject ? 'ANALYTICS' : 'SUBJECT_RESULTS',
        }));
        if (dersBazli.length === 0) {
          dersBazli = inferDersBazliFromRow(r);
        }

        const puanRaw = (r.scaled_score ?? r.raw_score ?? null) as number | null;
        const puan = puanRaw !== null ? Math.round(Number(puanRaw) * 100) / 100 : null;

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
        // Guardians yoksa students tablosundaki parent_name/parent_phone fallback
        const studentParentName = String(student.parent_name || '').trim();
        const studentParentPhone = String(student.parent_phone || '').trim();
        const fallbackVeli = !primaryGuardian && (studentParentName || studentParentPhone)
          ? {
              first_name: studentParentName.split(' ').slice(0, -1).join(' ') || studentParentName,
              last_name: studentParentName.split(' ').slice(-1).join('') || '',
              relation: 'parent',
              phone: studentParentPhone || null,
              phone2: null,
              email: null,
              guardian_type: 'primary',
            }
          : null;
        const mergedGuardians = fallbackVeli ? [fallbackVeli, ...guardians] : guardians;
        const effectivePrimary = primaryGuardian || fallbackVeli;

        return {
          id: r.id,
          studentId: sid,
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
          veli: effectivePrimary
            ? {
                adSoyad: `${String(effectivePrimary.first_name || '').trim()} ${String(effectivePrimary.last_name || '').trim()}`.trim() || studentParentName,
                yakinlik: effectivePrimary.relation || effectivePrimary.guardian_type || null,
                telefon: effectivePrimary.phone || studentParentPhone || null,
                telefon2: effectivePrimary.phone2 || null,
                email: effectivePrimary.email || null,
                source: primaryGuardian ? 'GUARDIANS_TABLE' : (fallbackVeli ? 'STUDENTS_PARENT_FIELDS' : 'UNKNOWN'),
              }
            : null,
          veliler: mergedGuardians.map(g => ({
            adSoyad: `${String(g.first_name || '').trim()} ${String(g.last_name || '').trim()}`.trim(),
            yakinlik: g.relation || g.guardian_type || null,
            telefon: g.phone || null,
            telefon2: g.phone2 || null,
            email: g.email || null,
            tip: g.guardian_type || null,
            source: (fallbackVeli && g === fallbackVeli) ? 'STUDENTS_PARENT_FIELDS' : 'GUARDIANS_TABLE',
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
        resultSource = 'EXAM_STUDENT_ANALYTICS';
        metaTables.add('exam_student_analytics');
        const studentNos = Array.from(new Set((analytics || []).map((r: any) => String(r.student_no || '')).filter(Boolean)));
        const studentByNo = await mapStudentNoToId(studentNos);
        const studentIds = Array.from(new Set(Array.from(studentByNo.values()).map((s: any) => String(s.id))));
        const guardiansByStudent = await buildGuardiansMap(studentIds);
        if (studentNos.length > 0) metaTables.add('students');
        if (studentIds.length > 0) metaTables.add('guardians');

        ogrenciler = (analytics || []).map((r: any, index: number) => {
          const subj = (r.subject_performance || r.subject_results || {}) as Record<string, any>;
          let dersBazli = Object.entries(subj).map(([dersKodu, v]) => ({
            dersKodu,
            dersAdi: getDersAdi(dersKodu),
            dogru: Number((v as any)?.correct ?? 0),
            yanlis: Number((v as any)?.wrong ?? 0),
            bos: Number((v as any)?.empty ?? 0),
            net: Number((v as any)?.net ?? 0),
            source: 'ANALYTICS',
          }));
          if (dersBazli.length === 0) {
            dersBazli = inferDersBazliFromRow(r);
          }

          const studentNo = String(r.student_no || '');
          const student = studentByNo.get(studentNo) || null;
          const sid = student?.id ? String(student.id) : '';
          const guardians = sid ? guardiansByStudent.get(sid) || [] : [];
          const primaryGuardian =
            guardians.find(g => g.guardian_type === 'primary' || g.guardian_type === 'legal') ||
            guardians[0] ||
            null;
          const studentParentName = String(student?.parent_name || '').trim();
          const studentParentPhone = String(student?.parent_phone || '').trim();
          const fallbackVeli = !primaryGuardian && (studentParentName || studentParentPhone)
            ? {
                first_name: studentParentName.split(' ').slice(0, -1).join(' ') || studentParentName,
                last_name: studentParentName.split(' ').slice(-1).join('') || '',
                relation: 'parent',
                phone: studentParentPhone || null,
                phone2: null,
                email: null,
                guardian_type: 'primary',
              }
            : null;
          const mergedGuardians = fallbackVeli ? [fallbackVeli, ...guardians] : guardians;
          const effectivePrimary = primaryGuardian || fallbackVeli;

          return {
            id: r.id,
            studentId: sid || null,
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
            veli: effectivePrimary
              ? {
                  adSoyad: `${String(effectivePrimary.first_name || '').trim()} ${String(effectivePrimary.last_name || '').trim()}`.trim() || studentParentName,
                  yakinlik: effectivePrimary.relation || effectivePrimary.guardian_type || null,
                  telefon: effectivePrimary.phone || studentParentPhone || null,
                  telefon2: effectivePrimary.phone2 || null,
                  email: effectivePrimary.email || null,
                  source: primaryGuardian ? 'GUARDIANS_TABLE' : (fallbackVeli ? 'STUDENTS_PARENT_FIELDS' : 'UNKNOWN'),
                }
              : null,
            veliler: mergedGuardians.map(g => ({
              adSoyad: `${String(g.first_name || '').trim()} ${String(g.last_name || '').trim()}`.trim(),
              yakinlik: g.relation || g.guardian_type || null,
              telefon: g.phone || null,
              telefon2: g.phone2 || null,
              email: g.email || null,
              tip: g.guardian_type || null,
              source: (fallbackVeli && g === fallbackVeli) ? 'STUDENTS_PARENT_FIELDS' : 'GUARDIANS_TABLE',
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
          metaWarnings.push('student_exam_results okunamadı (son fallback başarısız).');
        } else {
          resultSource = 'STUDENT_EXAM_RESULTS';
          metaTables.add('student_exam_results');
          const studentNos = Array.from(new Set((legacy || []).map((r: any) => String(r.student_no || '')).filter(Boolean)));
          const studentByNo = await mapStudentNoToId(studentNos);
          const studentIds = Array.from(new Set(Array.from(studentByNo.values()).map((s: any) => String(s.id))));
          const guardiansByStudent = await buildGuardiansMap(studentIds);
          if (studentNos.length > 0) metaTables.add('students');
          if (studentIds.length > 0) metaTables.add('guardians');

          ogrenciler = (legacy || []).map((r: any, index: number) => {
            const studentNo = String(r.student_no || '');
            const student = studentByNo.get(studentNo) || null;
            const sid = student?.id ? String(student.id) : '';
            const guardians = sid ? guardiansByStudent.get(sid) || [] : [];
            const primaryGuardian =
              guardians.find(g => g.guardian_type === 'primary' || g.guardian_type === 'legal') ||
              guardians[0] ||
              null;
            const studentParentName = String(student?.parent_name || '').trim();
            const studentParentPhone = String(student?.parent_phone || '').trim();
            const fallbackVeli = !primaryGuardian && (studentParentName || studentParentPhone)
              ? {
                  first_name: studentParentName.split(' ').slice(0, -1).join(' ') || studentParentName,
                  last_name: studentParentName.split(' ').slice(-1).join('') || '',
                  relation: 'parent',
                  phone: studentParentPhone || null,
                  phone2: null,
                  email: null,
                  guardian_type: 'primary',
                }
              : null;
            const mergedGuardians = fallbackVeli ? [fallbackVeli, ...guardians] : guardians;
            const effectivePrimary = primaryGuardian || fallbackVeli;

            return {
              id: r.id,
              studentId: sid || null,
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
              dersBazli: inferDersBazliFromRow(r), // legacy'de kolonlardan otomatik algıla
              percentile: null,
              veli: effectivePrimary
                ? {
                    adSoyad: `${String(effectivePrimary.first_name || '').trim()} ${String(effectivePrimary.last_name || '').trim()}`.trim() || studentParentName,
                    yakinlik: effectivePrimary.relation || effectivePrimary.guardian_type || null,
                    telefon: effectivePrimary.phone || studentParentPhone || null,
                    telefon2: effectivePrimary.phone2 || null,
                    email: effectivePrimary.email || null,
                    source: primaryGuardian ? 'GUARDIANS_TABLE' : (fallbackVeli ? 'STUDENTS_PARENT_FIELDS' : 'UNKNOWN'),
                  }
                : null,
              veliler: mergedGuardians.map(g => ({
                adSoyad: `${String(g.first_name || '').trim()} ${String(g.last_name || '').trim()}`.trim(),
                yakinlik: g.relation || g.guardian_type || null,
                telefon: g.phone || null,
                telefon2: g.phone2 || null,
                email: g.email || null,
                tip: g.guardian_type || null,
                source: (fallbackVeli && g === fallbackVeli) ? 'STUDENTS_PARENT_FIELDS' : 'GUARDIANS_TABLE',
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
      source: 'AGG_FROM_STUDENT_ROWS',
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
    
    const examPayload = {
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
      ogrenciler,
    };

    // ✅ Mega JSON Contract v1 (zorunlu alanlar: contract + meta.sources.tables + meta.warnings)
    const meta = {
      generatedAt: new Date().toISOString(),
      sources: {
        tables: Array.from(metaTables),
        note: `resultSource=${resultSource}`,
      },
      warnings: metaWarnings,
      guards: metaGuards,
    };

    return NextResponse.json({
      contract: {
        version: 'v1',
        exam: examPayload,
      },
      meta,
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

