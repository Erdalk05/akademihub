import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/students/:id
// Tek bir öğrencinin detaylı bilgilerini getirir
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Öğrenci ID bulunamadı.' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Öğrenci bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// PUT /api/students/:id
// Öğrenci bilgilerini günceller
// ⚠️ SADECE ADMIN ROLÜ GÜNCELLEYEBİLİR!
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Öğrenci ID bulunamadı.' },
        { status: 400 }
      );
    }

    // ========= ADMIN YETKİ KONTROLÜ =========
    const userRole = req.headers.get('X-User-Role');
    
    if (!userRole || userRole.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu işlem için yetkiniz yok. Sadece admin kullanıcılar öğrenci bilgilerini güncelleyebilir.' 
        },
        { status: 403 }
      );
    }
    // ========================================

    const body = await req.json();
    const supabase = getServiceRoleClient();

    // Remove fields that shouldn't be updated directly
    const { id: _id, created_at, student_no, ...updateData } = body;

    const { data, error } = await supabase
      .from('students')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// DELETE /api/students/:id
// Not: Admin panelinden gelen silme istekleri için kullanılır.
// ⚠️ SADECE ADMIN ROLÜ SİLEBİLİR!
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Öğrenci ID bulunamadı.' },
        { status: 400 }
      );
    }

    // ========= ADMIN YETKİ KONTROLÜ =========
    // Request'ten kullanıcı rolünü al (header veya cookie'den)
    const userRole = req.headers.get('X-User-Role');
    
    // Eğer rol bilgisi yoksa veya admin değilse, erişimi reddet
    if (!userRole || userRole.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu işlem için yetkiniz yok. Sadece admin kullanıcılar öğrenci silebilir.' 
        },
        { status: 403 }
      );
    }
    // ========================================

    const supabase = getServiceRoleClient();

    // Önce ilişkili verileri sil (cascade olmayan tablolar için)
    // 1. Taksitleri sil
    await supabase
      .from('finance_installments')
      .delete()
      .eq('student_id', id);

    // 2. Kayıtları sil
    await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', id);

    // 3. Finans loglarını sil
    await supabase
      .from('finance_logs')
      .delete()
      .eq('student_id', id);

    // 4. Öğrenciyi sil
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Öğrenci başarıyla silindi.' }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}



