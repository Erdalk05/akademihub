import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { LoginCredentials, AuthResponse } from '@/types';

// Fallback mock users (Supabase bağlantısı yoksa)
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin',
    surname: 'Yönetici',
    role: 'ADMIN',
  },
  {
    id: '2',
    email: 'admin@akademihub.com',
    password: 'admin123',
    name: 'Sistem',
    surname: 'Admin',
    role: 'ADMIN',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ve şifre gereklidir',
          statusCode: 400,
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Önce Supabase'den kullanıcıyı kontrol et
    let user = null;
    
    try {
      const supabase = getServiceRoleClient();
      
      // app_users tablosundan kullanıcıyı bul
      const { data: dbUser, error } = await supabase
        .from('app_users')
        .select('id, email, password_hash, name, surname, role, is_active')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .single();

      if (!error && dbUser) {
        // Şifre kontrolü (şimdilik plain text, sonra hash'lenecek)
        // NOT: Gerçek projede bcrypt ile hash karşılaştırması yapılmalı
        if (dbUser.password_hash === password) {
          user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            surname: dbUser.surname || '',
            role: dbUser.role,
          };
          
          // Son giriş zamanını güncelle
          await supabase
            .from('app_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', dbUser.id);
        }
      }
    } catch {
      // Supabase hatası - mock verilere düş
    }

    // Supabase'de bulunamadıysa mock verileri kontrol et
    if (!user) {
      const mockUser = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      if (mockUser) {
        user = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          surname: mockUser.surname,
          role: mockUser.role,
        };
      }
    }

    // Kullanıcı bulunamadı
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz e-posta veya şifre!',
          statusCode: 401,
          timestamp: new Date(),
        },
        { status: 401 }
      );
    }

    // Generate token
    const token = `token_${user.id}_${Date.now()}`;

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token,
      expiresIn: 86400, // 24 hours
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: 'Başarıyla giriş yapıldı',
        statusCode: 200,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Giriş sırasında bir hata oluştu',
        statusCode: 500,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
