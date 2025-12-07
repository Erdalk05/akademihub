import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * DELETE /api/cleanup/students
 * Tüm öğrencileri ve ilişkili taksitleri siler
 * ⚠️ DİKKAT: Bu işlem geri alınamaz!
 */
export async function DELETE(req: NextRequest) {
  try {
    // Güvenlik kontrolü
    const confirmHeader = req.headers.get('X-Confirm-Delete');
    if (confirmHeader !== 'YES_DELETE_ALL_STUDENTS') {
      return NextResponse.json(
        { success: false, error: 'Güvenlik onayı gerekli. X-Confirm-Delete header eksik.' },
        { status: 403 }
      );
    }

    const supabase = getServiceRoleClient();

    // 1. Önce taksitleri sil (foreign key ilişkisi olabilir)
    const { data: installmentsBefore, error: countInstError } = await supabase
      .from('finance_installments')
      .select('id', { count: 'exact' });

    const installmentCount = installmentsBefore?.length || 0;

    const { error: instDeleteError } = await supabase
      .from('finance_installments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Tüm kayıtları sil

    if (instDeleteError) {
      console.error('Taksit silme hatası:', instDeleteError);
      // Hata olsa bile devam et
    }

    // 2. Enrollments tablosunu temizle (varsa)
    try {
      const { error: enrollDeleteError } = await supabase
        .from('enrollments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (enrollDeleteError) {
        console.warn('Enrollments silme hatası:', enrollDeleteError.message);
      }
    } catch (e) {
      console.warn('Enrollments tablosu bulunamadı veya silinemedi');
    }

    // 3. Finance logs temizle (varsa)
    try {
      const { error: logDeleteError } = await supabase
        .from('finance_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (logDeleteError) {
        console.warn('Finance logs silme hatası:', logDeleteError.message);
      }
    } catch (e) {
      console.warn('Finance logs tablosu bulunamadı veya silinemedi');
    }

    // 4. Öğrencileri sil
    const { data: studentsBefore, error: countStudError } = await supabase
      .from('students')
      .select('id', { count: 'exact' });

    const studentCount = studentsBefore?.length || 0;

    const { error: studentDeleteError } = await supabase
      .from('students')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Tüm kayıtları sil

    if (studentDeleteError) {
      console.error('Öğrenci silme hatası:', studentDeleteError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Öğrenci silme hatası: ${studentDeleteError.message}`,
          deleted: {
            installments: installmentCount,
            students: 0
          }
        },
        { status: 500 }
      );
    }

    // Başarılı sonuç
    console.log(`✅ Temizlik tamamlandı: ${studentCount} öğrenci, ${installmentCount} taksit silindi`);

    return NextResponse.json({
      success: true,
      message: 'Tüm veriler başarıyla silindi',
      deleted: {
        students: studentCount,
        installments: installmentCount,
      },
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Silme işlemi başarısız' },
      { status: 500 }
    );
  }
}

