import type { Metadata } from 'next'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  UtensilsCrossed, Receipt, BarChart3, Package, Users, TableProperties,
  MessageSquare, ShieldCheck, Zap, ChevronRight, Crown, BriefcaseBusiness,
  ConciergeBell, Landmark, CheckCircle2, TrendingUp, Clock, IndianRupee,
  FileText, Bell, Search, Settings, Star, ArrowRight, ChefHat,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'DineFlow — Restaurant POS & Management Software for Indian Restaurants',
  description:
    'DineFlow is a cloud-based Restaurant POS and Management SaaS for Indian restaurants. GST billing, order management, inventory tracking, staff roles, and analytics — all in one platform. Built by Kuzhandayan K V.',
  keywords: [
    'restaurant POS India', 'restaurant management software India',
    'GST billing software restaurant', 'cloud POS India',
    'dine-in order management', 'DineFlow', 'Kuzhandayan', 'Kuzhandayan K V',
  ],
}

const JSON_LD_SOFTWARE = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DineFlow',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Cloud-based Restaurant POS and Management SaaS for Indian restaurants.',
  author: { '@type': 'Person', name: 'Kuzhandayan K V', email: 'sabbari.kv013@gmail.com' },
  creator: { '@type': 'Person', name: 'Kuzhandayan K V', email: 'sabbari.kv013@gmail.com', alternateName: ['Kuzhandayan', 'sabbari'] },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
}

const JSON_LD_PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Kuzhandayan K V',
  alternateName: ['Kuzhandayan', 'sabbari'],
  email: 'sabbari.kv013@gmail.com',
  jobTitle: 'Full Stack Developer',
  description: 'Full Stack Developer and creator of DineFlow.',
}

export default function HomePage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[rgb(var(--df-bg))] text-[rgb(var(--df-text))] overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SOFTWARE) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_PERSON) }} />

      {/* ── NAV ── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
        <nav className="bg-[rgb(var(--df-card))]/80 backdrop-blur-xl border border-[rgb(var(--df-border))] rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[rgb(var(--df-accent))] flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-[rgb(var(--df-accent))] tracking-tight text-lg">DineFlow</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-[13px] text-[rgb(var(--df-text-2))]">
            <a href="#features" className="hover:text-[rgb(var(--df-text))] transition-colors">Features</a>
            <a href="#roles" className="hover:text-[rgb(var(--df-text))] transition-colors">Roles</a>
            <a href="#about" className="hover:text-[rgb(var(--df-text))] transition-colors">About</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/login" className="px-4 py-2 text-[13px] font-medium bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl transition-all shadow-lg shadow-[rgb(99,102,241)]/25">
              Admin Login
            </Link>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[rgb(var(--df-accent))]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--df-accent))]/10 border border-[rgb(var(--df-accent))]/25 rounded-full text-[12px] text-[rgb(var(--df-accent))] font-semibold mb-6 tracking-wide uppercase">
            <Zap className="w-3 h-3" />
            Cloud POS Built for India
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            The Smarter POS for<br />
            <span className="text-[rgb(var(--df-accent))]">Modern Restaurants</span>
          </h1>

          <p className="text-[rgb(var(--df-text-2))] text-lg sm:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
            Orders, GST billing, inventory, reports, staff management — everything your restaurant needs in one powerful platform. Start managing smarter today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl font-semibold text-[15px] transition-all shadow-2xl shadow-[rgb(99,102,241)]/30 hover:shadow-[rgb(99,102,241)]/50 hover:-translate-y-0.5">
              Sign In to Your Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="mailto:sabbari.kv013@gmail.com" className="inline-flex items-center gap-2 px-7 py-3.5 bg-[rgb(var(--df-card))] hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text))] rounded-xl font-semibold text-[15px] transition-all border border-[rgb(var(--df-border))] hover:-translate-y-0.5">
              Contact to Get Started
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[rgb(var(--df-card))]/60 backdrop-blur-sm border border-[rgb(var(--df-border))] rounded-2xl p-4">
                <p className="text-2xl font-black text-[rgb(var(--df-accent))]">{s.value}</p>
                <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOCK DASHBOARD PREVIEW ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[rgb(var(--df-border))] bg-[rgb(var(--df-surface-2))]">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="ml-3 text-[12px] text-[rgb(var(--df-text-3))] font-mono">dineflow.vercel.app/dashboard</div>
            </div>
            {/* Mock dashboard content */}
            <div className="p-5 grid grid-cols-4 gap-4 bg-[rgb(var(--df-bg))]">
              {/* Sidebar mock */}
              <div className="col-span-1 bg-[rgb(var(--df-card))] rounded-2xl p-4 space-y-2 hidden sm:block">
                <div className="w-24 h-6 bg-[rgb(var(--df-accent))]/20 rounded-lg mb-4" />
                {['Dashboard','Orders','New Order','Menu','Inventory','Reports'].map((item) => (
                  <div key={item} className={`px-3 py-2 rounded-xl text-[11px] font-medium ${item === 'Orders' ? 'bg-[rgb(var(--df-accent))]/15 text-[rgb(var(--df-accent))]' : 'text-[rgb(var(--df-text-3))]'}`}>
                    {item}
                  </div>
                ))}
              </div>
              {/* Main content mock */}
              <div className="col-span-4 sm:col-span-3 space-y-4">
                {/* Stat cards row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Today's Revenue", val: '₹24,850', color: 'text-green-400' },
                    { label: 'Active Orders', val: '12', color: 'text-blue-400' },
                    { label: 'Pending Bills', val: '3', color: 'text-yellow-400' },
                  ].map((card) => (
                    <div key={card.label} className="bg-[rgb(var(--df-card))] rounded-xl p-3 border border-[rgb(var(--df-border))]">
                      <p className="text-[10px] text-[rgb(var(--df-text-3))]">{card.label}</p>
                      <p className={`text-lg font-bold mt-0.5 ${card.color}`}>{card.val}</p>
                    </div>
                  ))}
                </div>
                {/* Order rows mock */}
                <div className="bg-[rgb(var(--df-card))] rounded-xl border border-[rgb(var(--df-border))] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[rgb(var(--df-border))] text-[11px] font-semibold text-[rgb(var(--df-text-2))]">Recent Orders</div>
                  {[
                    { num: 'ORD-00042', table: 'T-4', status: 'In Progress', amt: '₹780', color: 'text-blue-400 bg-blue-400/10' },
                    { num: 'ORD-00041', table: 'Parcel', status: 'Ready', amt: '₹1,240', color: 'text-purple-400 bg-purple-400/10' },
                    { num: 'ORD-00040', table: 'T-2', status: 'Served', amt: '₹560', color: 'text-green-400 bg-green-400/10' },
                  ].map((row) => (
                    <div key={row.num} className="flex items-center justify-between px-4 py-2.5 border-b border-[rgb(var(--df-border))]/50 last:border-0">
                      <span className="text-[11px] font-medium text-[rgb(var(--df-accent))]">{row.num}</span>
                      <span className="text-[11px] text-[rgb(var(--df-text-3))]">{row.table}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.color}`}>{row.status}</span>
                      <span className="text-[11px] font-bold">{row.amt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-full text-[12px] text-[rgb(var(--df-text-2))] font-medium mb-4">
              <Star className="w-3 h-3 text-[rgb(var(--df-accent))]" />
              Everything Included
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">All features. Zero compromise.</h2>
            <p className="text-[rgb(var(--df-text-2))] text-[15px] max-w-xl mx-auto">
              From the first order to your monthly GST report — every tool your restaurant needs is built in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`group relative bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5 hover:border-[rgb(var(--df-accent))]/50 hover:shadow-xl hover:shadow-[rgb(var(--df-accent))]/5 transition-all hover:-translate-y-1 ${i === 0 ? 'sm:col-span-2' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-[rgb(var(--df-accent))]/10 border border-[rgb(var(--df-accent))]/20 flex items-center justify-center mb-4 group-hover:bg-[rgb(var(--df-accent))]/20 transition-colors">
                  <f.icon className="w-5 h-5 text-[rgb(var(--df-accent))]" />
                </div>
                <h3 className="font-bold text-[15px] mb-2">{f.title}</h3>
                <p className="text-[rgb(var(--df-text-2))] text-[13px] leading-relaxed">{f.description}</p>
                {f.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {f.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-[rgb(var(--df-accent))]/10 text-[rgb(var(--df-accent))] rounded-full border border-[rgb(var(--df-accent))]/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GST HIGHLIGHT ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-[rgb(var(--df-accent))]/10 via-[rgb(var(--df-card))] to-[rgb(var(--df-card))] border border-[rgb(var(--df-accent))]/25 rounded-3xl p-8 sm:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[rgb(var(--df-accent))]/8 rounded-full blur-3xl pointer-events-none" />
            <div className="relative grid sm:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--df-accent))]/15 border border-[rgb(var(--df-accent))]/30 rounded-full text-[12px] text-[rgb(var(--df-accent))] font-semibold mb-4">
                  <Receipt className="w-3 h-3" />
                  GST-Compliant Billing
                </div>
                <h2 className="text-3xl font-black mb-4">Auto GST invoices.<br />Every order.</h2>
                <p className="text-[rgb(var(--df-text-2))] text-[14px] leading-relaxed mb-6">
                  CGST + SGST calculated per item based on HSN codes. Professional tax invoices generated instantly — print or share as PDF.
                </p>
                <div className="space-y-2.5">
                  {GST_POINTS.map((pt) => (
                    <div key={pt} className="flex items-center gap-2.5 text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-[rgb(var(--df-accent))] flex-shrink-0" />
                      <span className="text-[rgb(var(--df-text-2))]">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* GST Bill mock */}
              <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5 shadow-2xl">
                <div className="text-center border-b border-[rgb(var(--df-border))] pb-3 mb-3">
                  <p className="font-bold text-[14px]">Spice Garden Restaurant</p>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))]">GSTIN: 33ABCDE1234F1Z5</p>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))]">Tax Invoice · ORD-00042</p>
                </div>
                <div className="space-y-1.5 text-[12px] border-b border-[rgb(var(--df-border))] pb-3 mb-3">
                  {[
                    { name: 'Paneer Butter Masala ×2', amt: '₹480', gst: '5%' },
                    { name: 'Masala Chai ×3', amt: '₹120', gst: '5%' },
                    { name: 'Veg Biryani ×1', amt: '₹220', gst: '5%' },
                  ].map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span className="text-[rgb(var(--df-text-2))]">{item.name}</span>
                      <div className="flex gap-3">
                        <span className="text-[rgb(var(--df-text-3))] text-[10px]">GST {item.gst}</span>
                        <span className="font-medium">{item.amt}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-[12px]">
                  <div className="flex justify-between text-[rgb(var(--df-text-3))]"><span>Subtotal</span><span>₹820</span></div>
                  <div className="flex justify-between text-[rgb(var(--df-text-3))]"><span>CGST (2.5%)</span><span>₹20.50</span></div>
                  <div className="flex justify-between text-[rgb(var(--df-text-3))]"><span>SGST (2.5%)</span><span>₹20.50</span></div>
                  <div className="flex justify-between font-black text-[14px] pt-2 border-t border-[rgb(var(--df-border))]">
                    <span>Grand Total</span>
                    <span className="text-[rgb(var(--df-accent))]">₹861.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" className="py-20 px-6 bg-[rgb(var(--df-surface))]/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-full text-[12px] text-[rgb(var(--df-text-2))] font-medium mb-4">
              <ShieldCheck className="w-3 h-3 text-[rgb(var(--df-accent))]" />
              Role-Based Access
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">The right access for every team member</h2>
            <p className="text-[rgb(var(--df-text-2))] text-[15px] max-w-xl mx-auto">
              Five distinct roles — each with precisely scoped permissions. No more, no less.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ROLES.map((r) => (
              <div key={r.role} className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5 hover:border-[rgb(var(--df-accent))]/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[rgb(var(--df-accent))]/10 border border-[rgb(var(--df-accent))]/20 flex items-center justify-center mb-4">
                  <r.icon className="w-5 h-5 text-[rgb(var(--df-accent))]" />
                </div>
                <p className="font-black text-[16px] text-[rgb(var(--df-accent))] mb-1">{r.role}</p>
                <p className="text-[12px] text-[rgb(var(--df-text-3))] mb-4">{r.tagline}</p>
                <div className="space-y-1.5">
                  {r.perms.map((p) => (
                    <div key={p} className="flex items-center gap-2 text-[12px] text-[rgb(var(--df-text-2))]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--df-accent))]" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[13px] text-[rgb(var(--df-text-3))] mt-8">
            All restaurant staff sign in at{' '}
            <Link href="/login" className="text-[rgb(var(--df-accent))] hover:underline font-medium">/login</Link>.
            {' '}Platform admin at{' '}
            <Link href="/admin/login" className="text-[rgb(var(--df-accent))] hover:underline font-medium">/admin/login</Link>.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Up and running in minutes</h2>
            <p className="text-[rgb(var(--df-text-2))] text-[15px]">Three steps to a fully operational restaurant POS.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(50%+2rem)] w-full h-px border-t border-dashed border-[rgb(var(--df-border))] z-0" />
                )}
                <div className="relative bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-6 text-center hover:border-[rgb(var(--df-accent))]/40 transition-all">
                  <div className="w-10 h-10 rounded-full bg-[rgb(var(--df-accent))] text-white font-black text-[15px] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[rgb(99,102,241)]/30">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-[15px] mb-2">{step.title}</h3>
                  <p className="text-[rgb(var(--df-text-2))] text-[13px] leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-[rgb(var(--df-accent))] rounded-3xl p-10 sm:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/30 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Want DineFlow for your restaurant?</h2>
              <p className="text-indigo-100 text-[15px] mb-3 max-w-lg mx-auto">
                Reach out and we&apos;ll get your restaurant set up. GST billing, orders, and reports — ready from day one.
              </p>
              <p className="text-white/80 text-[13px] mb-8">Onboarding is handled directly by the DineFlow team.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="mailto:sabbari.kv013@gmail.com" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[rgb(var(--df-accent))] hover:bg-indigo-50 rounded-xl font-bold text-[15px] transition-all shadow-xl hover:-translate-y-0.5">
                  sabbari.kv013@gmail.com
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-16 px-6 border-t border-[rgb(var(--df-border))]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-3">About DineFlow</h2>
          <p className="text-[rgb(var(--df-text-2))] text-[14px] leading-relaxed">
            DineFlow is a multi-tenant restaurant POS and management SaaS built by{' '}
            <strong className="text-[rgb(var(--df-text))]">Kuzhandayan K V</strong>.
            Each restaurant gets a fully isolated workspace — your data is never shared with anyone.
            Built on Next.js, Prisma, and Supabase — fast, reliable, and GST-ready.
          </p>
          <p className="mt-3 text-[12px] text-[rgb(var(--df-text-3))]">
            Contact:{' '}
            <a href="mailto:sabbari.kv013@gmail.com" className="text-[rgb(var(--df-accent))] hover:underline">
              sabbari.kv013@gmail.com
            </a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-[rgb(var(--df-border))]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[rgb(var(--df-accent))] flex items-center justify-center">
              <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-[rgb(var(--df-accent))] tracking-tight">DineFlow</span>
          </div>
          <p className="text-[12px] text-[rgb(var(--df-text-3))] text-center">
            Built with ♥ by <span className="text-[rgb(var(--df-text-2))] font-medium">Kuzhandayan K V</span>
          </p>
          <div className="flex gap-5 text-[12px] text-[rgb(var(--df-text-3))]">
            <a href="mailto:sabbari.kv013@gmail.com" className="hover:text-[rgb(var(--df-accent))] transition-colors">Contact</a>
            <Link href="/admin/login" className="hover:text-[rgb(var(--df-accent))] transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const STATS = [
  { value: '4', label: 'Staff Roles' },
  { value: 'GST', label: 'CGST + SGST Auto' },
  { value: '∞', label: 'Orders & Items' },
  { value: '100%', label: 'Data Isolated' },
]

const GST_POINTS = [
  'CGST + SGST split per item rate',
  'HSN code support for all menu items',
  'Print PDF invoices with your branding',
  'Monthly GST summary for your accountant',
  'All totals stored — subtotal, GST, grand total',
]

const FEATURES: { icon: LucideIcon; title: string; description: string; tags?: string[] }[] = [
  {
    icon: UtensilsCrossed,
    title: 'Order Management',
    description: 'Create dine-in and parcel orders with a guided 4-step wizard. Assign tables, search customers by name or phone, add items from your menu, and place orders in seconds.',
    tags: ['Dine-In', 'Parcel', 'Table Assign', 'Customer Search'],
  },
  {
    icon: Receipt,
    title: 'GST Tax Invoices',
    description: 'Auto-calculated CGST + SGST per item. Generate and print professional tax invoices branded with your restaurant details.',
  },
  {
    icon: Package,
    title: 'Inventory Control',
    description: 'Track stock levels with low-stock alerts. Know exactly when to reorder before you run out.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Revenue trends, top-selling items, daily GST summaries, and monthly charts — all in one place.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Maintain a customer database with full order history. Quickly search returning guests.',
  },
  {
    icon: TableProperties,
    title: 'Table Management',
    description: 'Visual table grid for dine-in orders. Waiters pick the exact table — no confusion.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    description: 'Owner, Manager, Waiter, Kitchen, Cashier — each role has precisely scoped permissions.',
  },
  {
    icon: MessageSquare,
    title: 'Community & Support',
    description: 'Group chat for all restaurants plus direct private chat with DineFlow admin for support.',
  },
  {
    icon: Bell,
    title: 'Announcements',
    description: 'Platform-wide announcements from the admin — updates, features, and alerts.',
  },
  {
    icon: Search,
    title: 'Check Order Lookup',
    description: 'Search any order by number or partial text. Instant results with full detail modal.',
  },
  {
    icon: FileText,
    title: 'Staff Invite System',
    description: 'Invite team members by email with a single click. They set their own password.',
  },
  {
    icon: Settings,
    title: 'Full Settings Control',
    description: 'Restaurant profile, GST configuration, table setup, and team management — all in one place.',
  },
]

const ROLES: { icon: LucideIcon; role: string; tagline: string; perms: string[] }[] = [
  {
    icon: Crown,
    role: 'Owner',
    tagline: 'Full control of everything',
    perms: ['All orders & billing', 'GST & tax settings', 'Team management', 'Full reports & revenue', 'Restaurant settings'],
  },
  {
    icon: BriefcaseBusiness,
    role: 'Manager',
    tagline: 'Ops without billing config',
    perms: ['Orders & menu management', 'Inventory control', 'Reports access', 'Staff management', 'No GST settings'],
  },
  {
    icon: ConciergeBell,
    role: 'Waiter',
    tagline: 'Floor operations only',
    perms: ['Create new orders', 'Assign tables', 'View order status', 'Customer lookup', 'No settings access'],
  },
  {
    icon: ChefHat,
    role: 'Kitchen',
    tagline: 'Kitchen display only',
    perms: ['Live kitchen order queue', 'View menu items', 'View stock levels', 'No billing access', 'No settings access'],
  },
  {
    icon: Landmark,
    role: 'Cashier',
    tagline: 'Billing & payment',
    perms: ['Process payments', 'Check order status', 'Print tax invoices', 'Check order lookup', 'No menu editing'],
  },
]

const STEPS = [
  {
    title: 'Contact us to onboard',
    detail: 'Reach out to sabbari.kv013@gmail.com. We create your restaurant workspace with default menu, tables, and inventory ready to go.',
  },
  {
    title: 'Set up menu & GST rates',
    detail: 'Add your menu items with HSN codes and GST rates. Every invoice will be compliant from order one.',
  },
  {
    title: 'Invite your team & go live',
    detail: 'Invite staff by email with the right roles. Start taking orders, printing bills, and tracking inventory.',
  },
]
