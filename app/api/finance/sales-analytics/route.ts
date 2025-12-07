import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// GET /api/finance/sales-analytics
// Son 30 gün satış verilerinden özet istatistikler döner.
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get('days') || 30);

    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('sales')
      .select('id, sale_date, net_amount, customer_type, sale_items (product_name, category, total_price)')
      .gte('sale_date', from.toISOString())
      .order('sale_date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const rows = (data || []) as Array<{
      id: string;
      sale_date: string;
      net_amount: number;
      customer_type: 'student' | 'external' | string;
      sale_items: Array<{
        product_name: string;
        category: string;
        total_price: number;
      }> | null;
    }>;

    // Zaman serisi: gün bazında net satış
    const dayBuckets = new Map<string, number>();
    let totalNet = 0;

    // Ürün ve kategori bazlı satışlar
    const productBuckets = new Map<string, number>();
    const categoryBuckets = new Map<string, number>();

    // Öğrenci vs harici müşteri oranı (net tutara göre)
    let studentNet = 0;
    let externalNet = 0;

    rows.forEach((row) => {
      const saleDate = row.sale_date ? new Date(row.sale_date) : null;
      const net = Number(row.net_amount || 0);
      if (saleDate) {
        const key = saleDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const prev = dayBuckets.get(key) || 0;
        dayBuckets.set(key, prev + net);
      }
      totalNet += net;

      if (row.customer_type === 'student') {
        studentNet += net;
      } else if (row.customer_type === 'external') {
        externalNet += net;
      }

      const items = Array.isArray(row.sale_items) ? row.sale_items : [];
      items.forEach((it) => {
        const amount = Number(it.total_price || 0);
        const pname = (it.product_name || 'Diğer').trim();
        const cat = (it.category || 'other').trim() || 'other';

        productBuckets.set(pname, (productBuckets.get(pname) || 0) + amount);
        categoryBuckets.set(cat, (categoryBuckets.get(cat) || 0) + amount);
      });
    });

    const timeSeries = Array.from(dayBuckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date, totalNet: value }));

    const topProducts = Array.from(productBuckets.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const categoryBreakdown = Array.from(categoryBuckets.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    const customerTypeRatio = {
      studentNet,
      externalNet,
      totalNet,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          timeSeries,
          topProducts,
          categoryBreakdown,
          customerTypeRatio,
        },
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Satış analitiği hesaplanamadı' },
      { status: 500 },
    );
  }
}


