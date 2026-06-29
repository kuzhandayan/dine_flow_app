import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password']
const ADMIN_PUBLIC = ['/admin/login']
const INVITE_PREFIX = '/invite'
const AUTH_ROUTES = ['/login', '/register']

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const role = (token?.role as string) ?? ''

  // ── Admin public (login page) ────────────────────────────────────────────
  if (ADMIN_PUBLIC.some((r) => pathname.startsWith(r))) {
    if (role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── Admin protected ──────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.next()
  }

  // ── Public routes (no auth needed) ──────────────────────────────────────
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    if (token && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── Invite (public) ──────────────────────────────────────────────────────
  if (pathname.startsWith(INVITE_PREFIX)) {
    return NextResponse.next()
  }

  // ── All other routes require auth ────────────────────────────────────────
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role-based route guards ──────────────────────────────────────────────
  if (!checkRoutePermission(pathname, role)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

function checkRoutePermission(pathname: string, role: string): boolean {
  const managerRoles = ['OWNER', 'MANAGER', 'SUPER_ADMIN']
  const ownerRoles = ['OWNER', 'SUPER_ADMIN']

  if (pathname.startsWith('/settings/team') && !managerRoles.includes(role)) return false
  if (pathname.startsWith('/settings/gst') && !ownerRoles.includes(role)) return false
  if (pathname.startsWith('/settings/tables') && !managerRoles.includes(role)) return false
  if (pathname.startsWith('/reports') && !managerRoles.includes(role)) return false
  if (pathname.startsWith('/menu') && !managerRoles.includes(role)) return false
  if (pathname.startsWith('/inventory') && !managerRoles.includes(role)) return false
  return true
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
