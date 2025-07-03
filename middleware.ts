import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is authenticated via cookie
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

// Only run middleware for these routes (protect all except static, image, favicon, and public assets)
export const config = {
  matcher: [
    // Exclude Next.js internals and public assets
    '/((?!_next/static|_next/image|favicon.ico|logo.png|logo1.png|apml-logo.png|textures|public|api/auth/gen-otp|api/auth/verify-otp|api/auth/logout|login).*)',
    '/', // Protect homepage
  ],
}; 