'use client'

import { jsPDF } from 'jspdf'
import { formatINR } from './currency'

interface BillItem {
  name: string
  quantity: number
  price: number
  gstRate: number
  subtotal: number
  gstAmount: number
  cgst: number
  sgst: number
  total: number
}

interface TenantInfo {
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  gstin?: string | null
  gstName?: string | null
}

interface CustomerInfo {
  name: string
  phone: string
}

interface BillData {
  orderNumber: string
  type: string
  tableNumber?: string | null
  createdAt: Date | string
  tenant: TenantInfo
  customer: CustomerInfo
  items: BillItem[]
  subtotal: number
  totalCGST: number
  totalSGST: number
  totalGST: number
  grandTotal: number
  paymentStatus: string
  paymentMethod?: string | null
  notes?: string | null
}

export function generateBillPdf(data: BillData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const W = 210
  const margin = 15
  const contentW = W - margin * 2
  let y = 20

  const accent = [99, 102, 241] as [number, number, number]
  const gray1 = [60, 60, 60] as [number, number, number]
  const gray2 = [120, 120, 120] as [number, number, number]
  const gray3 = [200, 200, 200] as [number, number, number]

  function line(color: [number, number, number] = gray3, thickness = 0.3): void {
    doc.setDrawColor(...color)
    doc.setLineWidth(thickness)
    doc.line(margin, y, W - margin, y)
    y += 3
  }

  function text(
    str: string,
    x: number,
    size: number,
    style: 'normal' | 'bold' = 'normal',
    color: [number, number, number] = gray1,
    align: 'left' | 'center' | 'right' = 'left',
  ): void {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(...color)
    doc.text(str, x, y, { align })
  }

  // ── Header: Restaurant name ──────────────────────────────────────────────────
  text(data.tenant.name, W / 2, 18, 'bold', accent, 'center')
  y += 7

  if (data.tenant.gstName && data.tenant.gstName !== data.tenant.name) {
    text(data.tenant.gstName, W / 2, 9, 'normal', gray2, 'center')
    y += 5
  }

  if (data.tenant.address) {
    text(data.tenant.address, W / 2, 8, 'normal', gray2, 'center')
    y += 4.5
  }

  const contactParts = [data.tenant.phone, data.tenant.email].filter(Boolean)
  if (contactParts.length) {
    text(contactParts.join(' | '), W / 2, 8, 'normal', gray2, 'center')
    y += 4.5
  }

  if (data.tenant.gstin) {
    text(`GSTIN: ${data.tenant.gstin}`, W / 2, 8, 'bold', gray1, 'center')
    y += 5
  }

  y += 2
  line(accent, 0.6)

  // ── "TAX INVOICE" title ──────────────────────────────────────────────────────
  text('TAX INVOICE', W / 2, 12, 'bold', gray1, 'center')
  y += 6
  line()

  // ── Order details ────────────────────────────────────────────────────────────
  const dateStr = new Date(data.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const leftColX = margin
  const rightColX = W - margin

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray2)
  doc.text('Order No.', leftColX, y)
  doc.text('Date', rightColX - 30, y)
  y += 4.5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...gray1)
  doc.text(data.orderNumber, leftColX, y)
  doc.text(dateStr, rightColX - 30, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray2)
  doc.text('Customer', leftColX, y)
  doc.text('Type', rightColX - 30, y)
  y += 4.5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...gray1)
  doc.text(`${data.customer.name} · ${data.customer.phone}`, leftColX, y)
  doc.text(data.type.replace('_', ' '), rightColX - 30, y)
  y += 5

  if (data.tableNumber) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray2)
    doc.text('Table', leftColX, y)
    y += 4.5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...gray1)
    doc.text(data.tableNumber, leftColX, y)
    y += 5
  }

  y += 2
  line()

  // ── Items table header ───────────────────────────────────────────────────────
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...gray2)
  doc.text('ITEM', margin, y)
  doc.text('QTY', margin + 80, y)
  doc.text('RATE', margin + 100, y)
  doc.text('GST%', margin + 122, y)
  doc.text('GST ₹', margin + 143, y)
  doc.text('TOTAL', rightColX, y, { align: 'right' })
  y += 4

  line([180, 180, 180], 0.2)

  // ── Items ────────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray1)

  for (const item of data.items) {
    doc.setFontSize(9)
    const nameLines = doc.splitTextToSize(item.name, 75) as string[]
    doc.text(nameLines, margin, y)
    doc.text(String(item.quantity), margin + 80, y)
    doc.text(formatINR(item.price), margin + 100, y)
    doc.text(`${item.gstRate}%`, margin + 122, y)
    doc.text(formatINR(item.gstAmount), margin + 143, y)
    doc.setFont('helvetica', 'bold')
    doc.text(formatINR(item.total), rightColX, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += nameLines.length > 1 ? nameLines.length * 4.5 : 5.5

    if (y > 260) {
      doc.addPage()
      y = 20
    }
  }

  y += 2
  line([180, 180, 180], 0.2)

  // ── GST breakup ──────────────────────────────────────────────────────────────
  const summaryX = W - margin - 70

  function summaryRow(label: string, value: string, bold = false): void {
    doc.setFontSize(9)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const rowColor = bold ? gray1 : gray2
    doc.setTextColor(...rowColor)
    doc.text(label, summaryX, y)
    doc.text(value, rightColX, y, { align: 'right' })
    y += 5
  }

  summaryRow('Subtotal', formatINR(data.subtotal))
  summaryRow('CGST', formatINR(data.totalCGST))
  summaryRow('SGST', formatINR(data.totalSGST))

  y += 1
  doc.setDrawColor(...gray3)
  doc.setLineWidth(0.2)
  doc.line(summaryX - 5, y, W - margin, y)
  y += 4

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accent)
  doc.text('GRAND TOTAL', summaryX, y)
  doc.text(formatINR(data.grandTotal), rightColX, y, { align: 'right' })
  y += 7

  // Payment status
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray2)
  const payText = data.paymentStatus === 'PAID'
    ? `Paid via ${data.paymentMethod ?? 'Cash'}`
    : 'PAYMENT PENDING'
  doc.text(payText, rightColX, y, { align: 'right' })
  y += 8

  // ── GST table per rate ───────────────────────────────────────────────────────
  const gstRates = [...new Set(data.items.map((i) => i.gstRate))]
  if (gstRates.length > 0) {
    line()
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...gray2)
    doc.text('GST SUMMARY', margin, y)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.text('Rate', margin, y)
    doc.text('Taxable Amt', margin + 30, y)
    doc.text('CGST', margin + 70, y)
    doc.text('SGST', margin + 100, y)
    doc.text('Total GST', margin + 130, y)
    y += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray1)
    for (const rate of gstRates) {
      const rateItems = data.items.filter((i) => i.gstRate === rate)
      const taxable = rateItems.reduce((s, i) => s + i.subtotal, 0)
      const cgst = rateItems.reduce((s, i) => s + i.cgst, 0)
      const sgst = rateItems.reduce((s, i) => s + i.sgst, 0)
      const totalGst = cgst + sgst

      doc.text(`${rate}%`, margin, y)
      doc.text(formatINR(taxable), margin + 30, y)
      doc.text(formatINR(cgst), margin + 70, y)
      doc.text(formatINR(sgst), margin + 100, y)
      doc.text(formatINR(totalGst), margin + 130, y)
      y += 5
    }
  }

  y += 4
  line(accent, 0.6)

  // ── Footer watermark ─────────────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray2)
  doc.text('Thank you for dining with us! We look forward to your next visit.', W / 2, y, { align: 'center' })
  y += 5
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  doc.text('Powered by DineFlow · dineflow.in', W / 2, y, { align: 'center' })

  doc.save(`${data.orderNumber}.pdf`)
}
