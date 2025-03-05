import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from './lib/supabase/server';

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  try {
    const supabase = createMiddlewareClient(
      request.cookies,
      response.cookies,
    );

    const { data: { user } } = await supabase.auth.getUser();

    const isAuthPage =
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/register');

    if (user && isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (!user && !isAuthPage && request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
  } catch (e) {
    console.error('Middleware error:', e);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (getServerSideProps data)
     * - favicon.ico (favicon file)
     * - public folder files
     * - fonts folder files
     * - images folder files
     * - assets folder files
     * - api routes that don't require auth
     * - manifest files (manifest.json, site.webmanifest)
     * - robots.txt
     * - sitemap files (sitemap.xml)
     */
    '/((?!_next/static|_next/image|_next/data|favicon.ico|public|fonts|images|assets|api/public|manifest.json|site.webmanifest|robots.txt|sitemap).*)',
  ],
};
