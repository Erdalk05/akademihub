import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/finance/monthly-stats
 * Son 6 ayın gelir/gider istatistiklerini döndürür
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // Son 6 ayın tarihlerini hesapla
    const months = [];
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      months.push({
        name: monthNames[monthIndex],
        month: monthIndex + 1,
        year: year,
        startDate: new Date(year, monthIndex, 1).toISOString(),
        endDate: new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString()
      });
    }

    const monthlyData = [];

    for (const month of months) {
      // Gelir: O ay içinde ödenen taksitler
      const { data: payments, error: paymentsError } = await supabase
        .from('finance_installments')
        .select('paid_amount')
        .eq('is_paid', true)
        .gte('paid_at', month.startDate)
        .lte('paid_at', month.endDate);

      if (paymentsError) {
        console.error('Payments error:', paymentsError);
      }

      const gelir = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;

      // Gider: O ay içindeki giderler
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', month.startDate)
        .lte('date', month.endDate);

      if (expensesError) {
        console.error('Expenses error:', expensesError);
      }

      const gider = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const net = gelir - gider;

      monthlyData.push({
        month: month.name,
        gelir: Math.round(gelir),
        gider: Math.round(gider),
        net: Math.round(net),
        cashFlow: Math.round(net)
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: monthlyData,
        message: 'Monthly stats retrieved successfully'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Monthly stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch monthly stats'
      },
      { status: 500 }
    );
  }
}




