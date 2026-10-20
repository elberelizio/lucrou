import { NextRequest, NextResponse } from 'next/server';

// middleware.ts — runs on the server BEFORE any page or API route is processed
// This is the first line of defence for the admin panel
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block empty user-agent requests to admin routes (bots, scrapers)
  if (pathname.startsWith('/admin-secret') || pathname.startsWith('/api/admin')) {
    const userAgent = request.headers.get('user-agent');
    if (!userAgent) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only run this middleware on admin routes — not on every page (performance)
  matcher: ['/admin-secret/:path*', '/api/admin/:path*'],
};
