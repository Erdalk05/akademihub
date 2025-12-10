import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/students/[id]/history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    
    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Öğrenci ID gerekli' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Taksit geçmişini getir
    const { data: history, error } = await supabase
      .from('installment_history')
      .select('*')
      .eq('student_id', studentId)
      .order('restructure_date', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Geçmiş kayıtlarını grupla (restructure_date'e göre)
    const groupedHistory: Record<string, any[]> = {};
    
    for (const record of history || []) {
      const dateKey = new Date(record.restructure_date).toISOString().split('T')[0];
      if (!groupedHistory[dateKey]) {
        groupedHistory[dateKey] = [];
      }
      groupedHistory[dateKey].push(record);
    }

    // Grupları diziye çevir
    const groups = Object.entries(groupedHistory).map(([date, records]) => ({
      date,
      restructure_date: records[0]?.restructure_date,
      reason: records[0]?.restructure_reason || 'yeniden_taksitlendirme',
      previous_total: records[0]?.previous_total,
      new_total: records[0]?.new_total,
      previous_installment_count: records[0]?.previous_installment_count,
      new_installment_count: records[0]?.new_installment_count,
      installments: records.sort((a, b) => a.installment_no - b.installment_no),
      total_paid: records.reduce((sum, r) => sum + (Number(r.paid_amount) || 0), 0),
      total_amount: records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    }));

    return NextResponse.json({ 
      success: true, 
      data: groups,
      total_records: history?.length || 0
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

