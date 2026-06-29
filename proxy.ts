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

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const role = (token?.role as string) ?? ''

  // ── Admin public ────────────────────────────────────────────────────────
  if (ADMIN_PUBLIC.some((r) => pathname.startsWith(r))) {
    if (role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    return NextResponse.next()
  }

  // ── Admin protected ──────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (role !== 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin/login', req.url))
    return NextResponse.next()
  }

  // ── Public routes ────────────────────────────────────────────────────────
  if (PUBLIC_ROUTES.some((r) => pathname === r || (r !== '/' && pathname.startsWith(r)))) {
    if (token && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL(defaultRoute(role), req.url))
    }
    return NextResponse.next()
  }

  // ── Invite (public) ──────────────────────────────────────────────────────
  if (pathname.startsWith(INVITE_PREFIX)) return NextResponse.next()

  // ── All other routes require auth ────────────────────────────────────────
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Redirect restricted roles away from /dashboard ───────────────────────
  if (pathname === '/dashboard') {
    if (role === 'KITCHEN') return NextResponse.redirect(new URL('/kitchen', req.url))
    if (role === 'CASHIER') return NextResponse.redirect(new URL('/check-order', req.url))
    if (role === 'WAITER') return NextResponse.redirect(new URL('/new-order', req.url))
  }

  // ── Role-based route guards ──────────────────────────────────────────────
  if (!checkRoutePermission(pathname, role)) {
    return NextResponse.redirect(new URL(defaultRoute(role), req.url))
  }

  return NextResponse.next()
}

function defaultRoute(role: string): string {
  if (role === 'KITCHEN') return '/kitchen'
  if (role === 'CASHIER') return '/check-order'
  if (role === 'WAITER') return '/new-order'
  return '/dashboard'
}

function checkRoutePermission(pathname: string, role: string): boolean {
  // Roles that have full restaurant access
  const isOwnerOrManager = ['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(role)
  const isOwner = ['OWNER', 'SUPER_ADMIN'].includes(role)

  // CASHIER: only /check-order
  if (role === 'CASHIER') {
    return pathname.startsWith('/check-order')
  }

  // KITCHEN: only /kitchen, /menu (view), /inventory
  if (role === 'KITCHEN') {
    return (
      pathname.startsWith('/kitchen') ||
      pathname.startsWith('/menu') ||
      pathname.startsWith('/inventory')
    )
  }

  // WAITER: new-order, orders, kitchen (to mark served), check-order, customers
  if (role === 'WAITER') {
    const allowed = ['/new-order', '/orders', '/kitchen', '/check-order', '/customers']
    return allowed.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
  }

  // MANAGER + OWNER: most things, owner-only gates below
  if (pathname.startsWith('/settings/gst') && !isOwner) return false
  if (pathname.startsWith('/settings/team') && !isOwnerOrManager) return false
  if (pathname.startsWith('/settings') && !isOwnerOrManager) return false
  if (pathname.startsWith('/reports') && !isOwnerOrManager) return false
  if (pathname.startsWith('/menu') && !isOwnerOrManager) return false
  if (pathname.startsWith('/inventory') && !isOwnerOrManager) return false

  return true
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
