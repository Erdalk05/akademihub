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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _createdAt, student_no: _studentNo, ...updateData } = body;

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
// Soft Delete: Öğrenciyi "deleted" statüsüne alır
// Hard Delete: permanent=true ise kalıcı olarak siler
// ⚠️ SADECE ADMIN ROLÜ SİLEBİLİR!
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

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
          error: 'Bu işlem için yetkiniz yok. Sadece admin kullanıcılar öğrenci silebilir.' 
        },
        { status: 403 }
      );
    }
    // ========================================

    const supabase = getServiceRoleClient();

    if (permanent) {
      // ========= KALICI SİLME (HARD DELETE) =========
      // Önce ilişkili verileri sil
      await supabase.from('finance_installments').delete().eq('student_id', id);
      await supabase.from('enrollments').delete().eq('student_id', id);
      await supabase.from('finance_logs').delete().eq('student_id', id);

      // Öğrenciyi kalıcı olarak sil
      const { error } = await supabase.from('students').delete().eq('id', id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Öğrenci ve tüm verileri kalıcı olarak silindi.' 
      }, { status: 200 });
      
    } else {
      // ========= SOFT DELETE (KAYDI SİLİNEN) =========
      // Öğrenciyi "deleted" statüsüne al
      // Tahsil edilmemiş taksitleri iptal et (cirodan düşsün)
      
      // 1. Önce öğrencinin bilgilerini al
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (!student) {
        return NextResponse.json({ success: false, error: 'Öğrenci bulunamadı' }, { status: 404 });
      }

      // 2. Öğrencinin statüsünü "deleted" yap
      const { error: updateError } = await supabase
        .from('students')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      // 3. Ödenmemiş taksitleri "cancelled" yap (cirodan düşsün)
      const { error: installmentError } = await supabase
        .from('finance_installments')
        .update({
          status: 'cancelled',
          notes: 'Öğrenci kaydı silindi - İptal edildi'
        })
        .eq('student_id', id)
        .eq('is_paid', false);

      if (installmentError) {
        // Log but don't fail - continue with the operation
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Öğrenci kaydı silindi. Tahsil edilen ödemeler korundu.' 
      }, { status: 200 });
    }
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// PATCH /api/students/:id
// Öğrenciyi geri yükle (deleted -> active)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const action = body.action;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Öğrenci ID bulunamadı.' },
        { status: 400 }
      );
    }

    const userRole = req.headers.get('X-User-Role');
    
    if (!userRole || userRole.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için yetkiniz yok.' },
        { status: 403 }
      );
    }

    const supabase = getServiceRoleClient();

    if (action === 'restore') {
      // Öğrenciyi geri yükle
      const { error } = await supabase
        .from('students')
        .update({
          status: 'active',
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // İptal edilen taksitleri tekrar aktif yap
      await supabase
        .from('finance_installments')
        .update({
          status: 'pending',
          notes: null
        })
        .eq('student_id', id)
        .eq('status', 'cancelled');

      return NextResponse.json({ 
        success: true, 
        message: 'Öğrenci kaydı geri yüklendi.' 
      }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz işlem' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
