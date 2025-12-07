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
];

// Sadece admin erişebileceği rotalar
const adminOnlyRoutes = [
  '/settings',
];

// Sadece admin veya muhasebe erişebileceği rotalar
const financeRoutes = [
  '/finance',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public rotalar (her zaman erişilebilir)
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Auth kontrolü için cookie veya header'dan token al
  // Not: Client-side localStorage middleware'de okunamaz
  // Bu nedenle client-side'da da kontrol yapılmalı
  const authToken = request.cookies.get('auth-token')?.value;
  
  // Korunan rota kontrolü
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !authToken) {
    // Token yoksa, client-side kontrole bırak
    // Client tarafında RoleContext ve AuthStore kontrolü yapılacak
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};




