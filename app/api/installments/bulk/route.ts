import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// POST /api/installments/bulk - Create multiple installments at once
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, installments } = body;

    if (!student_id || !installments || !Array.isArray(installments)) {
      return NextResponse.json(
        { success: false, error: 'student_id and installments array required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Add student_id to each installment
    const installmentsWithStudentId = installments.map(inst => ({
      ...inst,
      student_id,
    }));

    const { data, error } = await supabase
      .from('finance_installments')
      .insert(installmentsWithStudentId)
      .select();

    if (error) {
      console.error('Bulk installments insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    console.error('Bulk installments error:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}



