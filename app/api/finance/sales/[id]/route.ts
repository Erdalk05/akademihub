import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'edge';

type Params = {
  params: {
    id: string;
  };
};

// DELETE /api/finance/sales/[id]
// Bir satış kaydını ve ona bağlı taksitleri siler.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'id parametresi zorunludur' },
      { status: 400 },
    );
  }

  try {
    const supabase = getServiceRoleClient();

    // 1) İlgili satışa bağlı tüm taksitleri sil
    const { error: instErr } = await supabase
      .from('finance_installments')
      .delete()
      .or(`sale_id.eq.${id},agreement_id.eq.${id}`);

    if (instErr) {
      // finance_installments tablosu yoksa veya başka bir hata varsa bildir
      return NextResponse.json(
        { success: false, error: instErr.message },
        { status: 500 },
      );
    }

    // 2) Satış kaydını sil (sale_items tablosu ON DELETE CASCADE olduğu için
    //    ilgili kalemler de otomatik silinecek)
    const { error: saleErr } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (saleErr) {
      return NextResponse.json(
        { success: false, error: saleErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Satış silinemedi' },
      { status: 500 },
    );
  }
}


