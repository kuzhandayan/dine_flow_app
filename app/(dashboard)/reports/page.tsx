'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import {
  TrendingUp, ShoppingCart, Receipt, Wallet,
  Download, RefreshCw, PackageOpen, TrendingDown,
  FileText, FileSpreadsheet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import jsPDF from 'jspdf'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyStat { date: string; orders: number; revenue: number; gst: number }
interface TopItem    { name: string; quantity: number; revenue: number }
interface GSTBreakup { rate: number; taxable: number; gst: number; cgst: number; sgst: number }

interface Summary {
  totalRevenue: number; netRevenue: number
  totalGST: number; totalCGST: number; totalSGST: number
  totalOrders: number; completedOrders: number; cancelledOrders: number; avgOrderValue: number
  inventoryExpenses: number; currentInventoryValue: number; grossProfit: number
}

interface ReportData {
  summary: Summary
  daily: DailyStat[]
  topItems: TopItem[]
  gstBreakup: GSTBreakup[]
  ordersByStatus: Record<string, number>
  period: { from: string; to: string }
}

// ── Month options ─────────────────────────────────────────────────────────────

function buildMonthOptions(): { label: string; value: string }[] {
  const opts = [{ label: 'All Time', value: 'all' }]
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i)
    opts.push({
      label: format(d, 'MMMM yyyy'),
      value: format(d, 'yyyy-MM'),
    })
  }
  return opts
}

const MONTH_OPTIONS = buildMonthOptions()

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({ data, currency }: { data: DailyStat[]; currency: string }): React.JSX.Element {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[rgb(var(--df-text-3))] text-[13px]">
        No data for this period
      </div>
    )
  }

  const maxRev = Math.max(...data.map((d) => d.revenue), 1)
  const W = 600; const H = 160; const PAD = 24; const BAR_GAP = 2
  const barW = Math.max(4, (W - PAD * 2) / data.length - BAR_GAP)

  return (
    <div className="relative overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H + 30}`}
        className="w-full"
        style={{ minWidth: Math.max(400, data.length * 14) }}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={PAD} y1={H - H * p + 4}
            x2={W - PAD} y2={H - H * p + 4}
            stroke="rgb(var(--df-border))" strokeWidth="0.5"
          />
        ))}

        {data.map((d, i) => {
          const barH = Math.max(2, (d.revenue / maxRev) * (H - 8))
          const x = PAD + i * ((W - PAD * 2) / data.length) + 1
          const y = H - barH + 4
          const isHov = hovered === i
          const day = d.date.slice(8)

          return (
            <g key={d.date}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="2"
                fill={isHov ? 'rgb(var(--df-accent))' : 'rgba(var(--df-accent), 0.45)'}
                className="transition-all duration-150"
              />
              {/* Day label */}
              {data.length <= 31 && (
                <text
                  x={x + barW / 2} y={H + 20}
                  textAnchor="middle" fontSize="8"
                  fill="rgb(var(--df-text-3))"
                >
                  {day}
                </text>
              )}

              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={Math.min(x - 10, W - 130)} y={Math.max(y - 46, 2)}
                    width="120" height="40" rx="6"
                    fill="rgb(var(--df-card))" stroke="rgb(var(--df-border))"
                  />
                  <text x={Math.min(x - 10, W - 130) + 8} y={Math.max(y - 46, 2) + 14} fontSize="9" fill="rgb(var(--df-text-2))">{d.date}</text>
                  <text x={Math.min(x - 10, W - 130) + 8} y={Math.max(y - 46, 2) + 28} fontSize="10" fill="rgb(var(--df-accent))" fontWeight="600">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(d.revenue)}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; color: string
}): React.JSX.Element {
  return (
    <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wider">{label}</p>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>{icon}</span>
      </div>
      <p className="text-[22px] font-bold text-[rgb(var(--df-text))] leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage(): React.JSX.Element {
  const { format: fmt, currency } = useCurrency()
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[1].value) // current month
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (month: string): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      let url = '/api/reports'
      if (month !== 'all') {
        const [y, m] = month.split('-').map(Number)
        const from = startOfMonth(new Date(y, m - 1))
        const to = endOfMonth(new Date(y, m - 1))
        url = `/api/reports?from=${format(from, 'yyyy-MM-dd')}&to=${format(to, 'yyyy-MM-dd')}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json() as ReportData
      setData(json)
    } catch {
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(selectedMonth) }, [selectedMonth, load])

  // ── CSV Export ───────────────────────────────────────────────────────────────
  function downloadCSV(): void {
    if (!data) return
    const rows: string[][] = []
    rows.push(['DineFlow Report', selectedMonth === 'all' ? 'All Time' : selectedMonth])
    rows.push([])
    rows.push(['SUMMARY'])
    rows.push(['Total Revenue', data.summary.totalRevenue.toFixed(2)])
    rows.push(['Net Revenue (pre-GST)', data.summary.netRevenue.toFixed(2)])
    rows.push(['Total GST Collected', data.summary.totalGST.toFixed(2)])
    rows.push(['CGST', data.summary.totalCGST.toFixed(2)])
    rows.push(['SGST', data.summary.totalSGST.toFixed(2)])
    rows.push(['Total Orders', data.summary.totalOrders.toString()])
    rows.push(['Completed Orders', data.summary.completedOrders.toString()])
    rows.push(['Restock Expenses', data.summary.inventoryExpenses.toFixed(2)])
    rows.push(['Gross Profit', data.summary.grossProfit.toFixed(2)])
    rows.push([])
    rows.push(['DAILY REVENUE', 'Date', 'Orders', 'Revenue', 'GST'])
    for (const d of data.daily) rows.push(['', d.date, d.orders.toString(), d.revenue.toFixed(2), d.gst.toFixed(2)])
    rows.push([])
    rows.push(['TOP ITEMS', 'Item', 'Qty Sold', 'Revenue'])
    for (const item of data.topItems) rows.push(['', item.name, item.quantity.toString(), item.revenue.toFixed(2)])
    rows.push([])
    rows.push(['GST BREAKUP', 'Rate', 'Taxable', 'GST', 'CGST', 'SGST'])
    for (const g of data.gstBreakup) rows.push(['', `${g.rate}%`, g.taxable.toFixed(2), g.gst.toFixed(2), g.cgst.toFixed(2), g.sgst.toFixed(2)])

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dineflow-report-${selectedMonth}.csv`
    a.click()
  }

  // ── PDF Export ───────────────────────────────────────────────────────────────
  function downloadPDF(): void {
    if (!data) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const s = data.summary
    const margin = 15
    let y = margin

    const line = (text: string, x: number, bold = false, size = 10): void => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(text, x, y)
    }
    const newLine = (n = 6): void => { y += n }
    const hr = (): void => {
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, 195, y)
      newLine(4)
    }

    // Header
    doc.setFillColor(249, 115, 22)
    doc.rect(0, 0, 210, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('DineFlow — Financial Report', margin, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(selectedMonth === 'all' ? 'All Time' : selectedMonth, 195, 14, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    y = 30

    // Summary
    line('SUMMARY', margin, true, 12); newLine(7)
    hr()

    const col2 = 110
    const rows: [string, string, string, string][] = [
      ['Total Revenue', `${currency} ${s.totalRevenue.toFixed(2)}`, 'Net (pre-GST)', `${currency} ${s.netRevenue.toFixed(2)}`],
      ['Total GST', `${currency} ${s.totalGST.toFixed(2)}`, 'CGST / SGST', `${currency} ${s.totalCGST.toFixed(2)} / ${s.totalSGST.toFixed(2)}`],
      ['Total Orders', s.totalOrders.toString(), 'Completed', s.completedOrders.toString()],
      ['Restock Expenses', `${currency} ${s.inventoryExpenses.toFixed(2)}`, 'Gross Profit', `${currency} ${s.grossProfit.toFixed(2)}`],
    ]
    for (const [l1, v1, l2, v2] of rows) {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120); doc.text(l1, margin, y); doc.text(l2, col2, y)
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold')
      doc.text(v1, margin + 45, y); doc.text(v2, col2 + 40, y)
      newLine(7)
    }
    newLine(2); hr()

    // Top items
    if (data.topItems.length > 0) {
      line('TOP SELLING ITEMS', margin, true, 11); newLine(7)
      doc.setFontSize(9); doc.setTextColor(120, 120, 120)
      doc.text('Item', margin, y); doc.text('Qty', 130, y); doc.text('Revenue', 160, y)
      newLine(5); hr()
      for (const item of data.topItems.slice(0, 8)) {
        doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0); doc.setFontSize(9)
        doc.text(item.name.slice(0, 40), margin, y)
        doc.text(item.quantity.toString(), 130, y)
        doc.text(`${currency} ${item.revenue.toFixed(2)}`, 160, y)
        newLine(6)
      }
      newLine(2); hr()
    }

    // GST breakup
    if (data.gstBreakup.length > 0) {
      line('GST BREAKUP', margin, true, 11); newLine(7)
      doc.setFontSize(9); doc.setTextColor(120, 120, 120)
      doc.text('Rate', margin, y); doc.text('Taxable', 50, y); doc.text('CGST', 100, y); doc.text('SGST', 140, y); doc.text('Total GST', 170, y)
      newLine(5); hr()
      for (const g of data.gstBreakup) {
        doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0); doc.setFontSize(9)
        doc.text(`${g.rate}%`, margin, y)
        doc.text(g.taxable.toFixed(2), 50, y)
        doc.text(g.cgst.toFixed(2), 100, y)
        doc.text(g.sgst.toFixed(2), 140, y)
        doc.text(g.gst.toFixed(2), 170, y)
        newLine(6)
      }
    }

    // Footer
    doc.setFontSize(7); doc.setTextColor(160, 160, 160)
    doc.text(`Generated by DineFlow • ${new Date().toLocaleString()}`, margin, 285)

    doc.save(`dineflow-report-${selectedMonth}.pdf`)
  }

  const s = data?.summary
  const periodLabel = selectedMonth === 'all' ? 'All Time' : format(new Date(selectedMonth + '-01'), 'MMMM yyyy')

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Reports</h1>
          <p className="text-[13px] text-[rgb(var(--df-text-3))] mt-0.5">Revenue, GST, profit & analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month picker */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] text-[rgb(var(--df-text))] focus:outline-none focus:border-[rgb(var(--df-accent))]/60"
          >
            {MONTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => void load(selectedMonth)}
            className="p-2 rounded-xl border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-3))] hover:border-[rgb(var(--df-accent))]/40 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>

          <button
            onClick={downloadCSV}
            disabled={!data}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))] hover:border-[rgb(var(--df-accent))]/40 disabled:opacity-40 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
            CSV
          </button>

          <button
            onClick={downloadPDF}
            disabled={!data}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))] hover:border-[rgb(var(--df-accent))]/40 disabled:opacity-40 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Period label */}
          <p className="text-[12px] text-[rgb(var(--df-text-3))]">Showing data for <strong className="text-[rgb(var(--df-text-2))]">{periodLabel}</strong></p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value={fmt(s!.totalRevenue)}
              sub={`${s!.completedOrders} paid orders`}
              icon={<TrendingUp className="w-4 h-4" />}
              color="bg-[rgb(var(--df-accent))]/15 text-[rgb(var(--df-accent))]"
            />
            <StatCard
              label="GST Collected"
              value={fmt(s!.totalGST)}
              sub={`CGST ${fmt(s!.totalCGST)} · SGST ${fmt(s!.totalSGST)}`}
              icon={<Receipt className="w-4 h-4" />}
              color="bg-blue-400/15 text-blue-400"
            />
            <StatCard
              label="Restock Expenses"
              value={fmt(s!.inventoryExpenses)}
              sub={`Stock value ${fmt(s!.currentInventoryValue)}`}
              icon={<PackageOpen className="w-4 h-4" />}
              color="bg-amber-400/15 text-amber-400"
            />
            <StatCard
              label="Gross Profit"
              value={fmt(s!.grossProfit)}
              sub={s!.grossProfit >= 0 ? 'Revenue − Expenses' : 'Loss this period'}
              icon={s!.grossProfit >= 0 ? <Wallet className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              color={s!.grossProfit >= 0 ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'}
            />
          </div>

          {/* Secondary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Orders"
              value={s!.totalOrders.toString()}
              sub={`${s!.cancelledOrders} cancelled`}
              icon={<ShoppingCart className="w-4 h-4" />}
              color="bg-purple-400/15 text-purple-400"
            />
            <StatCard
              label="Avg Order Value"
              value={fmt(s!.avgOrderValue)}
              sub="Per completed order"
              icon={<TrendingUp className="w-4 h-4" />}
              color="bg-cyan-400/15 text-cyan-400"
            />
            <StatCard
              label="Net Revenue"
              value={fmt(s!.netRevenue)}
              sub="Pre-GST (your income)"
              icon={<Wallet className="w-4 h-4" />}
              color="bg-teal-400/15 text-teal-400"
            />
            <StatCard
              label="Order Success Rate"
              value={s!.totalOrders > 0 ? `${Math.round((s!.completedOrders / s!.totalOrders) * 100)}%` : '—'}
              sub={`${s!.completedOrders} of ${s!.totalOrders} completed`}
              icon={<Download className="w-4 h-4" />}
              color="bg-indigo-400/15 text-indigo-400"
            />
          </div>

          {/* Daily revenue chart */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5">
            <p className="text-[13px] font-semibold mb-4">Daily Revenue — {periodLabel}</p>
            <BarChart data={data.daily} currency={currency} />
          </div>

          {/* Top items + GST breakup */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Top items */}
            <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgb(var(--df-border))]">
                <p className="text-[13px] font-semibold">Top Selling Items</p>
              </div>
              {data.topItems.length === 0 ? (
                <p className="text-center py-8 text-[13px] text-[rgb(var(--df-text-3))]">No orders in this period</p>
              ) : (
                <div className="divide-y divide-[rgb(var(--df-border))]">
                  {data.topItems.map((item, i) => {
                    const maxRev = data.topItems[0].revenue
                    const pct = (item.revenue / maxRev) * 100
                    return (
                      <div key={item.name} className="px-5 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[rgb(var(--df-text-3))] w-4">{i + 1}</span>
                            <span className="text-[13px] font-medium text-[rgb(var(--df-text))] truncate max-w-[160px]">{item.name}</span>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-[12px] font-semibold text-[rgb(var(--df-text))]">{fmt(item.revenue)}</p>
                            <p className="text-[10px] text-[rgb(var(--df-text-3))]">{item.quantity} sold</p>
                          </div>
                        </div>
                        <div className="h-1 bg-[rgb(var(--df-surface-2))] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[rgb(var(--df-accent))] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* GST Breakup */}
            <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgb(var(--df-border))]">
                <p className="text-[13px] font-semibold">GST Breakup by Rate</p>
              </div>
              {data.gstBreakup.length === 0 ? (
                <p className="text-center py-8 text-[13px] text-[rgb(var(--df-text-3))]">No GST data for this period</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgb(var(--df-border))]">
                      {['Rate', 'Taxable', 'CGST', 'SGST', 'Total'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.gstBreakup.map((g) => (
                      <tr key={g.rate} className="border-b border-[rgb(var(--df-border))] last:border-0">
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-400/10 text-blue-400 border border-blue-400/20 rounded-full text-[11px] font-semibold">{g.rate}%</span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[rgb(var(--df-text-2))]">{fmt(g.taxable)}</td>
                        <td className="px-4 py-3 text-[12px] text-[rgb(var(--df-text-2))]">{fmt(g.cgst)}</td>
                        <td className="px-4 py-3 text-[12px] text-[rgb(var(--df-text-2))]">{fmt(g.sgst)}</td>
                        <td className="px-4 py-3 text-[12px] font-semibold text-[rgb(var(--df-text))]">{fmt(g.gst)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[rgb(var(--df-surface-2))]/50">
                      <td className="px-4 py-3 text-[11px] font-bold text-[rgb(var(--df-text-2))] uppercase">Total</td>
                      <td className="px-4 py-3 text-[12px] font-bold">{fmt(s!.netRevenue)}</td>
                      <td className="px-4 py-3 text-[12px] font-bold">{fmt(s!.totalCGST)}</td>
                      <td className="px-4 py-3 text-[12px] font-bold">{fmt(s!.totalSGST)}</td>
                      <td className="px-4 py-3 text-[12px] font-bold text-[rgb(var(--df-accent))]">{fmt(s!.totalGST)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Order status breakdown */}
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5">
            <p className="text-[13px] font-semibold mb-4">Orders by Status</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(['PENDING', 'IN_PROGRESS', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'] as const).map((status) => {
                const count = data.ordersByStatus[status] ?? 0
                const colors: Record<string, string> = {
                  PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
                  IN_PROGRESS: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
                  READY: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                  SERVED: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
                  COMPLETED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                  CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/20',
                }
                return (
                  <div key={status} className={`flex flex-col items-center py-3 rounded-xl border ${colors[status]}`}>
                    <span className="text-[22px] font-bold">{count}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">{status.replace('_', ' ')}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </>
      ) : null}
    </div>
  )
}
