'use server';

type TakePaymentInput = {
  installmentId: string;
  method: 'cash' | 'card' | 'bank';
  notes?: string;
};

export async function takePaymentAction(input: TakePaymentInput) {
  const { installmentId, method } = input || {};
  if (!installmentId || !method) {
    return { ok: false, error: 'installmentId ve method zorunludur.' };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const res = await fetch(`${baseUrl}/api/installments/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installment_id: installmentId,
        payment_method: method,
      }),
      cache: 'no-store',
    });

    const js = await res.json();
    if (!res.ok || !js?.success) {
      return { ok: false, error: js?.error || 'Ödeme alınamadı' };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Ödeme alınamadı' };
  }
}

