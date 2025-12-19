import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface PaymentRequest {
  installment_id: string;
  student_id: string;
  amount: number;
  payment_method?: 'cash' | 'card' | 'transfer' | 'eft';
  notes?: string;
}

/**
 * POST /api/payments
 * Taksit ödemesi kaydet
 */
export async function POST(req: NextRequest) {
  try {
    const body: PaymentRequest = await req.json();
    const { installment_id, student_id, amount, payment_method = 'cash', notes } = body;

    // Validasyon
    if (!installment_id || !student_id || !amount) {
      return NextResponse.json(
        { success: false, error: 'installment_id, student_id ve amount gerekli' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Ödeme tutarı 0\'dan büyük olmalı' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 1. Taksit bilgisini getir
    const { data: installment, error: fetchError } = await supabase
      .from('finance_installments')
      .select('*')
      .eq('id', installment_id)
      .eq('student_id', student_id)
      .single();

    if (fetchError || !installment) {
      return NextResponse.json(
        { success: false, error: 'Taksit bulunamadı' },
        { status: 404 }
      );
    }

    // 2. Kalan borcu hesapla
    const remainingAmount = installment.amount - (installment.paid_amount || 0);
    
    if (amount > remainingAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Ödeme tutarı kalan borçtan (₺${remainingAmount.toLocaleString('tr-TR')}) fazla olamaz` 
        },
        { status: 400 }
      );
    }

    // 3. Yeni paid_amount hesapla
    const newPaidAmount = (installment.paid_amount || 0) + amount;
    const isPaid = newPaidAmount >= installment.amount;

    // 4. Taksiti güncelle
    const updateData: any = {
      paid_amount: newPaidAmount,
      is_paid: isPaid,
      status: isPaid ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending'),
      updated_at: new Date().toISOString(),
    };
    
    // Tam ödeme yapıldıysa paid_at tarihini de ekle
    if (isPaid) {
      updateData.paid_at = new Date().toISOString();
      updateData.payment_method = payment_method;
    }
    
    const { error: updateError } = await supabase
      .from('finance_installments')
      .update(updateData)
      .eq('id', installment_id);

    if (updateError) {
      console.error('Taksit güncelleme hatası:', updateError);
      return NextResponse.json(
        { success: false, error: `Taksit güncellenemedi: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 5. Ödeme kaydı oluştur (isteğe bağlı - eğer payments tablosu varsa)
    try {
      await supabase.from('payments').insert({
        student_id,
        installment_id,
        amount,
        payment_method,
        payment_date: new Date().toISOString(),
        notes,
      });
    } catch (paymentsError) {
      // Payments tablosu yoksa es geç, sadece log
      console.warn('Payments tablosu bulunamadı veya insert edilemedi:', paymentsError);
    }

    // 6. Öğrenci toplamlarını güncelle
    const { data: allInstallments } = await supabase
      .from('finance_installments')
      .select('amount, paid_amount')
      .eq('student_id', student_id);

    if (allInstallments) {
      const totalAmount = allInstallments.reduce((sum, i) => sum + (i.amount || 0), 0);
      const totalPaid = allInstallments.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
      const balance = totalAmount - totalPaid;

      await supabase
        .from('students')
        .update({
          total_amount: totalAmount,
          paid_amount: totalPaid,
          balance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', student_id);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Ödeme başarıyla kaydedildi',
        data: {
          installment_id,
          amount,
          new_paid_amount: newPaidAmount,
          is_fully_paid: isPaid,
          remaining: installment.amount - newPaidAmount,
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('Payment error:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
