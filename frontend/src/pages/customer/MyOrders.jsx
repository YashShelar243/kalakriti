
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
} from 'lucide-react'
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
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gold/20" />

        <div
          className="absolute left-[15px] top-4 w-0.5 bg-maroon transition-all"
          style={{
            height: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`,
            maxHeight: 'calc(100% - 32px)',
          }}
        />

        <div className="relative space-y-5">
          {ORDER_STEPS.map((step, index) => {
            const Icon = step.icon
            const completed = index <= currentStep
            const current = index === currentStep

            return (
              <div
                key={step.status}
                className="flex items-center gap-3"
              >
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
                      <p className="text-xs text-burgundy/60">
                        Order number
                      </p>
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
                                {item.product_name ||
                                  item.name ||
                                  'Handmade product'}
                              </p>

                              <p className="mt-1 text-xs text-burgundy/60">
                                Quantity: {item.quantity}
                              </p>

                              <p className="mt-1 text-xs text-burgundy/60">
                                Unit price:{' '}
                                {formatPrice(
                                  item.unit_price ?? item.unitPrice
                                )}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-medium text-maroon">
                              {formatPrice(
                                item.line_total ??
                                  item.lineTotal ??
                                  Number(
                                    item.unit_price ?? item.unitPrice ?? 0
                                  ) * Number(item.quantity || 0)
                              )}
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

                          <p>
                            {[
                              order.shipping_address.address,
                              order.shipping_address.city,
                              order.shipping_address.state,
                              order.shipping_address.pincode,
                            ]
                              .filter(Boolean)
                              .join(', ') || 'Address unavailable'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-4 border-t border-gold/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-2 text-burgundy">
                          <Clock size={14} />
                          Payment: {order.payment_status || 'Pending'}
                        </span>

                        <span className="rounded-full bg-ivory px-3 py-2 text-burgundy">
                          {String(
                            order.payment_method || 'cod'
                          ).toLowerCase() === 'cod'
                            ? 'Cash on Delivery'
                            : order.payment_method}
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs text-burgundy/60">
                          Order total
                        </p>
                        <p className="mt-1 text-xl font-semibold text-maroon">
                          {formatPrice(order.total_amount)}
                        </p>

                        {Number(order.shipping_fee) > 0 && (
                          <p className="mt-1 text-xs text-burgundy/60">
                            Includes shipping of{' '}
                            {formatPrice(order.shipping_fee)}
                          </p>
                        )}
                      </div>
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
