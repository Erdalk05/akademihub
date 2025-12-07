import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/students/check-siblings
 * Veli TC'sine göre kayıtlı kardeş sayısını kontrol eder
 * Body: { parentTc: string }
 * Response: { siblingCount: number, hasSiblings: boolean, discountRate: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { parentTc } = await req.json();

    if (!parentTc) {
      return NextResponse.json(
        { success: false, error: 'Parent TC Kimlik is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Aynı veli TC'sine sahip öğrencileri say
    // Not: parent_tc veya mother_tc veya father_tc alanlarında arama
    const { data: students, error } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .or(`parent_tc.eq.${parentTc},mother_tc.eq.${parentTc},father_tc.eq.${parentTc}`)
      .eq('status', 'active'); // Sadece aktif öğrenciler

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Sibling check error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const siblingCount = students ? students.length : 0;
    const hasSiblings = siblingCount > 0;
    
    // Kardeş indirimi hesaplama
    // 1 kardeş var -> yeni kayıt için %10
    // 2+ kardeş var -> yeni kayıt için %15
    let discountRate = 0;
    let discountCode = '';
    
    if (siblingCount === 1) {
      discountRate = 10;
      discountCode = 'KARDES10';
    } else if (siblingCount >= 2) {
      discountRate = 15;
      discountCode = 'KARDES15';
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          siblingCount,
          hasSiblings,
          discountRate,
          discountCode,
          siblings: students?.map(s => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
          })) || [],
        },
        message: hasSiblings 
          ? `${siblingCount} kardeş bulundu. %${discountRate} kardeş indirimi uygulanabilir.` 
          : 'Kardeş kaydı bulunamadı.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Sibling check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}




