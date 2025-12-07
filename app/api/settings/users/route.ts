import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Tüm kullanıcıları getir
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, name, email, phone, role, status, permissions, last_login, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Yeni kullanıcı ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, password } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Ad ve email zorunlu' }, { status: 400 });
    }

    // Varsayılan yetkiler
    const defaultPermissions: Record<string, any> = {
      admin: {
        finance: { view: true, edit: true, delete: true },
        students: { view: true, edit: true, delete: true },
        reports: { view: true, edit: true, delete: true },
      },
      accountant: {
        finance: { view: true, edit: true, delete: false },
        students: { view: true, edit: false, delete: false },
        reports: { view: true, edit: false, delete: false },
      },
      registrar: {
        finance: { view: true, edit: false, delete: false },
        students: { view: true, edit: true, delete: false },
        reports: { view: true, edit: false, delete: false },
      },
    };

    const { data, error } = await supabase
      .from('app_users')
      .insert({
        name,
        email,
        phone: phone || null,
        role: role || 'registrar',
        status: 'active',
        permissions: defaultPermissions[role || 'registrar'],
        password_hash: password || null, // Şimdilik düz metin - sonra hash eklenecek
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'Bu email zaten kayıtlı' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Kullanıcı güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, phone, role, status, permissions, password } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID zorunlu' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (permissions) updateData.permissions = permissions;

    // Şifre güncelleme - şimdilik düz metin
    if (password) {
      updateData.password_hash = password;
    }

    const { data, error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Kullanıcı sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID zorunlu' }, { status: 400 });
    }

    // Admin sayısını kontrol et
    const { data: admins } = await supabase
      .from('app_users')
      .select('id')
      .eq('role', 'admin');

    const { data: userToDelete } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', id)
      .single();

    if (userToDelete?.role === 'admin' && (admins?.length || 0) <= 1) {
      return NextResponse.json({ success: false, error: 'Son admin kullanıcı silinemez' }, { status: 400 });
    }

    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Kullanıcı silindi' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
