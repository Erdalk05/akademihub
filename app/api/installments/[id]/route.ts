import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Taksit sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceRoleClient();
    const installmentId = params.id;

    if (!installmentId) {
      return NextResponse.json(
        { success: false, error: 'Taksit ID gerekli' },
        { status: 400 }
      );
    }

    // Önce taksiti kontrol et
    const { data: installment, error: fetchError } = await supabase
      .from('finance_installments')
      .select('*')
      .eq('id', installmentId)
      .single();

    if (fetchError || !installment) {
      return NextResponse.json(
        { success: false, error: 'Taksit bulunamadı' },
        { status: 404 }
      );
    }

    // Ödeme yapılmış taksit silinemez uyarısı (ama izin ver)
    if (installment.is_paid) {
      console.warn(`Ödeme yapılmış taksit siliniyor: ${installmentId}`);
    }

    // Taksiti sil
    const { error: deleteError } = await supabase
      .from('finance_installments')
      .delete()
      .eq('id', installmentId);

    if (deleteError) {
      console.error('Taksit silme hatası:', deleteError);
      return NextResponse.json(
        { success: false, error: `Taksit silinemedi: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Öğrenci bakiyesini güncelle
    if (installment.student_id && installment.is_paid) {
      const { data: student } = await supabase
        .from('students')
        .select('paid_amount, total_amount')
        .eq('id', installment.student_id)
        .single();

      if (student) {
        const newPaidAmount = Math.max(0, (student.paid_amount || 0) - (installment.paid_amount || installment.amount));
        await supabase
          .from('students')
          .update({
            paid_amount: newPaidAmount,
            balance: (student.total_amount || 0) - newPaidAmount
          })
          .eq('id', installment.student_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Taksit başarıyla silindi'
    });

  } catch (error: any) {
    console.error('Taksit silme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}
