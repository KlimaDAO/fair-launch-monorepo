import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('wagmi.store');
  const { pathname } = request.nextUrl;

  if (!cookie || cookie === undefined) {
    if (pathname === '/my-rewards' || pathname === '/protocol') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return;
  };

  const cookieValue = JSON.parse(cookie.value);
  const totalConnections = cookieValue?.state?.connections?.value?.length ?? 0;

  if (totalConnections === 0 && pathname !== '/') {
    //   // if no connections exist, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  } else if (totalConnections > 0 && pathname === '/') {
    // if connections exist, redirect to my rewards
    return NextResponse.redirect(new URL('/my-rewards', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map|ttf)$).*)',
    '/', // Explicitly include the root path
  ],
};