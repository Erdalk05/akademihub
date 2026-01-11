import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// CEVAP ANAHTARI API - sinav_cevap_anahtari tablosu
// GET: Kayıtlı cevap anahtarlarını listele
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const examId = searchParams.get('examId');

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'organizationId gerekli' 
      }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Eğer examId verilmişse, o sınavın cevap anahtarını getir
    if (examId) {
      const { data, error } = await supabase
        .from('sinav_cevap_anahtari')
        .select('*')
        .eq('exam_id', examId)
        .eq('organization_id', organizationId)
        .order('soru_no', { ascending: true });

      if (error) {
        console.error('❌ Cevap anahtarı yükleme hatası:', error);
        return NextResponse.json({ 
          success: false, 
          message: error.message 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        data: data || [] 
      });
    }

    // Tüm kayıtlı cevap anahtarlarını getir (sınav bazında grupla)
    const { data, error } = await supabase
      .from('sinav_cevap_anahtari')
      .select(`
        *,
        exams (
          id,
          name,
          exam_type,
          exam_date,
          total_questions,
          grade_level
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Cevap anahtarı listeleme hatası:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 500 });
    }

    // Sınav bazında grupla
    const examGrouped = new Map();
    (data || []).forEach(row => {
      const exam = row.exams;
      if (exam && !examGrouped.has(exam.id)) {
        examGrouped.set(exam.id, {
          examId: exam.id,
          examName: exam.name,
          examType: exam.exam_type,
          examDate: exam.exam_date,
          gradeLevel: exam.grade_level,
          totalQuestions: exam.total_questions,
          items: [],
        });
      }
      if (exam) {
        examGrouped.get(exam.id).items.push({
          soruNo: row.soru_no,
          dogruCevap: row.dogru_cevap,
          dersKodu: row.ders_kodu,
          kazanimKodu: row.kazanim_kodu,
          kazanimMetni: row.kazanim_metni,
          konuAdi: row.konu_adi,
          zorluk: row.zorluk,
        });
      }
    });

    const templates = Array.from(examGrouped.values());

    return NextResponse.json({ 
      success: true, 
      data: templates 
    });

  } catch (error: any) {
    console.error('❌ Cevap anahtarı API hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Sunucu hatası' 
    }, { status: 500 });
  }
}
