import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password']
const ADMIN_PUBLIC = ['/admin/login']
const INVITE_PREFIX = '/invite'
const AUTH_ROUTES = ['/login', '/register']

const MGMT_ROLES = ['OWNER', 'MANAGER', 'SUPER_ADMIN']
const STAFF_ROLES = ['WAITER', 'KITCHEN', 'CASHIER']

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const role = (token?.role as string) ?? ''
  const permissions = (token?.permissions as string[] | undefined) ?? []

  // ── Admin public ─────────────────────────────────────────────────────────────
  if (ADMIN_PUBLIC.some((r) => pathname.startsWith(r))) {
    if (role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    return NextResponse.next()
  }

  // ── Admin protected ───────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (role !== 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin/login', req.url))
    return NextResponse.next()
  }

  // ── Public routes ─────────────────────────────────────────────────────────────
  if (PUBLIC_ROUTES.some((r) => pathname === r || (r !== '/' && pathname.startsWith(r)))) {
    if (token && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL(defaultRoute(role, permissions), req.url))
    }
    return NextResponse.next()
  }

  // ── Invite (public) ───────────────────────────────────────────────────────────
  if (pathname.startsWith(INVITE_PREFIX)) return NextResponse.next()

  // ── All other routes require auth ─────────────────────────────────────────────
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Staff roles: fully dynamic permission check ───────────────────────────────
  if (STAFF_ROLES.includes(role)) {
    if (!checkPermission(pathname, permissions)) {
      return NextResponse.redirect(new URL(defaultRoute(role, permissions), req.url))
    }
    return NextResponse.next()
  }

  // ── OWNER / MANAGER / SUPER_ADMIN: role-based gates ──────────────────────────
  const isOwner = ['OWNER', 'SUPER_ADMIN'].includes(role)
  const isOwnerOrManager = MGMT_ROLES.includes(role)

  if (pathname.startsWith('/settings/gst') && !isOwner) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (pathname.startsWith('/settings') && !isOwnerOrManager) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (pathname.startsWith('/reports') && !isOwnerOrManager) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

// Pick the first accessible route from permissions, fallback to check-order
function defaultRoute(role: string, permissions: string[]): string {
  if (MGMT_ROLES.includes(role)) return '/dashboard'
  if (permissions.length > 0) return `/${permissions[0]}`
  return '/check-order'
}

// Check if a pathname is covered by the staff's permissions array
function checkPermission(pathname: string, permissions: string[]): boolean {
  return permissions.some((p) => {
    const base = `/${p}`
    return pathname === base || pathname.startsWith(base + '/') || pathname.startsWith(base + '?')
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
