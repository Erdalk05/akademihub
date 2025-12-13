import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Kullanıcı çıkışı - httpOnly cookie'yi siler
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'Başarıyla çıkış yapıldı',
        timestamp: new Date(),
      },
      { status: 200 }
    );

    // httpOnly cookie'yi sil
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Hemen expire
      path: '/',
    });

    // Ek güvenlik: refresh-token varsa onu da sil
    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Çıkış sırasında bir hata oluştu',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * GET ile de çıkış yapılabilir (link ile çıkış için)
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  
  // Cookie'leri sil
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

