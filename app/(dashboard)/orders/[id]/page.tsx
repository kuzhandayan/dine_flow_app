'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCurrency } from '@/hooks/useCurrency'
import { PageHeader } from '@/components/shared/PageHeader'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { useToast } from '@/components/providers/ToastProvider'
import {
  ArrowLeft, Loader2, UtensilsCrossed, Package, Receipt,
  ChevronDown, CheckCircle2, XCircle,
} from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  gstRate: number
  subtotal: number
  cgst: number
  sgst: number
  total: number
  notes: string | null
}

interface Order {
  id: string
  orderNumber: string
  type: 'DINE_IN' | 'PARCEL' | 'DELIVERY'
  status: string
  paymentStatus: string
  paymentMethod: string | null
  tableNumber: string | null
  notes: string | null
  grandTotal: number
  subtotal: number
  totalCGST: number
  totalSGST: number
  totalGST: number
  paidAmount: number
  createdAt: string
  completedAt: string | null
  customer: { name: string; phone: string; email: string | null }
  items: OrderItem[]
}

const STATUS_FLOW = ['PENDING', 'IN_PROGRESS', 'READY', 'SERVED', 'COMPLETED']
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Pending',     color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  READY:       { label: 'Ready',       color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  SERVED:      { label: 'Served',      color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  DELIVERED:   { label: 'Delivered',   color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  COMPLETED:   { label: 'Completed',   color: 'text-[rgb(var(--df-text-3))] bg-[rgb(var(--df-surface-2))] border-[rgb(var(--df-border))]' },
  CANCELLED:   { label: 'Cancelled',   color: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

export default function OrderDetailPage(): React.JSX.Element {
  const { confirm } = useConfirm()
  const toast = useToast()
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { format: fmt, symbol } = useCurrency()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH')

  const fetchOrder = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (!res.ok) { router.push('/orders'); return }
      const data = (await res.json()) as { order: Order }
      setOrder(data.order)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { void fetchOrder() }, [fetchOrder])

  async function updateStatus(status: string): Promise<void> {
    setUpdating(true)
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success('Status updated', `Order moved to ${status.replace('_', ' ').toLowerCase()}`)
      void fetchOrder()
    } finally {
      setUpdating(false)
    }
  }

  async function markPaid(): Promise<void> {
    setUpdating(true)
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'PAID',
          paymentMethod: payMethod,
          paidAmount: order?.grandTotal,
        }),
      })
      toast.success('Payment recorded', `Paid via ${payMethod}`)
      setShowPayment(false)
      void fetchOrder()
    } finally {
      setUpdating(false)
    }
  }

  async function cancelOrder(): Promise<void> {
    const ok = await confirm({ title: 'Cancel Order', message: 'This order will be marked as cancelled. This cannot be undone.', confirmLabel: 'Cancel Order', variant: 'danger' })
    if (!ok) return
    await updateStatus('CANCELLED')
    toast.warning('Order cancelled')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" /></div>
    )
  }

  if (!order) return <div className="text-center py-20 text-[rgb(var(--df-text-2))]">Order not found</div>

  const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING']
  const isCompleted = order.status === 'COMPLETED' || order.status === 'CANCELLED'
  const isPaid = order.paymentStatus === 'PAID'
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <PageHeader
          title={order.orderNumber}
          subtitle={`Created ${new Date(order.createdAt).toLocaleString('en-IN')}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">

        {/* Left: Order info + items */}
        <div className="lg:col-span-2 space-y-4">

          {/* Status + quick actions */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[12px] font-medium border ${st.color}`}>
                  {st.label}
                </span>
                <span className={`text-[12px] font-medium ${isPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isPaid ? 'Paid' : 'Unpaid'}
                  {order.paymentMethod && ` · ${order.paymentMethod}`}
                </span>
              </div>
              {!isCompleted && (
                <button
                  onClick={() => void cancelOrder()}
                  className="flex items-center gap-1.5 text-[12px] text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel Order
                </button>
              )}
            </div>

            {/* Status progress */}
            {!isCompleted && (
              <div className="flex items-center gap-1 mb-4">
                {STATUS_FLOW.map((s, i) => {
                  const idx = STATUS_FLOW.indexOf(order.status)
                  const done = i < idx
                  const current = i === idx
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div className={`flex-1 h-1 rounded-full ${done || current ? 'bg-[rgb(var(--df-accent))]' : 'bg-[rgb(var(--df-surface-2))]'}`} />
                      {i === STATUS_FLOW.length - 1 && (
                        <div className={`w-2 h-2 rounded-full ${current ? 'bg-[rgb(var(--df-accent))]' : done ? 'bg-[rgb(var(--df-accent))]' : 'bg-[rgb(var(--df-surface-2))]'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {!isCompleted && nextStatus && (
                <button
                  onClick={() => void updateStatus(nextStatus)}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-medium transition-all disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Mark {STATUS_CONFIG[nextStatus]?.label}
                </button>
              )}
              {!isPaid && !isCompleted && (
                <button
                  onClick={() => setShowPayment(!showPayment)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl text-[13px] font-medium transition-all"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Collect Payment
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPayment ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {showPayment && (
              <div className="mt-4 pt-4 border-t border-[rgb(var(--df-border))]">
                <p className="text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-2">Payment Method</p>
                <div className="flex gap-2 mb-3">
                  {(['CASH', 'CARD', 'UPI'] as const).map((m) => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      className={`px-4 py-2 rounded-xl text-[13px] font-medium border transition-all ${payMethod === m ? 'border-[rgb(var(--df-accent))] bg-[rgb(var(--df-accent))]/10 text-[rgb(var(--df-accent))]' : 'border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))]'}`}>
                      {m}
                    </button>
                  ))}
                </div>
                <button onClick={() => void markPaid()} disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[13px] font-medium transition-all disabled:opacity-50">
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm {fmt(order.grandTotal)} received
                </button>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[rgb(var(--df-border))]">
              <p className="text-[13px] font-semibold">Order Items</p>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-[rgb(var(--df-border))] last:border-b-0">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[rgb(var(--df-text))]">{item.name}</p>
                  {item.notes && <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-0.5">{item.notes}</p>}
                  <p className="text-[11px] text-[rgb(var(--df-text-3))]">{symbol}{item.price} × {item.quantity} · GST {item.gstRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-[rgb(var(--df-text))]">{fmt(item.total)}</p>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))]">CGST {fmt(item.cgst)} + SGST {fmt(item.sgst)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wide mb-3">Customer</p>
            <p className="text-[14px] font-semibold">{order.customer.name}</p>
            <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-0.5">{order.customer.phone}</p>
            {order.customer.email && <p className="text-[12px] text-[rgb(var(--df-text-2))]">{order.customer.email}</p>}
          </div>

          {/* Order type */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wide mb-3">Details</p>
            <div className="flex items-center gap-2 text-[13px]">
              {order.type === 'DINE_IN' ? <UtensilsCrossed className="w-4 h-4 text-[rgb(var(--df-text-2))]" /> : <Package className="w-4 h-4 text-[rgb(var(--df-text-2))]" />}
              <span>{order.type === 'DINE_IN' ? 'Dine In' : 'Parcel'}</span>
              {order.tableNumber && <span className="text-[rgb(var(--df-text-3))]">· Table {order.tableNumber}</span>}
            </div>
            {order.notes && (
              <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-2 bg-[rgb(var(--df-surface-2))] rounded-lg px-3 py-2">{order.notes}</p>
            )}
          </div>

          {/* Bill summary */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wide mb-3">Bill Summary</p>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between text-[rgb(var(--df-text-2))]">
                <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[rgb(var(--df-text-2))]">
                <span>CGST</span><span>{fmt(order.totalCGST)}</span>
              </div>
              <div className="flex justify-between text-[rgb(var(--df-text-2))]">
                <span>SGST</span><span>{fmt(order.totalSGST)}</span>
              </div>
              <div className="flex justify-between font-bold text-[15px] pt-2 border-t border-[rgb(var(--df-border))] text-[rgb(var(--df-text))]">
                <span>Grand Total</span>
                <span className="text-[rgb(var(--df-accent))]">{fmt(order.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
