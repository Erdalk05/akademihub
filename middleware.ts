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

  // ---------------------------------------------------------------------------
  // ✅ Guard/Redirect: Bazı kullanıcılar yanlışlıkla "dosya yolu" (app/(dashboard)/...)
  // veya "page.tsx" gibi route olmayan URL'leri açabiliyor.
  // Bu durumda en yakın gerçek route'a yönlendiriyoruz.
  // Örn: /admin/app/(dashboard)/admin/exam-intelligence/sinavlar/[examId]/page.tsx
  //   -> /admin/exam-intelligence/sinavlar
  // ---------------------------------------------------------------------------
  if (pathname.includes('/app/(dashboard)/admin/')) {
    let fixed = pathname;
    fixed = fixed.replace('/admin/app/(dashboard)/admin/', '/admin/').replace('/app/(dashboard)/admin/', '/admin/');
    // "page.tsx" gibi dosya ucu varsa at
    fixed = fixed.replace(/\/page\.tsx$/i, '');
    // Dynamic placeholder segmentleri ([examId] gibi) at → liste sayfasına düşsün
    const parts = fixed.split('/').filter(Boolean).filter((p) => !(p.startsWith('[') && p.endsWith(']')));
    fixed = '/' + parts.join('/');

    if (fixed !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = fixed || '/admin/exam-intelligence';
      return NextResponse.redirect(url, 308);
    }
  }
  
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
