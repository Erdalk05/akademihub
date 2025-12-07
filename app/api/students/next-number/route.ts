import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/students/next-number
 * Bir sonraki öğrenci numarasını otomatik olarak üretir
 * Format: 2024-001, 2024-002, ...
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    
    // Şu anki yılı al
    const currentYear = new Date().getFullYear();
    
    // Bu yıl kayıtlı öğrencileri çek (student_no formatı: YYYY-XXX)
    const { data: students, error } = await supabase
      .from('students')
      .select('student_no')
      .like('student_no', `${currentYear}-%`)
      .order('student_no', { ascending: false })
      .limit(1);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Student number fetch error:', error);
      // Hata olsa bile devam et, ilk numarayı ver
    }

    let nextNumber = 1;
    
    if (students && students.length > 0 && students[0].student_no) {
      // En son numarayı parse et (örn: "2024-003" -> 3)
      const lastNumber = students[0].student_no;
      const parts = lastNumber.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }
    }

    // Formatla: 2024-001, 2024-002, ...
    const formattedNumber = `${currentYear}-${String(nextNumber).padStart(3, '0')}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          studentNumber: formattedNumber,
          year: currentYear,
          sequence: nextNumber,
        },
        message: 'Next student number generated successfully'
      },
      { status: 200 }
    );
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Next student number error:', error);
    
    // Fallback: En azından bu yılın 001'ini döndür
    const currentYear = new Date().getFullYear();
    return NextResponse.json(
      {
        success: true,
        data: {
          studentNumber: `${currentYear}-001`,
          year: currentYear,
          sequence: 1,
        },
        message: 'Fallback student number generated'
      },
      { status: 200 }
    );
  }
}




