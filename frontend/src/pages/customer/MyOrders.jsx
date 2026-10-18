
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Truck,
  PackageCheck,
  XCircle,
  ClipboardCheck,
  Download,
  FileText,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import api from '../../services/api'

const ORDER_STEPS = [
  { status: 'placed', label: 'Order Placed', icon: ShoppingBag },
  { status: 'confirmed', label: 'Confirmed', icon: ClipboardCheck },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: PackageCheck },
]

const STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_STYLES = {
  placed: 'bg-blue-50 text-blue-700 ring-blue-200',
  confirmed: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  processing: 'bg-amber-50 text-amber-700 ring-amber-200',
  shipped: 'bg-purple-50 text-purple-700 ring-purple-200',
  delivered: 'bg-green-50 text-green-700 ring-green-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(date) {
  if (!date) return 'Date unavailable'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable'
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeStatus(status) {
  const normalized = String(status || 'placed').toLowerCase().trim()
  return STATUS_LABELS[normalized] ? normalized : 'placed'
}

function getItemName(item) {
  return item.product_name || item.name || 'Handmade product'
}

function getItemPrice(item) {
  return Number(item.unit_price ?? item.unitPrice ?? 0)
}

function getItemTotal(item) {
  return Number(
    item.line_total ??
      item.lineTotal ??
      getItemPrice(item) * Number(item.quantity || 0)
  )
}

function getShippingAddress(address) {
  if (!address) return 'Address unavailable'

  if (typeof address === 'string') {
    try {
      const parsed = JSON.parse(address)
      return getShippingAddress(parsed)
    } catch {
      return address
    }
  }

  return [
    address.address,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(', ') || 'Address unavailable'
}

function downloadInvoice(order) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16
  const rightEdge = pageWidth - margin
  let y = 20

  const money = (value) =>
    `INR ${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const safeText = (value) =>
    String(value ?? '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .trim()

  const ensureSpace = (needed = 10) => {
    if (y + needed > pageHeight - 18) {
      doc.addPage()
      y = 20
    }
  }

  const line = () => {
    doc.setDrawColor(220, 205, 175)
    doc.line(margin, y, rightEdge, y)
    y += 7
  }

  // Header
  doc.setFillColor(84, 35, 42)
  doc.rect(0, 0, pageWidth, 43, 'F')

  doc.setTextColor(255, 253, 249)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(23)
  doc.text('KalaKriti', margin, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Every Creation Tells a Story', margin, 28)
  doc.text('ORDER INVOICE', rightEdge, 20, { align: 'right' })
  doc.text('Thank you for supporting handmade crafts', rightEdge, 28, {
    align: 'right',
  })

  y = 55

  doc.setTextColor(84, 35, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Invoice Details', margin, y)
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(70, 55, 50)

  const orderNumber = safeText(
    order.order_number || `Order #${order.id || ''}`
  )

  doc.text(`Order Number: ${orderNumber}`, margin, y)
  doc.text(`Order Date: ${formatDate(order.created_at || order.order_date)}`, margin, y + 7)
  doc.text(`Order Status: ${safeText(STATUS_LABELS[normalizeStatus(order.order_status)])}`, margin, y + 14)
  doc.text(
    `Payment: ${safeText(order.payment_method || 'COD').toUpperCase()} - ${safeText(order.payment_status || 'Pending')}`,
    margin,
    y + 21
  )

  y += 33
  line()

  // Customer details
  ensureSpace(35)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(84, 35, 42)
  doc.text('Customer & Delivery Details', margin, y)
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(70, 55, 50)

  const customerName = safeText(order.customer_name || 'Customer')
  const customerEmail = safeText(order.customer_email || '')
  const customerPhone = safeText(order.customer_phone || '')
  const address = safeText(getShippingAddress(order.shipping_address))

  doc.text(`Name: ${customerName}`, margin, y)
  y += 6

  if (customerEmail) {
    doc.text(`Email: ${customerEmail}`, margin, y)
    y += 6
  }

  if (customerPhone) {
    doc.text(`Phone: ${customerPhone}`, margin, y)
    y += 6
  }

  doc.text('Delivery Address:', margin, y)
  y += 6

  const addressLines = doc.splitTextToSize(address, pageWidth - margin * 2)
  ensureSpace(addressLines.length * 5 + 10)
  doc.text(addressLines, margin, y)
  y += addressLines.length * 5 + 5

  line()

  // Product table
  ensureSpace(30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(84, 35, 42)
  doc.text('Order Items', margin, y)
  y += 9

  const colName = margin
  const colQty = pageWidth - 80
  const colPrice = pageWidth - 56
  const colTotal = rightEdge

  const drawTableHeader = () => {
    doc.setFillColor(248, 241, 231)
    doc.rect(margin, y - 5, pageWidth - margin * 2, 10, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(84, 35, 42)
    doc.text('PRODUCT', colName + 2, y + 1)
    doc.text('QTY', colQty, y + 1, { align: 'right' })
    doc.text('UNIT PRICE', colPrice, y + 1, { align: 'right' })
    doc.text('TOTAL', colTotal - 2, y + 1, { align: 'right' })
    y += 11
  }

  drawTableHeader()

  const items = Array.isArray(order.items) ? order.items : []

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(55, 45, 40)

  items.forEach((item) => {
    const nameLines = doc.splitTextToSize(
      safeText(getItemName(item)),
      colQty - colName - 18
    )
    const rowHeight = Math.max(8, nameLines.length * 5 + 3)

    ensureSpace(rowHeight + 5)

    if (y === 20) {
      drawTableHeader()
    }

    doc.text(nameLines, colName + 2, y)
    doc.text(String(Number(item.quantity || 0)), colQty, y, {
      align: 'right',
    })
    doc.text(money(getItemPrice(item)), colPrice, y, {
      align: 'right',
    })
    doc.text(money(getItemTotal(item)), colTotal - 2, y, {
      align: 'right',
    })

    y += rowHeight
    doc.setDrawColor(238, 230, 215)
    doc.line(margin, y - 2, rightEdge, y - 2)
  })

  y += 5
  line()

  // Totals
  const subtotal = Number(order.subtotal || 0)
  const discount = Number(order.discount_amount || 0)
  const shipping = Number(order.shipping_fee || 0)
  const total = Number(order.total_amount || 0)

  const addTotalRow = (label, value, options = {}) => {
    ensureSpace(10)

    doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
    doc.setFontSize(options.bold ? 11 : 10)
    doc.setTextColor(
      ...(options.discount ? [30, 120, 70] : [70, 55, 50])
    )

    doc.text(label, pageWidth - 85, y)
    doc.text(money(value), rightEdge, y, { align: 'right' })
    y += 8
  }

  addTotalRow('Subtotal', subtotal)
  if (order.coupon_code || discount > 0) {
    addTotalRow(
      `Discount${order.coupon_code ? ` (${safeText(order.coupon_code)})` : ''}`,
      -discount,
      { discount: true }
    )
  }
  addTotalRow('Shipping', shipping)
  y += 2
  addTotalRow('Grand Total', total, { bold: true })

  y += 8
  ensureSpace(20)
  line()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 80, 70)
  doc.text(
    'This invoice was generated electronically by KalaKriti.',
    pageWidth / 2,
    y,
    { align: 'center' }
  )
  y += 6
  doc.text(
    'Thank you for choosing handmade.',
    pageWidth / 2,
    y,
    { align: 'center' }
  )

  const safeOrderNumber = orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`KalaKriti-Invoice-${safeOrderNumber}.pdf`)
}

function OrderStatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[normalizedStatus]
      }`}
    >
      {normalizedStatus === 'cancelled' ? (
        <XCircle size={14} />
      ) : normalizedStatus === 'delivered' ? (
        <CheckCircle2 size={14} />
      ) : (
        <Clock size={14} />
      )}
      {STATUS_LABELS[normalizedStatus]}
    </span>
  )
}

function OrderTracking({ status }) {
  const normalizedStatus = normalizeStatus(status)

  if (normalizedStatus === 'cancelled') {
    return (
      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <XCircle size={22} className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              This order has been cancelled
            </p>
            <p className="mt-1 text-xs leading-5 text-red-700">
              The order will not proceed to delivery. Contact support if you
              need help with this order.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentStep = ORDER_STEPS.findIndex(
    (step) => step.status === normalizedStatus
  )

  return (
    <div className="mt-5 rounded-xl border border-gold/20 bg-ivory/40 p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-burgundy">
          Order Tracking
        </h3>
        <span className="text-xs text-burgundy/60">
          Step {currentStep + 1} of {ORDER_STEPS.length}
        </span>
      </div>

      <div className="relative">
        <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-gold/20" />
        <div
          className="absolute left-[15px] top-4 w-0.5 bg-maroon transition-all"
          style={{
            height: `${(Math.max(currentStep, 0) / (ORDER_STEPS.length - 1)) * 100}%`,
            maxHeight: 'calc(100% - 32px)',
          }}
        />

        <div className="relative space-y-5">
          {ORDER_STEPS.map((step, index) => {
            const Icon = step.icon
            const completed = index <= currentStep
            const current = index === currentStep

            return (
              <div key={step.status} className="flex items-center gap-3">
                <div
                  className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    completed
                      ? 'border-maroon bg-maroon text-white'
                      : 'border-gold/30 bg-white text-burgundy/35'
                  }`}
                >
                  {completed ? (
                    index < currentStep ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <Icon size={16} />
                    )
                  ) : (
                    <Circle size={16} />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <p
                    className={`text-sm ${
                      current
                        ? 'font-semibold text-maroon'
                        : completed
                          ? 'font-medium text-burgundy'
                          : 'text-burgundy/45'
                    }`}
                  >
                    {step.label}
                  </p>

                  {current && (
                    <span className="shrink-0 rounded-full bg-maroon/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-maroon">
                      Current
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {normalizedStatus === 'delivered' && (
        <p className="mt-5 border-t border-gold/20 pt-4 text-sm text-green-700">
          Your handmade creation has been marked as delivered.
        </p>
      )}
    </div>
  )
}

function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const response = await api.get('/orders/my-orders')
      const result = response.data

      if (!result?.success) {
        throw new Error(result?.message || 'Unable to load your orders.')
      }

      const data = result.data
      setOrders(Array.isArray(data) ? data : data ? [data] : [])
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load your orders. Please try again.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return (
    <main className="min-h-screen bg-warm-white px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-gold/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">
              Your KalaKriti collection
            </p>
            <h1 className="mt-3 font-display text-3xl text-burgundy sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-3 text-sm leading-6 text-burgundy/70">
              Keep track of your handmade creations and delivery progress.
            </p>
          </div>

          {!loading && !error && orders.length > 0 && (
            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-maroon/20 px-4 py-2.5 text-sm font-medium text-maroon transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw
                size={15}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh Orders
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-burgundy/70">
            <RefreshCw size={28} className="animate-spin text-maroon" />
            <p className="mt-4 text-sm">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-12 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => loadOrders(false)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm text-white transition hover:bg-burgundy"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gold/20 bg-ivory/50 px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white">
              <ShoppingBag size={30} className="text-maroon" />
            </div>
            <h2 className="mt-5 font-display text-2xl text-burgundy">
              No orders yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-burgundy/70">
              Your handmade favourites are waiting for you. Explore our
              collection and place your first order.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm text-white transition hover:bg-burgundy"
            >
              Explore Creations
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-burgundy/70">
              <Package size={18} className="text-maroon" />
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
            </div>

            {orders.map((order) => {
              const status = normalizeStatus(order.order_status)

              return (
                <article
                  key={order.id || order.order_number}
                  className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-gold/20 bg-ivory/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <p className="text-xs text-burgundy/60">Order number</p>
                      <p className="mt-1 break-all text-sm font-semibold text-maroon">
                        {order.order_number || `Order #${order.id}`}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs text-burgundy/60">Order date</p>
                      <p className="mt-1 text-sm font-medium text-burgundy">
                        {formatDate(order.created_at || order.order_date)}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-display text-lg text-burgundy">
                        Order Status
                      </h2>
                      <OrderStatusBadge status={status} />
                    </div>

                    <OrderTracking status={status} />

                    <div className="mt-6 border-t border-gold/20 pt-5">
                      <h3 className="mb-4 text-sm font-semibold text-burgundy">
                        Items in this order
                      </h3>
                      <div className="space-y-4">
                        {(order.items || []).map((item, index) => (
                          <div
                            key={
                              item.id ||
                              `${order.id || order.order_number}-${index}`
                            }
                            className="flex items-start justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-burgundy">
                                {getItemName(item)}
                              </p>
                              <p className="mt-1 text-xs text-burgundy/60">
                                Quantity: {item.quantity}
                              </p>
                              <p className="mt-1 text-xs text-burgundy/60">
                                Unit price: {formatPrice(getItemPrice(item))}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-medium text-maroon">
                              {formatPrice(getItemTotal(item))}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.shipping_address && (
                      <div className="mt-5 flex items-start gap-2 border-t border-gold/20 pt-4 text-xs leading-5 text-burgundy/70">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0 text-maroon"
                        />
                        <div>
                          <p className="mb-1 font-semibold text-burgundy">
                            Delivery Address
                          </p>
                          <p>{getShippingAddress(order.shipping_address)}</p>
                        </div>
                      </div>
                    )}

                    {order.coupon_code && (
                      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        Coupon applied: <strong>{order.coupon_code}</strong>
                        {' — '}
                        You saved {formatPrice(order.discount_amount)}.
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-4 border-t border-gold/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-2 text-burgundy">
                          <Clock size={14} />
                          Payment: {order.payment_status || 'Pending'}
                        </span>
                        <span className="rounded-full bg-ivory px-3 py-2 text-burgundy">
                          {String(order.payment_method || 'cod').toLowerCase() === 'cod'
                            ? 'Cash on Delivery'
                            : order.payment_method}
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs text-burgundy/60">Order total</p>
                        <p className="mt-1 text-xl font-semibold text-maroon">
                          {formatPrice(order.total_amount)}
                        </p>
                        {Number(order.shipping_fee) > 0 && (
                          <p className="mt-1 text-xs text-burgundy/60">
                            Includes shipping of {formatPrice(order.shipping_fee)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gold/20 pt-5">
                      <button
                        type="button"
                        onClick={() => downloadInvoice(order)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-maroon px-5 py-3 text-sm font-semibold text-white transition hover:bg-burgundy sm:w-auto"
                      >
                        <Download size={17} />
                        Download Invoice PDF
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}

            <div className="pt-2 text-center">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full border border-maroon px-6 py-3 text-sm font-medium text-maroon transition hover:bg-maroon hover:text-white"
              >
                Continue Shopping
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default MyOrders
