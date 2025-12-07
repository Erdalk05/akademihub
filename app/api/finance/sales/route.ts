import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Bu endpointte Supabase service role kullanıyoruz, bu yüzden nodejs runtime
// kullanmak daha güvenli.
export const runtime = 'nodejs';

// Yardımcı: toplamlarda kuruş hassasiyeti
const round2 = (n: number) => Math.round(n * 100) / 100;

// GET /api/finance/sales
// Tüm satış kayıtlarını, herhangi bir filtre uygulamadan döndürür.
// NOT: Hiçbir where/eq/is filtresi yok; tüm satırlar gelir.
export async function GET() {
  const supabase = getServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from('sales')
      .select(
        `
        id,
        sale_no,
        student_id,
        customer_name,
        customer_type,
        sales_customer_id,
        total_amount,
        discount,
        tax,
        net_amount,
        payment_method,
        status,
        sale_date,
        created_at,
        sale_items (
          count
        )
      `,
      )
      .order('sale_date', { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('GET /sales error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ sales: data ?? [] }, { status: 200 });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('GET /sales exception:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/finance/sales
// Body: { customerType: 'student' | 'external', studentId?, salesCustomerId?, items: [...], paymentMethod?, discount?, tax? }
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));

    const customerType = body.customerType as 'student' | 'external' | undefined;
    const studentId = body.studentId as string | undefined;
    const salesCustomerId = body.salesCustomerId as string | undefined;
    const items = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = body.paymentMethod as string | undefined;
    const discountInput = Number(body.discount || 0);
    const taxInput = Number(body.tax || 0);
    const installmentsInput = Array.isArray(body.installments)
      ? body.installments
      : [];

    if (!customerType || (customerType === 'student' && !studentId) || (customerType === 'external' && !salesCustomerId)) {
      return NextResponse.json(
        { success: false, error: 'Müşteri tipi ve kimliği zorunludur' },
        { status: 400 },
      );
    }

    if (!items.length) {
      return NextResponse.json(
        { success: false, error: 'En az bir ürün eklemelisiniz' },
        { status: 400 },
      );
    }

    const normalizedItems = items.map((it: any) => {
      const quantity = Number(it.quantity || 0);
      const unitPrice = Number(it.unitPrice || it.unit_price || 0);
      const lineDiscount = Number(it.discount || 0);

      return {
        product_id: it.productId || it.product_id || null,
        product_name: String(it.productName || it.product_name || '').trim(),
        category: String(it.category || '').trim() || 'other',
        quantity,
        unit_price: unitPrice,
        discount: lineDiscount,
        total_price: round2(quantity * unitPrice - lineDiscount),
      };
    });

    const firstProductName = normalizedItems[0]?.product_name as string | undefined;
    const otherCount = Math.max(normalizedItems.length - 1, 0);
    const saleNoteBase = firstProductName
      ? otherCount > 0
        ? `Satış: ${firstProductName} +${otherCount}`
        : `Satış: ${firstProductName}`
      : 'Satış Taksiti';

    const totalAmount = round2(
      normalizedItems.reduce(
        (sum: number, it: { total_price: number }) => sum + it.total_price,
        0,
      ),
    );
    const discount = round2(discountInput);
    const tax = round2(taxInput);
    const netAmount = round2(totalAmount - discount + tax);

    // Müşteri adı (öğrenci veya harici müşteri) - denormalize alan
    let customerName: string | null = null;
    if (customerType === 'student' && studentId) {
      const { data: stu } = await supabase
        .from('students')
        .select('first_name, last_name, full_name, parent_name, student_no')
        .eq('id', studentId)
        .single();
      if (stu) {
        const full =
          `${stu.first_name || ''} ${stu.last_name || ''}`.trim() ||
          stu.full_name ||
          stu.parent_name ||
          stu.student_no;
        customerName = full || 'Öğrenci';
      } else {
        customerName = 'Öğrenci';
      }
    } else if (customerType === 'external' && salesCustomerId) {
      const { data: ext } = await supabase
        .from('sales_customers')
        .select('full_name')
        .eq('id', salesCustomerId)
        .single();
      customerName = ext?.full_name || 'Müşteri';
    }

    // Benzersiz ve çakışma ihtimali düşük bir satış numarası üret
    // Eski count tabanlı yaklaşım, eş zamanlı kayıt veya cache durumlarında
    // aynı numarayı üretebildiği için unique constraint hatasına yol açıyordu.
    const now = new Date();
    const yearStr = now.getFullYear().toString();
    const timePart = `${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 haneli rastgele sayı
    const saleNo = `SAL-${yearStr}-${timePart}-${randomPart}`;

    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        sale_no: saleNo,
        customer_type: customerType,
        student_id: customerType === 'student' ? studentId : null,
        sales_customer_id: customerType === 'external' ? salesCustomerId : null,
        customer_name: customerName,
        total_amount: totalAmount,
        discount,
        tax,
        net_amount: netAmount,
        payment_method: paymentMethod || null,
        status: 'completed',
      })
      .select('*')
      .single();

    if (saleErr || !sale) {
      return NextResponse.json(
        { success: false, error: saleErr?.message || 'Satış kaydedilemedi' },
        { status: 500 },
      );
    }

    const itemsToInsert = normalizedItems.map((it: { product_id: string | null; product_name: string; category: string; quantity: number; unit_price: number; discount: number; total_price: number }) => ({
      ...it,
      sale_id: sale.id,
    }));

    const { error: itemsErr } = await supabase
      .from('sale_items')
      .insert(itemsToInsert);

    if (itemsErr) {
      return NextResponse.json(
        { success: false, error: itemsErr.message },
        { status: 500 },
      );
    }

    // Opsiyonel: öğrenci müşteriler için taksit planı oluştur
    if (customerType === 'student' && studentId && installmentsInput.length > 0) {
      try {
        // Gelen installment verilerini unified endpoint formatına çevir
        const generatedInstallments = installmentsInput.map((inst: any, index: number) => {
          const amount = Number(inst.amount || 0);
          const dueDateStr =
            inst.dueDate || inst.due_date || new Date().toISOString().split('T')[0];

          return {
            number: index + 1,
            amount: round2(amount),
            due_date: dueDateStr,
            note: `${saleNoteBase} • T${index + 1}`,
          };
        });

        const url = new URL('/api/finance/installments/create', req.url);
        const resp = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'sale',
            sale_id: sale.id,
            student_id: studentId,
            agreement_id: sale.id,
            installments: generatedInstallments,
          }),
        });

        if (!resp.ok) {
          const js = await resp.json().catch(() => null);
          // eslint-disable-next-line no-console
          console.error(
            'Installment create via /api/finance/installments/create failed:',
            js?.error || resp.statusText,
          );
        }
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('Installment plan create error (sales):', e?.message);
      }
    }

    return NextResponse.json(
      { success: true, data: { sale, items: itemsToInsert } },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Satış oluşturulamadı' },
      { status: 500 },
    );
  }
}


