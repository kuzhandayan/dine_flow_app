'use client'

import { useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { generateBillPdf } from '@/lib/billPdf'

interface Props {
  orderId: string
  orderNumber: string
  variant?: 'button' | 'icon'
}

interface OrderApiResponse {
  order: {
    orderNumber: string
    type: string
    tableNumber?: string | null
    createdAt: string
    notes?: string | null
    subtotal: number
    totalCGST: number
    totalSGST: number
    totalGST: number
    grandTotal: number
    paymentStatus: string
    paymentMethod?: string | null
    customer: { name: string; phone: string }
    items: {
      name: string
      quantity: number
      price: number
      gstRate: number
      subtotal: number
      gstAmount: number
      cgst: number
      sgst: number
      total: number
    }[]
  }
  tenant: {
    name: string
    address?: string | null
    phone?: string | null
    email?: string | null
    gstin?: string | null
    gstName?: string | null
  }
}

export function PrintBillButton({ orderId, orderNumber, variant = 'button' }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(false)

  async function handlePrint(): Promise<void> {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error('Failed to fetch order')
      const data = await res.json() as OrderApiResponse

      generateBillPdf({
        orderNumber: data.order.orderNumber,
        type: data.order.type,
        tableNumber: data.order.tableNumber,
        createdAt: data.order.createdAt,
        tenant: data.tenant,
        customer: data.order.customer,
        items: data.order.items,
        subtotal: data.order.subtotal,
        totalCGST: data.order.totalCGST,
        totalSGST: data.order.totalSGST,
        totalGST: data.order.totalGST,
        grandTotal: data.order.grandTotal,
        paymentStatus: data.order.paymentStatus,
        paymentMethod: data.order.paymentMethod,
        notes: data.order.notes,
      })

      toast.success(`Bill ${orderNumber} downloaded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate bill')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={() => void handlePrint()}
        disabled={loading}
        title="Print Bill"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(var(--df-text-2))] hover:bg-white/10 hover:text-[rgb(var(--df-accent))] transition-colors disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
      </button>
    )
  }

  return (
    <button
      onClick={() => void handlePrint()}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--df-border))] text-[13px] hover:bg-white/5 disabled:opacity-40 transition-colors"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
      Print Bill
    </button>
  )
}
