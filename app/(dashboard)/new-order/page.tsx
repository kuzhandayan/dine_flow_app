'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  UtensilsCrossed, Package, Truck, Search, Plus, Minus, Trash2,
  ChevronRight, ChevronLeft, Users, ShoppingCart, Check, Loader2,
} from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { formatINR } from '@/lib/currency'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Table { id: string; name: string; capacity: number; isActive: boolean }
interface Customer { id: string; name: string; phone: string; email?: string | null }
interface MenuItem { id: string; name: string; price: number; gstRate: number; isVeg: boolean; description?: string | null }
interface Category { id: string; name: string; menuItems: MenuItem[] }

interface CartItem {
  menuItemId: string
  name: string
  price: number
  gstRate: number
  quantity: number
  notes?: string
}

type OrderType = 'DINE_IN' | 'PARCEL' | 'DELIVERY'
type Step = 'type' | 'customer' | 'menu' | 'confirm'

const STEPS: Step[] = ['type', 'customer', 'menu', 'confirm']

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewOrderPage(): React.JSX.Element {
  const router = useRouter()
  const [step, setStep] = useState<Step>('type')

  // Step 1
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [tables, setTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(false)

  // Step 2
  const [customerQuery, setCustomerQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  // Step 3
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [menuSearch, setMenuSearch] = useState('')
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Step 4
  const [placing, setPlacing] = useState(false)
  const [notes, setNotes] = useState('')

  // Load tables on mount
  useEffect(() => {
    setLoadingTables(true)
    fetch('/api/tables')
      .then((r) => r.json())
      .then((d: { tables: Table[] }) => setTables(d.tables.filter((t) => t.isActive)))
      .catch(() => {})
      .finally(() => setLoadingTables(false))
  }, [])

  // Load menu when reaching step 3
  useEffect(() => {
    if (step !== 'menu' || categories.length > 0) return
    setLoadingMenu(true)
    fetch('/api/menu')
      .then((r) => r.json())
      .then((d: { categories: Category[] }) => {
        setCategories(d.categories)
        if (d.categories[0]) setActiveCategory(d.categories[0].id)
      })
      .catch(() => {})
      .finally(() => setLoadingMenu(false))
  }, [step, categories.length])

  // Customer search debounce
  useEffect(() => {
    if (!customerQuery.trim()) { setCustomers([]); return }
    const t = setTimeout(() => {
      setSearchingCustomers(true)
      fetch(`/api/customers?q=${encodeURIComponent(customerQuery)}`)
        .then((r) => r.json())
        .then((d: { customers: Customer[] }) => setCustomers(d.customers))
        .catch(() => {})
        .finally(() => setSearchingCustomers(false))
    }, 300)
    return () => clearTimeout(t)
  }, [customerQuery])

  // ── Cart helpers ────────────────────────────────────────────────────────────

  function addToCart(item: MenuItem): void {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        )
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, gstRate: item.gstRate, quantity: 1 }]
    })
  }

  function removeFromCart(menuItemId: string): void {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId)
      if (!existing) return prev
      if (existing.quantity <= 1) return prev.filter((c) => c.menuItemId !== menuItemId)
      return prev.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c))
    })
  }

  function deleteFromCart(menuItemId: string): void {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId))
  }

  function cartQty(menuItemId: string): number {
    return cart.find((c) => c.menuItemId === menuItemId)?.quantity ?? 0
  }

  // ── Totals ──────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const totalGST = cart.reduce((sum, c) => sum + c.price * c.quantity * (c.gstRate / 100), 0)
  const grandTotal = subtotal + totalGST

  // ── Filtered menu ───────────────────────────────────────────────────────────

  const filteredCategories = menuSearch.trim()
    ? categories.map((cat) => ({
        ...cat,
        menuItems: cat.menuItems.filter((item) =>
          item.name.toLowerCase().includes(menuSearch.toLowerCase()),
        ),
      })).filter((cat) => cat.menuItems.length > 0)
    : categories

  // ── Create customer ─────────────────────────────────────────────────────────

  async function createCustomer(): Promise<void> {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName.trim(), phone: newCustomerPhone.trim() }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Failed')
      }
      const d = await res.json() as { customer: Customer }
      setSelectedCustomer(d.customer)
      setShowNewCustomer(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer')
    }
  }

  // ── Place order ─────────────────────────────────────────────────────────────

  async function placeOrder(): Promise<void> {
    if (!selectedCustomer || cart.length === 0) return
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          type: orderType,
          tableNumber: selectedTable || undefined,
          notes: notes || undefined,
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity, notes: c.notes })),
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Failed to place order')
      }
      const d = await res.json() as { order: { orderNumber: string; id: string } }
      toast.success(`Order ${d.order.orderNumber} placed!`)
      router.push(`/orders`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)

  function goNext(): void {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  function goBack(): void {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  // ── Step validators ─────────────────────────────────────────────────────────

  const canProceedFromType = true
  const canProceedFromCustomer = !!selectedCustomer
  const canProceedFromMenu = cart.length > 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                i < stepIndex
                  ? 'bg-green-500 text-white'
                  : i === stepIndex
                  ? 'bg-[rgb(var(--df-accent))] text-white'
                  : 'bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))]'
              }`}
            >
              {i < stepIndex ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded transition-colors ${i < stepIndex ? 'bg-green-500' : 'bg-[rgb(var(--df-border))]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Order type + table ─────────────────────────────────────────── */}
      {step === 'type' && (
        <div className="space-y-5">
          <h2 className="text-[16px] font-semibold">Order Type</h2>

          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'DINE_IN', label: 'Dine In', icon: UtensilsCrossed },
              { value: 'PARCEL', label: 'Parcel', icon: Package },
              { value: 'DELIVERY', label: 'Delivery', icon: Truck },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setOrderType(value)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                  orderType === value
                    ? 'border-[rgb(var(--df-accent))] bg-[rgb(var(--df-accent))]/10 text-[rgb(var(--df-accent))]'
                    : 'border-[rgb(var(--df-border))] bg-[rgb(var(--df-card))] text-[rgb(var(--df-text-2))] hover:border-[rgb(var(--df-accent))]/50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[13px] font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Table selection — only for dine-in */}
          {orderType === 'DINE_IN' && (
            <div>
              <p className="text-[13px] font-medium mb-2 text-[rgb(var(--df-text-2))]">
                Select Table <span className="text-[11px] font-normal">(optional)</span>
              </p>

              {loadingTables ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--df-text-2))]" />
                </div>
              ) : tables.length === 0 ? (
                <p className="text-[12px] text-[rgb(var(--df-text-2))] bg-[rgb(var(--df-surface-2))] rounded-xl p-3 text-center">
                  No tables set up. Add tables in{' '}
                  <a href="/settings/tables" className="text-[rgb(var(--df-accent))] underline">Settings → Tables</a>.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  <button
                    onClick={() => setSelectedTable('')}
                    className={`h-14 rounded-xl border-2 text-[12px] font-medium transition-all ${
                      selectedTable === ''
                        ? 'border-[rgb(var(--df-accent))] bg-[rgb(var(--df-accent))]/10 text-[rgb(var(--df-accent))]'
                        : 'border-[rgb(var(--df-border))] bg-[rgb(var(--df-card))] text-[rgb(var(--df-text-2))]'
                    }`}
                  >
                    None
                  </button>
                  {tables.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTable(t.name)}
                      className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                        selectedTable === t.name
                          ? 'border-[rgb(var(--df-accent))] bg-[rgb(var(--df-accent))]/10 text-[rgb(var(--df-accent))]'
                          : 'border-[rgb(var(--df-border))] bg-[rgb(var(--df-card))] text-[rgb(var(--df-text-2))] hover:border-[rgb(var(--df-accent))]/50'
                      }`}
                    >
                      <span className="text-[13px] font-bold leading-tight">{t.name}</span>
                      <span className="text-[9px] opacity-60">{t.capacity} seats</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={goNext}
            disabled={!canProceedFromType}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[rgb(var(--df-accent))] text-white font-medium text-[14px] hover:opacity-90 transition-opacity"
          >
            Next — Select Customer <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Customer ───────────────────────────────────────────────────── */}
      {step === 'customer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Select Customer</h2>
            <button onClick={goBack} className="flex items-center gap-1 text-[12px] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div>
                <p className="text-[14px] font-semibold text-green-400">{selectedCustomer.name}</p>
                <p className="text-[12px] text-[rgb(var(--df-text-2))]">{selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[12px] text-[rgb(var(--df-text-2))] hover:text-red-400 transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-2))]" />
                <input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] transition-colors"
                />
                {searchingCustomers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[rgb(var(--df-text-2))]" />
                )}
              </div>

              {customers.length > 0 && (
                <div className="rounded-xl border border-[rgb(var(--df-border))] divide-y divide-[rgb(var(--df-border))] overflow-hidden">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setCustomerQuery('') }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-[rgb(var(--df-accent))]/20 flex items-center justify-center text-[12px] font-bold text-[rgb(var(--df-accent))]">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{c.name}</p>
                        <p className="text-[11px] text-[rgb(var(--df-text-2))]">{c.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowNewCustomer((p) => !p)}
                className="flex items-center gap-2 text-[13px] text-[rgb(var(--df-accent))] hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add new customer
              </button>

              {showNewCustomer && (
                <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-4 space-y-3">
                  <input
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Customer name *"
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))]"
                  />
                  <input
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Phone number *"
                    type="tel"
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))]"
                  />
                  <button
                    onClick={() => void createCustomer()}
                    disabled={!newCustomerName.trim() || !newCustomerPhone.trim()}
                    className="w-full py-2 rounded-lg bg-[rgb(var(--df-accent))] text-white text-[13px] font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    Save Customer
                  </button>
                </div>
              )}
            </>
          )}

          <button
            onClick={goNext}
            disabled={!canProceedFromCustomer}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[rgb(var(--df-accent))] text-white font-medium text-[14px] hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Next — Select Items <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 3: Menu + Cart ────────────────────────────────────────────────── */}
      {step === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Select Items</h2>
            <button onClick={goBack} className="flex items-center gap-1 text-[12px] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-2))]" />
            <input
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-9 pr-4 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))]"
            />
          </div>

          {/* Category tabs */}
          {!menuSearch && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id)
                    catRefs.current[cat.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-[rgb(var(--df-accent))] text-white'
                      : 'bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] border border-[rgb(var(--df-border))]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {loadingMenu ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-2))]" />
            </div>
          ) : (
            <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
              {filteredCategories.map((cat) => (
                <div key={cat.id} ref={(el) => { catRefs.current[cat.id] = el }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--df-text-2))] mb-2 sticky top-0 bg-[rgb(var(--df-bg))] py-1">
                    {cat.name}
                  </p>
                  <div className="space-y-2">
                    {cat.menuItems.map((item) => {
                      const qty = cartQty(item.id)
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl px-3 py-2.5"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className={`mt-0.5 w-3 h-3 rounded-sm border-2 shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                              <span className={`block w-1.5 h-1.5 rounded-full m-px ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium truncate">{item.name}</p>
                              <p className="text-[12px] text-[rgb(var(--df-text-2))]">{formatINR(item.price)}</p>
                            </div>
                          </div>
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-lg bg-[rgb(var(--df-accent))]/15 text-[rgb(var(--df-accent))] flex items-center justify-center hover:bg-[rgb(var(--df-accent))]/25 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-lg bg-[rgb(var(--df-surface-2))] flex items-center justify-center hover:bg-[rgb(var(--df-border))] transition-colors">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[14px] font-bold w-5 text-center">{qty}</span>
                              <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-lg bg-[rgb(var(--df-accent))] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Floating cart summary */}
          {cart.length > 0 && (
            <div className="sticky bottom-0 bg-[rgb(var(--df-surface))] border-t border-[rgb(var(--df-border))] -mx-4 px-4 pt-3 pb-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-[rgb(var(--df-text-2))]">
                  <ShoppingCart className="w-3.5 h-3.5 inline mr-1" />
                  {cart.reduce((s, c) => s + c.quantity, 0)} items
                </span>
                <span className="text-[14px] font-bold">{formatINR(grandTotal)}</span>
              </div>
              <button
                onClick={goNext}
                disabled={!canProceedFromMenu}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgb(var(--df-accent))] text-white font-medium text-[14px] hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Review Order <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 4: Confirm ────────────────────────────────────────────────────── */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Confirm Order</h2>
            <button onClick={goBack} className="flex items-center gap-1 text-[12px] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-[rgb(var(--df-accent))]/15 text-[rgb(var(--df-accent))]">
              {orderType.replace('_', ' ')}
            </span>
            {selectedTable && (
              <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-blue-500/15 text-blue-400">
                Table: {selectedTable}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] border border-[rgb(var(--df-border))]">
              <Users className="w-3 h-3 inline mr-1" />
              {selectedCustomer?.name}
            </span>
          </div>

          {/* Order items */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl overflow-hidden">
            {cart.map((item, i) => {
              const itemTotal = item.price * item.quantity * (1 + item.gstRate / 100)
              return (
                <div key={item.menuItemId} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-[rgb(var(--df-border))]' : ''}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => removeFromCart(item.menuItemId)} className="w-6 h-6 rounded-md bg-[rgb(var(--df-surface-2))] flex items-center justify-center hover:bg-[rgb(var(--df-border))]">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[13px] font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart({ id: item.menuItemId, name: item.name, price: item.price, gstRate: item.gstRate, isVeg: true })} className="w-6 h-6 rounded-md bg-[rgb(var(--df-accent))]/20 text-[rgb(var(--df-accent))] flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[13px] truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium">{formatINR(itemTotal)}</span>
                    <button onClick={() => deleteFromCart(item.menuItemId)} className="text-[rgb(var(--df-text-2))] hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-[13px] text-[rgb(var(--df-text-2))]">
              <span>Subtotal</span><span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-[rgb(var(--df-text-2))]">
              <span>GST (CGST + SGST)</span><span>{formatINR(totalGST)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-bold border-t border-[rgb(var(--df-border))] pt-2">
              <span>Grand Total</span><span className="text-[rgb(var(--df-accent))]">{formatINR(grandTotal)}</span>
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Order notes (optional)..."
            rows={2}
            className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] resize-none"
          />

          <button
            onClick={() => void placeOrder()}
            disabled={placing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[rgb(var(--df-accent))] text-white font-bold text-[15px] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {placing && <Loader2 className="w-4 h-4 animate-spin" />}
            Place Order · {formatINR(grandTotal)}
          </button>
        </div>
      )}
    </div>
  )
}
