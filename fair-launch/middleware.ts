import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('wagmi.store')!;
  // if (cookie) {
  const parsed = JSON.parse(cookie.value);

  console.log('parsed', parsed.state);
  //   // Perform actions based on the cookie value
  // }

  // // Check if the user is authenticated by checking the cookie
  // if (!!cookie) {
  //   // Redirect from '/' to '/my-rewards' if the request is for the root path
  //   if (request.nextUrl.pathname === '/') {
  //     return NextResponse.redirect(new URL('/my-rewards', request.url));
  //   }
  // } else {
  //   return NextResponse.redirect(new URL('/', request.url));

  // }

  // Allow the request to continue if no redirect is needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/:path*', // Apply middleware to all paths
  ],
};