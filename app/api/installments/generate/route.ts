import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient, getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type GenerateBody = {
  student_id: string;
  count: number;
  amount: number; // taksit başına tutar
  first_due_date?: string; // YYYY-MM-DD
  start_date?: string; // geriye dönük uyumluluk için
  interval?: 'monthly' | 'weekly';
};

function toDateOnlyIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

export async function POST(req: NextRequest) {
  try {
    const body: GenerateBody = await req.json();
    const { student_id, count, amount, first_due_date, start_date, interval } = body || ({} as GenerateBody);

    const effectiveStart = first_due_date || start_date;

    if (!student_id || !count || !amount || !effectiveStart) {
      return NextResponse.json(
        { success: false, error: 'student_id, count, amount, first_due_date zorunludur' },
        { status: 400 }
      );
    }
    if (Number(count) <= 0 || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'count ve amount pozitif olmalı' },
        { status: 400 }
      );
    }
    
    // ⚠️ GÜVENLİK: Maksimum taksit sayısı kontrolü
    if (Number(count) > 24) {
      return NextResponse.json(
        { success: false, error: 'Maksimum 24 taksit oluşturulabilir (2 yıl)' },
        { status: 400 }
      );
    }

    const accessToken = getAccessTokenFromRequest(req);
    // Eğer Authorization yoksa (admin panelinden gelen istekler gibi),
    // taksit üretimi için service role client kullanıyoruz ki RLS'e takılmasın.
    const supabase = accessToken
      ? createRlsServerClient(accessToken)
      : getServiceRoleClient();

    const n = Number(count);
    const perAmount = Number(amount);
    const start = new Date(effectiveStart);
    const step = interval === 'weekly' ? 'weekly' : 'monthly';

    // 0) Öğrencinin organization_id'sini al (taksitlere eklemek için)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('organization_id, academic_year')
      .eq('id', student_id)
      .single();
    
    if (studentError) {
      console.error('Öğrenci bulunamadı:', studentError);
      return NextResponse.json(
        { success: false, error: 'Öğrenci bulunamadı: ' + studentError.message },
        { status: 404 }
      );
    }
    
    const organizationId = studentData?.organization_id;
    const academicYear = studentData?.academic_year;
    console.log('[Installments] Student org:', organizationId, 'Year:', academicYear);

    // 1) Öğrencinin mevcut taksitlerini al
    const { data: existing, error: existingError } = await supabase
      .from('finance_installments')
      .select('id, installment_no, is_paid')
      .eq('student_id', student_id)
      .order('installment_no', { ascending: true });
    
    // ⚠️ GÜVENLİK: Eğer zaten çok fazla taksit varsa, uyar
    if (existing && existing.length > 50) {
      console.warn('ANORMAL TAKSİT SAYISI:', {
        student_id,
        existing_count: existing.length,
        message: 'Veritabanı temizlenmeli!',
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Bu öğrenci için zaten ${existing.length} taksit var! Normal üst sınır 24'tür. Lütfen önce veritabanını temizleyin.` 
        },
        { status: 400 }
      );
    }

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 },
      );
    }

    let startNo = 1;

    if (existing && existing.length > 0) {
      const paidOnes = existing.filter((it: any) => it.is_paid);
      const unpaidIds = existing.filter((it: any) => !it.is_paid).map((it: any) => it.id);

      // Ödenmemiş eski taksitleri sil
      if (unpaidIds.length > 0) {
        const { error: delError } = await supabase
          .from('finance_installments')
          .delete()
          .in('id', unpaidIds);
        if (delError) {
          return NextResponse.json(
            { success: false, error: delError.message },
            { status: 500 },
          );
        }
      }

      const maxPaidNo =
        paidOnes.length > 0
          ? Math.max(...paidOnes.map((it: any) => Number(it.installment_no) || 0))
          : 0;

      startNo = maxPaidNo + 1;
    }

    // 2) Yeni planı oluştur (ödenmiş taksitlerden sonrasını yeniden hesapla)
    const rows: any[] = [];
    for (let i = 0; i < n; i++) {
      const due = new Date(start);
      if (step === 'weekly') {
        due.setDate(due.getDate() + i * 7);
      } else {
        due.setMonth(due.getMonth() + i);
      }
      rows.push({
        student_id,
        installment_no: startNo + i,
        amount: perAmount,
        due_date: toDateOnlyIso(due),
        is_paid: false,
        payment_id: null,
        organization_id: organizationId, // ✅ ORGANİZASYON ID EKLENDİ
        academic_year: academicYear, // ✅ AKADEMİK YIL EKLENDİ
      });
    }
    
    console.log('[Installments] Creating', rows.length, 'installments for org:', organizationId);

    const { data, error } = await supabase
      .from('finance_installments')
      .insert(rows)
      .select('id, student_id, installment_no, amount, due_date, is_paid, payment_id, created_at');
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 3) Öğrencinin total_amount değerini güncelle (Dashboard için önemli!)
    const totalAmount = n * perAmount;
    const { error: updateError } = await supabase
      .from('students')
      .update({ 
        total_amount: totalAmount,
        balance: totalAmount // Henüz ödeme yapılmadığı için bakiye = toplam tutar
      })
      .eq('id', student_id);
    
    if (updateError) {
      console.warn('[Installments] Students total_amount update failed:', updateError.message);
    } else {
      console.log('[Installments] Updated student total_amount:', totalAmount);
    }
    
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}


