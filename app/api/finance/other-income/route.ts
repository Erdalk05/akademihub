import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// GET - Tüm diğer gelirleri getir
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    
    // Filtreler
    const organizationId = searchParams.get('organization_id');
    const category = searchParams.get('category');
    const studentId = searchParams.get('student_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    let query = supabase
      .from('other_income')
      .select(`
        *,
        student:students(id, first_name, last_name, student_no),
        creator:app_users(id, name)
      `)
      .order('created_at', { ascending: false });
    
    // Organization filtresi (çoklu kurum desteği)
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    // Kategori filtresi
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    // Öğrenci filtresi
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    
    // Tarih filtresi
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Other income fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST - Yeni diğer gelir ekle
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();
    
    const {
      student_id,
      title,
      category,
      amount,
      payment_type,
      date,
      notes,
      created_by,
      organization_id
    } = body;
    
    // Validasyon
    if (!title || !amount) {
      return NextResponse.json(
        { success: false, error: 'Başlık ve tutar zorunludur' },
        { status: 400 }
      );
    }
    
    // Geçerli kategoriler
    const validCategories = ['book', 'uniform', 'meal', 'stationery', 'other'];
    const finalCategory = validCategories.includes(category) ? category : 'other';
    
    // Geçerli ödeme türleri
    const validPaymentTypes = ['cash', 'card', 'bank', 'other'];
    const finalPaymentType = validPaymentTypes.includes(payment_type) ? payment_type : 'cash';
    
    const { data, error } = await supabase
      .from('other_income')
      .insert({
        student_id: student_id || null,
        title,
        category: finalCategory,
        amount: Number(amount),
        payment_type: finalPaymentType,
        date: date || new Date().toISOString(),
        notes: notes || null,
        created_by: created_by || null,
        organization_id: organization_id || null,
        is_paid: body.is_paid ?? false,
        paid_amount: body.paid_amount ?? 0,
        paid_at: body.paid_at || null,
        due_date: body.due_date || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Other income insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE - Diğer gelir sil
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID gerekli' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('other_income')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Other income delete error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Kayıt silindi' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH - Diğer gelir güncelle
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID gerekli' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('other_income')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Other income update error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

