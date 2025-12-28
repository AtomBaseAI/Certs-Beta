import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // For admin routes, check if user has admin role
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const token = req.nextauth.token
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/certificates/:path*',
    '/api/organizations/:path*'
  ]
}