import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public rotalar (her zaman erişilebilir)
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/403' ||
    pathname === '/offline' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Auth kontrolü - cookie'den token al
  const authToken = request.cookies.get('auth-token')?.value;
  
  // Korunan rota kontrolü
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !authToken) {
    // Token yoksa - client-side'da kontrol edilecek
    // Middleware'den redirect yapmıyoruz, client RoleContext kontrol edecek
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
