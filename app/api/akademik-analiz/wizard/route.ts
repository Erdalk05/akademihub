/**
 * Akademik Analiz - Sınav Sihirbazı API
 * Sınav + Testler + Cevap Anahtarları + Öğrenci Sonuçları kaydetme
 * 
 * Yeni esnek mimari desteği:
 * - exam_tests tablosuna test kayıtları
 * - booklet_answer_keys tablosuna kitapçık cevapları
 * - student_exam_results ve student_test_results tablolarına sonuçlar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface WizardPayload {
  sinavBilgisi: {
    ad: string;
    tarih: string;
    tip: string;
    sinifSeviyesi?: string;
    toplamSoru?: number;
    yanlisKatsayisi?: number;
    tekDers?: boolean;
    seciliDers?: string;
    kitapcikTurleri?: string[];
    aciklama?: string;
  };
  cevapAnahtari: {
    soruNo: number;
    dogruCevap: string;
    dersKodu: string;
    dersAdi?: string;
    kitapcikSoruNo?: { A?: number; B?: number; C?: number; D?: number };
    kazanimKodu?: string;
    kazanimMetni?: string;
  }[];
  ogrenciSonuclari: {
    ogrenciNo: string;
    ogrenciAdi: string;
    sinifNo?: string;
    kitapcik?: string;
    toplamDogru: number;
    toplamYanlis: number;
    toplamBos: number;
    toplamNet: number;
    toplamPuan?: number;
    siralama?: number;
    sinifSira?: number;
    testSonuclari?: {
      testAdi: string;
      dersKodu: string;
      dogru: number;
      yanlis: number;
      bos: number;
      net: number;
    }[];
    dersBazli?: {
      dersKodu: string;
      dersAdi: string;
      dogru: number;
      yanlis: number;
      bos: number;
      net: number;
      basariOrani?: number;
    }[];
  }[];
  organizationId?: string;
  academicYearId?: string;
}

// POST - Sınav sihirbazından gelen tüm veriyi kaydet
export async function POST(req: NextRequest) {
  const supabase = getServiceRoleClient();
  
  try {
    const body: WizardPayload = await req.json();
    const { sinavBilgisi, cevapAnahtari, ogrenciSonuclari, organizationId, academicYearId } = body;
    
    console.log('[Wizard API] Kayıt başladı:', {
      sinav: sinavBilgisi.ad,
      cevapSayisi: cevapAnahtari.length,
      ogrenciSayisi: ogrenciSonuclari.length
    });
    
    // 1. Sınav tipini bul veya oluştur
    let examTypeId: string | null = null;
    
    // Önce mevcut exam_types tablosunda ara
    const { data: existingType } = await supabase
      .from('exam_types')
      .select('id')
      .eq('code', sinavBilgisi.tip)
      .single();
    
    if (existingType) {
      examTypeId = existingType.id;
    }
    
    // 2. Sınavı oluştur (exams tablosu)
    const examData = {
      name: sinavBilgisi.ad,
      exam_date: sinavBilgisi.tarih,
      exam_type_id: examTypeId,
      organization_id: organizationId || null,
      academic_year_id: academicYearId || null,
      total_questions: cevapAnahtari.length || sinavBilgisi.toplamSoru || 0,
      grade_level: sinavBilgisi.sinifSeviyesi || '8',
      exam_type: sinavBilgisi.tip,
      booklets: sinavBilgisi.kitapcikTurleri || ['A'],
      answer_key: cevapAnahtari, // JSONB olarak kaydet
      status: 'completed',
      description: sinavBilgisi.aciklama,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert(examData)
      .select()
      .single();
    
    if (examError) {
      console.error('[Wizard API] Sınav oluşturma hatası:', examError);
      return NextResponse.json({ error: examError.message }, { status: 500 });
    }
    
    console.log('[Wizard API] Sınav oluşturuldu:', exam.id);
    
    // 3. Testleri oluştur (exam_tests tablosu)
    // Cevap anahtarından dersleri grupla
    const dersGruplari: Record<string, typeof cevapAnahtari> = {};
    cevapAnahtari.forEach(c => {
      if (!dersGruplari[c.dersKodu]) {
        dersGruplari[c.dersKodu] = [];
      }
      dersGruplari[c.dersKodu].push(c);
    });
    
    const testInserts = Object.entries(dersGruplari).map(([dersKodu, satirlar], index) => {
      const ilkSoru = Math.min(...satirlar.map(s => s.soruNo));
      const sonSoru = Math.max(...satirlar.map(s => s.soruNo));
      
      return {
        exam_id: exam.id,
        test_name: satirlar[0].dersAdi || dersKodu,
        subject_code: dersKodu,
        test_order: index + 1,
        question_count: satirlar.length,
        start_question: ilkSoru,
        end_question: sonSoru,
        coefficient: 1.0,
        wrong_penalty_ratio: sinavBilgisi.yanlisKatsayisi || (sinavBilgisi.tip === 'LGS' ? 3 : 4),
        created_at: new Date().toISOString()
      };
    });
    
    if (testInserts.length > 0) {
      const { data: tests, error: testsError } = await supabase
        .from('exam_tests')
        .insert(testInserts)
        .select();
      
      if (testsError) {
        console.error('[Wizard API] Test oluşturma hatası:', testsError);
        // Devam et, kritik değil
      } else {
        console.log('[Wizard API] Testler oluşturuldu:', tests?.length);
        
        // 4. Kitapçık cevap anahtarlarını oluştur
        const kitapciklar = sinavBilgisi.kitapcikTurleri || ['A'];
        const cevapInserts: any[] = [];
        
        tests?.forEach(test => {
          kitapciklar.forEach(kitapcik => {
            const testSoruları = dersGruplari[test.subject_code] || [];
            const cevaplar = testSoruları
              .sort((a, b) => {
                const aNo = a.kitapcikSoruNo?.[kitapcik as 'A'|'B'|'C'|'D'] || a.soruNo;
                const bNo = b.kitapcikSoruNo?.[kitapcik as 'A'|'B'|'C'|'D'] || b.soruNo;
                return aNo - bNo;
              })
              // ✅ KRİTİK: Kitapçık bazlı cevap varsa onu kullan, yoksa A cevabına fallback
              // Not: Manuel cevap anahtarı girişinde A ve B kitapçığı cevapları farklı olabilir.
              .map((s: any) => (s.kitapcikCevaplari?.[kitapcik] ?? s.dogruCevap));
            
            cevapInserts.push({
              test_id: test.id,
              booklet_type: kitapcik,
              answers: cevaplar,
              competency_mapping: testSoruları.map(s => ({
                soruNo: s.soruNo,
                kazanimKodu: s.kazanimKodu,
                kazanimMetni: s.kazanimMetni
              })),
              created_at: new Date().toISOString()
            });
          });
        });
        
        if (cevapInserts.length > 0) {
          const { error: cevapError } = await supabase
            .from('booklet_answer_keys')
            .insert(cevapInserts);
          
          if (cevapError) {
            console.error('[Wizard API] Cevap anahtarı hatası:', cevapError);
          } else {
            console.log('[Wizard API] Cevap anahtarları oluşturuldu:', cevapInserts.length);
          }
        }
      }
    }
    
    // 5. Öğrenci sonuçlarını kaydet (student_exam_results)
    // MEB 100-500 Skala Hesaplama (LGS için)
    if (ogrenciSonuclari.length > 0) {
      const studentInserts = ogrenciSonuclari.map((ogr, idx) => {
        // MEB LGS Puanı Hesapla (eğer gelen puan yoksa veya eski formülse)
        let lgsPuani = ogr.toplamPuan;
        
        // Eğer puan 100'den küçükse, eski formülle hesaplanmış demektir
        // MEB formülüyle yeniden hesapla
        if (!lgsPuani || lgsPuani < 100) {
          // Ders bazlı netlerden ağırlıklı puan hesapla
          if (ogr.dersBazli && ogr.dersBazli.length > 0) {
            const LGS_KATSAYILARI: Record<string, number> = {
              'TUR': 4.0, 'MAT': 4.0, 'FEN': 4.0,
              'INK': 1.0, 'DIN': 1.0, 'ING': 1.0,
              'TURKCE': 4.0, 'MATEMATIK': 4.0, 'FEN_BILIMLERI': 4.0,
              'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK': 1.0, 'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ': 1.0, 'İNGİLİZCE': 1.0
            };
            
            let agirlikliHamPuan = 0;
            ogr.dersBazli.forEach((ders: any) => {
              const katsayi = LGS_KATSAYILARI[ders.dersKodu?.toUpperCase()] || 1.0;
              agirlikliHamPuan += (ders.net || 0) * katsayi;
            });
            
            // MEB 100-500 Skala: Puan = 100 + (AHP × 400 / 270)
            const olceklenmisKatki = (agirlikliHamPuan * 400) / 270;
            lgsPuani = 100 + olceklenmisKatki;
          } else {
            // Ders bazlı veri yoksa, basit hesapla
            // Varsayım: Tüm dersler eşit dağılmış, net'e göre oran
            const tahminiAHP = ogr.toplamNet * 3; // Ortalama katsayı ~3
            const olceklenmisKatki = (tahminiAHP * 400) / 270;
            lgsPuani = 100 + olceklenmisKatki;
          }
          
          // Sınırlar
          lgsPuani = Math.max(100, Math.min(500, lgsPuani));
        }
        
        return {
          exam_id: exam.id,
          student_no: ogr.ogrenciNo,
          student_name: ogr.ogrenciAdi,
          class_name: ogr.sinifNo || null,
          booklet: ogr.kitapcik || 'A',
          total_correct: ogr.toplamDogru,
          total_wrong: ogr.toplamYanlis,
          total_empty: ogr.toplamBos,
          total_net: ogr.toplamNet,
          total_score: Math.round(lgsPuani * 100) / 100, // MEB LGS Puanı
          general_rank: ogr.siralama || idx + 1,
          class_rank: ogr.sinifSira || null,
          all_answers: null,
          created_at: new Date().toISOString()
        };
      });
      
      // Batch insert (100'lük gruplar halinde)
      const batchSize = 100;
      for (let i = 0; i < studentInserts.length; i += batchSize) {
        const batch = studentInserts.slice(i, i + batchSize);
        
        const { error: studentError } = await supabase
          .from('student_exam_results')
          .insert(batch);
        
        if (studentError) {
          console.error('[Wizard API] Öğrenci sonuç hatası (batch):', studentError);
        }
      }
      
      console.log('[Wizard API] Öğrenci sonuçları kaydedildi:', ogrenciSonuclari.length);
    }
    
    // 6. Audit log - hata olsa bile devam et
    try {
      await supabase.from('exam_audit_log').insert({
        action: 'CREATE',
        entity_type: 'exam',
        entity_id: exam.id,
        exam_id: exam.id,
        description: `Sınav sihirbazı ile oluşturuldu: ${sinavBilgisi.ad} (${ogrenciSonuclari.length} öğrenci)`,
        organization_id: organizationId
      });
    } catch (auditError) {
      console.warn('[Wizard API] Audit log yazılamadı:', auditError);
    }
    
    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        name: exam.name,
        examDate: exam.exam_date,
        totalQuestions: exam.total_questions,
        totalStudents: ogrenciSonuclari.length,
        averageNet: ogrenciSonuclari.length > 0
          ? (ogrenciSonuclari.reduce((s, o) => s + o.toplamNet, 0) / ogrenciSonuclari.length).toFixed(2)
          : 0
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('[Wizard API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}

// GET - Son sınavları listele (basit versiyon)
export async function GET(req: NextRequest) {
  const supabase = getServiceRoleClient();
  
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let query = supabase
      .from('exams')
      .select(`
        id,
        name,
        exam_date,
        exam_type,
        grade_level,
        total_questions,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data: exams, error } = await query;
    
    if (error) {
      console.error('[Wizard API] Sınav listesi hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Her sınav için öğrenci sayısını ve ortalama neti getir
    const examsWithStats = await Promise.all((exams || []).map(async (exam) => {
      const { data: results } = await supabase
        .from('student_exam_results')
        .select('total_net, student_name, general_rank')
        .eq('exam_id', exam.id)
        .order('general_rank', { ascending: true })
        .limit(20);
      
      const toplamOgrenci = results?.length || 0;
      const ortalamaNet = toplamOgrenci > 0
        ? (results!.reduce((s, r) => s + parseFloat(String(r.total_net)), 0) / toplamOgrenci).toFixed(2)
        : '0';
      
      return {
        id: exam.id,
        ad: exam.name,
        tarih: exam.exam_date,
        tip: exam.exam_type || 'LGS',
        toplamSoru: exam.total_questions,
        toplamOgrenci,
        ortalamaNet,
        ilk20Ogrenci: results?.map((r, i) => ({
          ogrenciNo: '',
          ogrenciAdi: r.student_name,
          toplamNet: parseFloat(String(r.total_net)),
          siralama: r.general_rank || i + 1
        })) || [],
        createdAt: exam.created_at
      };
    }));
    
    return NextResponse.json({ exams: examsWithStats });
    
  } catch (error: any) {
    console.error('[Wizard API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}

