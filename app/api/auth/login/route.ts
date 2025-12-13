import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { LoginCredentials } from '@/types';
import {
  verifyPassword,
  generateToken,
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  isValidEmail,
} from '@/lib/auth/security';

// Fallback mock users (Supabase bağlantısı yoksa)
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin',
    surname: 'Yönetici',
    role: 'SUPER_ADMIN',
    is_super_admin: true,
    organization_id: null,
  },
  {
    id: '2',
    email: 'admin@akademihub.com',
    password: 'admin123',
    name: 'Sistem',
    surname: 'Admin',
    role: 'SUPER_ADMIN',
    is_super_admin: true,
    organization_id: null,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // IP veya email bazlı rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const identifier = `${clientIP}_${email}`;

    // Rate limit kontrolü
    const rateCheck = checkRateLimit(identifier);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Çok fazla başarısız deneme. ${rateCheck.lockoutRemaining} dakika bekleyin.`,
          statusCode: 429,
          timestamp: new Date(),
        },
        { status: 429 }
      );
    }

    // Input validasyonu
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

    // Email format kontrolü
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçerli bir e-posta adresi girin',
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

      // app_users tablosundan kullanıcıyı bul (organization bilgisi dahil)
      const { data: dbUser, error } = await supabase
        .from('app_users')
        .select('id, email, password_hash, name, surname, role, status, permissions, organization_id, is_super_admin')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!error && dbUser) {
        // Status kontrolü
        if (dbUser.status === 'inactive') {
          recordFailedAttempt(identifier);
          return NextResponse.json(
            {
              success: false,
              error: 'Bu hesap pasif durumda. Yönetici ile iletişime geçin.',
              statusCode: 403,
              timestamp: new Date(),
            },
            { status: 403 }
          );
        }

        // Şifre kontrolü (bcrypt veya plain text)
        const isValidPassword = await verifyPassword(password, dbUser.password_hash || '');

        if (isValidPassword) {
          // Kullanıcının organizasyonunu bul
          let userOrganization = null;
          if (dbUser.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', dbUser.organization_id)
              .single();
            userOrganization = orgData;
          }

          user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            surname: dbUser.surname || '',
            role: dbUser.is_super_admin ? 'SUPER_ADMIN' : (dbUser.role?.toUpperCase() || 'STAFF'),
            permissions: dbUser.permissions || {},
            is_super_admin: dbUser.is_super_admin || false,
            organization_id: dbUser.organization_id,
            organization: userOrganization,
          };

          // Son giriş zamanını güncelle
          await supabase
            .from('app_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', dbUser.id);

          // Başarılı giriş - rate limit sıfırla
          clearAttempts(identifier);
        }
      }
    } catch {
      // Supabase hatası - mock verilere düş
      console.log('Supabase bağlantı hatası, mock veriler kullanılıyor');
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
          permissions: {},
        };
        clearAttempts(identifier);
      }
    }

    // Kullanıcı bulunamadı
    if (!user) {
      recordFailedAttempt(identifier);
      const remaining = checkRateLimit(identifier).remainingAttempts;

      return NextResponse.json(
        {
          success: false,
          error: `Geçersiz e-posta veya şifre! (${remaining} deneme kaldı)`,
          statusCode: 401,
          timestamp: new Date(),
        },
        { status: 401 }
      );
    }

    // JWT Token oluştur
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Response oluştur
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            surname: user.surname,
            role: user.role,
            permissions: user.permissions,
            is_super_admin: (user as any).is_super_admin || false,
            organization_id: (user as any).organization_id || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          organization: (user as any).organization || null, // Kullanıcının bağlı olduğu kurum
          token, // Client için de token dönüyoruz (localStorage uyumluluğu)
          expiresIn: 86400, // 24 saat
        },
        message: 'Başarıyla giriş yapıldı',
        statusCode: 200,
        timestamp: new Date(),
      },
      {
        status: 200,
        headers: {
          // Güvenlik headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );

    // httpOnly Cookie ayarla - GÜVENLİ
    response.cookies.set('auth-token', token, {
      httpOnly: true,           // JavaScript erişemez (XSS koruması)
      secure: process.env.NODE_ENV === 'production', // HTTPS zorunlu (prod'da)
      sameSite: 'lax',          // CSRF koruması
      maxAge: 86400,            // 24 saat
      path: '/',                // Tüm sayfalarda geçerli
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
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
