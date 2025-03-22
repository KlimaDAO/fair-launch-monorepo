import { NextResponse, NextRequest } from 'next/server';
import { baseSepolia, sepolia } from 'wagmi/chains';

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('wagmi.store');
  if (!cookie) return;

  const { pathname } = request.nextUrl;
  const cookieValue = JSON.parse(cookie.value);
  const totalConnections = cookieValue?.state?.connections?.value?.length ?? 0;
  const chainId = cookieValue?.state?.chainId;
  console.log('cookieValue', cookieValue);

  if (totalConnections === 0 && pathname !== '/') {
    // if no connections exist, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  } else if (totalConnections > 0 && pathname === '/') {
    // @todo - update to mainnet for launch...
    if (chainId !== baseSepolia.id || chainId !== sepolia.id) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // if connections exist, redirect to my rewards
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