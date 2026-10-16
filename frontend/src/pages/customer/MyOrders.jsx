
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Clock,
  MapPin,
} from 'lucide-react'
import api from '../../services/api'

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

function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadOrders() {
    try {
      setLoading(true)
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
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return (
    <main className="min-h-screen bg-warm-white px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 border-b border-gold/20 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Your KalaKriti collection
          </p>

          <h1 className="mt-3 font-display text-3xl text-burgundy sm:text-4xl">
            My Orders
          </h1>

          <p className="mt-3 text-sm leading-6 text-burgundy/70">
            Keep track of the handmade creations you have ordered.
          </p>
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
              onClick={loadOrders}
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

            {orders.map((order) => (
              <article
                key={order.id || order.order_number}
                className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-gold/20 bg-ivory/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-xs text-burgundy/60">Order number</p>
                    <p className="mt-1 break-all text-sm font-semibold text-maroon">
                      {order.order_number}
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
                  <div className="space-y-4">
                    {(order.items || []).map((item, index) => (
                      <div
                        key={item.id || `${order.id}-${index}`}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-burgundy">
                            {item.product_name || item.name || 'Handmade product'}
                          </p>
                          <p className="mt-1 text-xs text-burgundy/60">
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-medium text-maroon">
                          {formatPrice(
                            item.line_total ??
                              Number(item.unit_price || 0) *
                                Number(item.quantity || 0)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>

                  {order.shipping_address && (
                    <div className="mt-5 flex items-start gap-2 border-t border-gold/20 pt-4 text-xs leading-5 text-burgundy/70">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-maroon" />
                      <p>
                        {[
                          order.shipping_address.address,
                          order.shipping_address.city,
                          order.shipping_address.state,
                          order.shipping_address.pincode,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
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
                    </div>
                  </div>
                </div>
              </article>
            ))}

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
