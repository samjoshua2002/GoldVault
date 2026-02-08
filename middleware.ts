import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check if the path is a public asset or the login page itself
    const isPublicPath = path === '/login' || path.startsWith('/video') || path.startsWith('/_next') || path.startsWith('/api/auth/login');

    const token = request.cookies.get('auth_token')?.value;

    // If trying to access login page while already logged in, redirect to dashboard
    if (path === '/login' && token === 'logged_in_valid_token') {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    // If trying to access protected route without token, redirect to login
    if (!isPublicPath && token !== 'logged_in_valid_token') {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
