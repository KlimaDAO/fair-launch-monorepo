import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('wagmi.store')!;
  // const parsed = JSON.parse(cookie.value);

  // if (parsed?.state?.connections?.value?.length === 0 && request.nextUrl.pathname !== '/') {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }
  // Allow the request to continue if no redirect is needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map|ttf)$).*)',
    '/', // Explicitly include the root path
  ],
};