import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('wagmi.store');
  if (!cookie) return;

  const cookieValue = JSON.parse(cookie.value);
  const { pathname } = request.nextUrl;
  const totalConnections = cookieValue?.state?.connections?.value?.length;

  if (totalConnections === 0 && pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  } else if (totalConnections > 0 && pathname === '/') {
    return NextResponse.redirect(new URL('/my-rewards', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map|ttf)$).*)',
    '/', // Explicitly include the root path
  ],
};