import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// POST /api/students/bulk-delete
// Body: { ids: string[] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const ids: string[] | undefined = body?.ids;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Silinecek öğrenci listesi boş.' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .from('students')
      .delete()
      .in('id', ids);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedCount: ids.length }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}



