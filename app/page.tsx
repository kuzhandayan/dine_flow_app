import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  UtensilsCrossed,
  Receipt,
  BarChart3,
  Package,
  Users,
  TableProperties,
  MessageSquare,
  ShieldCheck,
  Zap,
  ChevronRight,
  Crown,
  BriefcaseBusiness,
  ConciergeBell,
  Landmark,
} from 'lucide-react'

export default function HomePage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[rgb(var(--df-bg))] text-[rgb(var(--df-text))]">
      {/* Floating Nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
        <nav className="bg-[rgb(var(--df-card))]/90 backdrop-blur-md border border-[rgb(var(--df-border))] rounded-2xl px-4 py-3 flex items-center justify-between shadow-xl shadow-black/20">
          <span className="font-extrabold text-[rgb(var(--df-accent))] tracking-tight text-lg">
            DineFlow
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-[13px] font-medium text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))] hover:bg-[rgb(var(--df-surface-2))] rounded-xl transition-all"
            >
              Restaurant Staff
            </Link>
            <Link
              href="/admin/login"
              className="px-4 py-2 text-[13px] font-medium bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl transition-all"
            >
              Admin Login
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--df-accent))]/10 border border-[rgb(var(--df-accent))]/25 rounded-full text-[12px] text-[rgb(var(--df-accent))] font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Built for Indian Restaurants
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
            The Smarter POS for{' '}
            <span className="text-[rgb(var(--df-accent))]">Modern Restaurants</span>
          </h1>
          <p className="text-[rgb(var(--df-text-2))] text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
            DineFlow gives your restaurant a complete point-of-sale system — orders, GST billing,
            inventory, reports, and staff management — all in one streamlined platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl font-medium text-[14px] transition-all shadow-lg shadow-orange-500/20"
            >
              Sign in to your restaurant
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[rgb(var(--df-surface-2))] hover:bg-[rgb(var(--df-border))] text-[rgb(var(--df-text))] rounded-xl font-medium text-[14px] transition-all border border-[rgb(var(--df-border))]"
            >
              Register your restaurant
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Everything your restaurant needs</h2>
            <p className="text-[rgb(var(--df-text-2))] text-[14px]">
              From taking orders to printing GST-compliant tax invoices — all features included.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5 hover:border-[rgb(var(--df-accent))]/40 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-[rgb(var(--df-accent))]/10 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-[rgb(var(--df-accent))]" />
                </div>
                <h3 className="font-semibold text-[14px] mb-1.5">{f.title}</h3>
                <p className="text-[rgb(var(--df-text-2))] text-[12.5px] leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Uses It */}
      <section className="py-16 px-6 bg-[rgb(var(--df-surface))]/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Built for every role in your restaurant</h2>
          <p className="text-[rgb(var(--df-text-2))] text-[14px] mb-10">
            Different team members get the right access — no more, no less.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((r) => (
              <div
                key={r.role}
                className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5"
              >
                <div className="w-9 h-9 rounded-xl bg-[rgb(var(--df-accent))]/10 flex items-center justify-center mb-3">
                  <r.icon className="w-5 h-5 text-[rgb(var(--df-accent))]" />
                </div>
                <h3 className="font-bold text-[14px] mb-1 text-[rgb(var(--df-accent))]">
                  {r.role}
                </h3>
                <p className="text-[rgb(var(--df-text-2))] text-[12px] leading-relaxed">
                  {r.scope}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[rgb(var(--df-text-2))] text-[13px]">
            All restaurant staff (Owner, Manager, Waiter, Cashier) sign in at{' '}
            <Link href="/login" className="text-[rgb(var(--df-accent))] hover:underline">
              /login
            </Link>
            . The DineFlow platform admin signs in at{' '}
            <Link href="/admin/login" className="text-[rgb(var(--df-accent))] hover:underline">
              /admin/login
            </Link>
            .
          </p>
        </div>
      </section>

      {/* How to Optimise */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">How to get the most out of DineFlow</h2>
            <p className="text-[rgb(var(--df-text-2))] text-[14px]">
              Follow these steps to run a leaner, faster restaurant operation.
            </p>
          </div>
          <div className="space-y-4">
            {OPTIMISE_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex gap-4 bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgb(var(--df-accent))] text-white text-[13px] font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-[14px] mb-1">{step.title}</h3>
                  <p className="text-[rgb(var(--df-text-2))] text-[12.5px]">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 px-6 bg-[rgb(var(--df-surface))]/50">
        <div className="max-w-2xl mx-auto text-center">
          <ShieldCheck className="w-10 h-10 text-[rgb(var(--df-accent))] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">About DineFlow</h2>
          <p className="text-[rgb(var(--df-text-2))] text-[14px] leading-relaxed">
            DineFlow is a multi-tenant restaurant POS and management SaaS. Each restaurant gets a
            fully isolated workspace — your data is never mixed with another restaurant&apos;s.
            Built on Next.js 16, Prisma, and hosted on Supabase, it&apos;s fast, reliable, and GST-ready
            from day one.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[rgb(var(--df-border))]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-extrabold text-[rgb(var(--df-accent))] tracking-tight">
            DineFlow
          </span>
          <p className="text-[12px] text-[rgb(var(--df-text-3))] text-center">
            Built &amp; maintained by{' '}
            <span className="text-[rgb(var(--df-text-2))] font-medium">Kuzhandayan K V</span>
          </p>
          <div className="flex gap-4 text-[12px] text-[rgb(var(--df-text-3))]">
            <Link href="/login" className="hover:text-[rgb(var(--df-accent))] transition-colors">
              Restaurant Login
            </Link>
            <Link
              href="/admin/login"
              className="hover:text-[rgb(var(--df-accent))] transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: 'Order Management',
    description:
      'Create dine-in and parcel orders with a guided 4-step wizard. Assign tables, search customers, and build orders from your menu.',
  },
  {
    icon: Receipt,
    title: 'GST Tax Invoices',
    description:
      'Auto-calculated CGST + SGST per item rate. Generate and print professional tax invoices as PDFs branded with your restaurant details.',
  },
  {
    icon: Package,
    title: 'Inventory Control',
    description:
      'Track stock levels with low-stock alerts. Know exactly when to reorder before you run out of ingredients.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description:
      'Revenue trends, top-selling items, daily GST summaries, and monthly charts — all in one place.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description:
      'Maintain a customer database with order history. Quickly search returning guests when placing new orders.',
  },
  {
    icon: TableProperties,
    title: 'Table Management',
    description:
      'Visual table grid for dine-in orders. Waiters select the exact table they are serving — no confusion.',
  },
  {
    icon: MessageSquare,
    title: 'Community & Support Chat',
    description:
      'Group chat room for all restaurants to share feedback. Direct private chat with DineFlow admin for support.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    description:
      'Owner, Manager, Waiter, Cashier — each role sees only what they need. Invite staff via email with one click.',
  },
]

const ROLES: { icon: LucideIcon; role: string; scope: string }[] = [
  {
    icon: Crown,
    role: 'Owner',
    scope: 'Full access — settings, GST, team, all reports, billing.',
  },
  {
    icon: BriefcaseBusiness,
    role: 'Manager',
    scope: 'Orders, menu, inventory, reports, team management. Cannot change GST settings.',
  },
  {
    icon: ConciergeBell,
    role: 'Waiter',
    scope: 'Create and view orders, assign tables. No settings access.',
  },
  {
    icon: Landmark,
    role: 'Cashier',
    scope: 'Process payments, check order status, print bills.',
  },
]

const OPTIMISE_STEPS = [
  {
    title: 'Set up your menu with correct GST rates',
    detail:
      'Go to Settings → GST, then add all your menu items with accurate HSN codes and GST rates. This ensures every tax invoice is compliant.',
  },
  {
    title: 'Add your tables',
    detail:
      'Go to Settings → Tables and add all dine-in tables. Waiters will pick from this grid when creating orders — reducing mix-ups.',
  },
  {
    title: 'Invite your team',
    detail:
      'Go to Settings → Team and invite staff by email. Assign them the right role so access is limited to what they need.',
  },
  {
    title: 'Track inventory daily',
    detail:
      'Update stock levels each morning. DineFlow flags items below minimum stock so you can reorder before service.',
  },
  {
    title: 'Review reports weekly',
    detail:
      'Use the Reports page to spot top-selling items, revenue trends, and GST totals. Share summaries with your accountant.',
  },
]
