export interface GSTBreakdown {
  subtotal: number
  gstAmount: number
  cgst: number
  sgst: number
  total: number
}

export function calculateItemGST(price: number, quantity: number, gstRate: number): GSTBreakdown {
  const subtotal = price * quantity
  const gstAmount = subtotal * (gstRate / 100)
  const cgst = gstAmount / 2
  const sgst = gstAmount / 2
  const total = subtotal + gstAmount

  return { subtotal, gstAmount, cgst, sgst, total }
}

export interface CartItem {
  price: number
  quantity: number
  gstRate: number
}

export interface OrderTotals {
  subtotal: number
  totalGST: number
  totalCGST: number
  totalSGST: number
  grandTotal: number
}

export function calculateOrderTotals(items: CartItem[]): OrderTotals {
  let subtotal = 0
  let totalGST = 0
  let totalCGST = 0
  let totalSGST = 0

  for (const item of items) {
    const breakdown = calculateItemGST(item.price, item.quantity, item.gstRate)
    subtotal += breakdown.subtotal
    totalGST += breakdown.gstAmount
    totalCGST += breakdown.cgst
    totalSGST += breakdown.sgst
  }

  return {
    subtotal,
    totalGST,
    totalCGST,
    totalSGST,
    grandTotal: subtotal + totalGST,
  }
}
