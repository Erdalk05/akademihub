import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// JWT Secret (jose kütüphanesi için TextEncoder ile encode edilmeli)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'akademihub_secure_secret_key_2025_!@#$%'
);

// Korunan rotalar - giriş gerektiren sayfalar
const protectedRoutes = [
  '/dashboard',
  '/students',
  '/enrollment',
  '/finance',
  '/settings',
  '/profile',
  '/franchise',
];

// Sadece admin erişebileceği rotalar
const adminOnlyRoutes = [
  '/settings',
  '/franchise',
];

// Sadece admin veya muhasebe erişebileceği rotalar
const financeRoutes = [
  '/finance',
];

// Token doğrulama fonksiyonu
async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { valid: true, payload };
  } catch {
    return { valid: false, payload: null };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public rotalar (her zaman erişilebilir)
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/403' ||
    pathname === '/offline' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Auth kontrolü - httpOnly cookie'den token al
  const authToken = request.cookies.get('auth-token')?.value;
  
  // Korunan rota kontrolü
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Token yoksa login'e yönlendir
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token doğrula
    const { valid, payload } = await verifyJWT(authToken);
    
    if (!valid) {
      // Geçersiz token - cookie'yi sil ve login'e yönlendir
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    // Admin-only rota kontrolü
    const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));
    if (isAdminRoute && payload) {
      const role = (payload as any).role;
      if (role !== 'SUPER_ADMIN' && role !== 'super_admin' && role !== 'ADMIN' && role !== 'admin') {
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }

    // Finance rota kontrolü
    const isFinanceRoute = financeRoutes.some(route => pathname.startsWith(route));
    if (isFinanceRoute && payload) {
      const role = (payload as any).role;
      const allowedRoles = ['SUPER_ADMIN', 'super_admin', 'ADMIN', 'admin', 'ACCOUNTING', 'accounting'];
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }

    // Header'a kullanıcı bilgisi ekle (API'ler için)
    const requestHeaders = new Headers(request.headers);
    if (payload) {
      requestHeaders.set('x-user-id', (payload as any).userId || '');
      requestHeaders.set('x-user-role', (payload as any).role || '');
      requestHeaders.set('x-user-email', (payload as any).email || '');
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - API'ler kendi auth kontrolünü yapar
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};




