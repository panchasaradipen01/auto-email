import { withAuth } from 'next-auth/middleware';

import { NextResponse } from 'next/server';

export default function middleware(req: any, event: any) {
  if (process.env.E2E_TEST === 'true') {
    return NextResponse.next();
  }
  return withAuth({
    pages: { signIn: '/login' },
  })(req, event);
}

export const config = {
  matcher: [
    // Protect all dashboard pages and sub-routes
    '/dashboard/:path*',
    '/templates/:path*',
    '/campaigns/:path*',
    '/csv/:path*',
    '/logs/:path*',
    
    // Protect API endpoints that process authenticated actions
    '/api/csv/:path*',
    '/api/sse/:path*',
  ],
};
