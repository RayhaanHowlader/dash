import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is authenticated
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/gen-otp', '/api/auth/verify-otp', '/api/auth/logout'];
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If user is not authenticated and trying to access a protected route
  if (!isAuthenticated && !isPublicRoute) {
    // Redirect to login page
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // If user is authenticated and trying to access login page
  if (isAuthenticated && pathname === '/login') {
    // Redirect to dashboard
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
  ],
}; 