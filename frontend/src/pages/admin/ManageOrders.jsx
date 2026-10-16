
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  X,
  Package,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react'
import api from '../../services/api'

const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

const STATUS_STYLES = {
  placed: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  processing: 'bg-amber-50 text-amber-800',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))

const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {status || 'unknown'}
    </span>
  )
}

function OrderDetailsModal({ order, onClose, onStatusUpdated }) {
  const [selectedStatus, setSelectedStatus] = useState(order.order_status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isFinal =
    order.order_status === 'delivered' ||
    order.order_status === 'cancelled'

  const address = order.shipping_address || {}

  async function updateStatus() {
    if (selectedStatus === order.order_status) return

    const confirmation =
      selectedStatus === 'cancelled'
        ? 'Cancel this order? Its product stock will be restored.'
        : `Change this order status to "${selectedStatus}"?`

    if (!window.confirm(confirmation)) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.patch(
        `/orders/admin/${order.id}/status`,
        { orderStatus: selectedStatus }
      )

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Could not update status.')
      }

      setSuccess('Order status updated successfully.')
      onStatusUpdated(response.data.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to update order status.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#eee2d5] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#C5A15B]">
              ORDER DETAILS
            </p>
            <h2
              id="order-details-title"
              className="mt-1 break-all text-lg font-bold text-[#54232A]"
            >
              {order.order_number}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#eee2d5] p-4">
              <p className="text-xs text-gray-500">Order date</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#54232A]">
                <CalendarDays size={16} />
                {formatDate(order.created_at)}
              </p>
            </div>

            <div className="rounded-xl border border-[#eee2d5] p-4">
              <p className="text-xs text-gray-500">Total amount</p>
              <p className="mt-2 flex items-center gap-1 text-xl font-bold text-[#762C36]">
                <IndianRupee size={19} />
                {Number(order.total_amount || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-[#54232A]">
              <ShoppingBag size={18} />
              Customer information
            </h3>

            <div className="space-y-3 rounded-xl bg-[#FCF9F5] p-4 text-sm">
              <p className="font-semibold text-gray-800">
                {order.customer_name}
              </p>

              <p className="flex items-center gap-2 break-all text-gray-600">
                <Mail size={16} className="shrink-0" />
                {order.customer_email}
              </p>

              <p className="flex items-center gap-2 text-gray-600">
                <Phone size={16} className="shrink-0" />
                {order.customer_phone}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-[#54232A]">
              <MapPin size={18} />
              Delivery address
            </h3>

            <div className="rounded-xl bg-[#FCF9F5] p-4 text-sm leading-6 text-gray-700">
              <p>{address.address || 'Address unavailable'}</p>
              <p>
                {[address.city, address.state, address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-[#54232A]">
              <Package size={18} />
              Ordered items
            </h3>

            <div className="overflow-x-auto rounded-xl border border-[#eee2d5]">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-[#FCF9F5] text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Qty.</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee2d5]">
                  {(order.items || []).map((item, index) => (
                    <tr key={`${item.productId || item.name}-${index}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between border-t border-[#eee2d5] pt-3 font-bold text-[#54232A]">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#eee2d5] p-4">
            <h3 className="font-bold text-[#54232A]">Payment information</h3>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-gray-600">
                Method: <strong className="uppercase">{order.payment_method}</strong>
              </span>
              <span className="capitalize text-gray-700">
                Payment status: <strong>{order.payment_status}</strong>
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#eee2d5] p-4">
            <h3 className="font-bold text-[#54232A]">Update order status</h3>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(event.target.value)
                  setError('')
                  setSuccess('')
                }}
                disabled={isFinal || saving}
                className="min-w-0 flex-1 rounded-xl border border-[#e6d6c5] bg-white px-4 py-3 text-sm capitalize outline-none focus:border-[#762C36] disabled:bg-gray-100"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={updateStatus}
                disabled={
                  saving ||
                  isFinal ||
                  selectedStatus === order.order_status
                }
                className="rounded-xl bg-[#762C36] px-5 py-3 text-sm font-semibold text-white hover:bg-[#54232A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save status'}
              </button>
            </div>

            {isFinal && (
              <p className="mt-3 text-xs text-gray-500">
                Delivered and cancelled orders cannot be changed using this workflow.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function ManageOrders() {
  const [orders, setOrders] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/orders/admin', {
        params: {
          search,
          status,
          page,
          limit: 20,
        },
      })

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to load orders.')
      }

      setOrders(response.data.data.orders || [])
      setPagination(
        response.data.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load orders.'
      )
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  async function openOrder(orderId) {
    setDetailsLoading(true)
    setError('')

    try {
      const response = await api.get(`/orders/admin/${orderId}`)

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to load order.')
      }

      setSelectedOrder(response.data.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load order details.'
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleStatusUpdated(updatedOrder) {
    await loadOrders()

    if (selectedOrder) {
      setSelectedOrder((current) =>
        current
          ? {
              ...current,
              order_status: updatedOrder.order_status,
              payment_status:
                updatedOrder.payment_status ?? current.payment_status,
              updated_at: updatedOrder.updated_at ?? current.updated_at,
            }
          : current
      )
    }
  }

  function submitSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function changeStatusFilter(value) {
    setStatus(value)
    setPage(1)
  }

  return (
    <main className="min-h-screen bg-[#FCF9F5] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/admin/dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#762C36] hover:text-[#54232A]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest text-[#C5A15B]">
              KALAKRITI ADMIN
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#54232A]">
              Manage Orders
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              View customer purchases and manage order fulfilment.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#e6d6c5] bg-white px-4 py-3 text-sm font-semibold text-[#762C36] hover:bg-[#F8F1E7] disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#eee2d5] bg-white p-5">
            <p className="text-sm text-gray-500">Matching orders</p>
            <p className="mt-2 text-2xl font-bold text-[#54232A]">
              {pagination.total}
            </p>
          </div>
          <div className="rounded-2xl border border-[#eee2d5] bg-white p-5">
            <p className="text-sm text-gray-500">Current page</p>
            <p className="mt-2 text-2xl font-bold text-[#54232A]">
              {pagination.totalPages ? pagination.page : 0}
              <span className="text-base font-medium text-gray-400">
                {' '}of {pagination.totalPages}
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-[#eee2d5] bg-white p-5">
            <p className="text-sm text-gray-500">Orders per page</p>
            <p className="mt-2 text-2xl font-bold text-[#54232A]">
              {pagination.limit}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#eee2d5] bg-white shadow-sm">
          <div className="border-b border-[#eee2d5] p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <form
                onSubmit={submitSearch}
                className="flex min-w-0 flex-1 gap-2"
              >
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search order number, customer, email or phone"
                    className="w-full rounded-xl border border-[#e6d6c5] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#762C36]"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-[#762C36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#54232A]"
                >
                  Search
                </button>
              </form>

              <select
                value={status}
                onChange={(event) => changeStatusFilter(event.target.value)}
                className="rounded-xl border border-[#e6d6c5] bg-white px-4 py-3 text-sm capitalize outline-none focus:border-[#762C36]"
                aria-label="Filter orders by status"
              >
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={loadOrders}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8">
              <RefreshCw
                size={30}
                className="animate-spin text-[#762C36]"
              />
              <p className="mt-3 text-sm text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <ShoppingBag size={42} className="text-gray-300" />
              <h2 className="mt-4 font-bold text-[#54232A]">
                No orders found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or status filter.
              </p>
              {(search || status) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setSearchInput('')
                    setStatus('')
                    setPage(1)
                  }}
                  className="mt-4 text-sm font-semibold text-[#762C36] underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-[#FCF9F5] text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Order</th>
                      <th className="px-5 py-4 font-semibold">Customer</th>
                      <th className="px-5 py-4 font-semibold">Date</th>
                      <th className="px-5 py-4 font-semibold">Items</th>
                      <th className="px-5 py-4 font-semibold">Amount</th>
                      <th className="px-5 py-4 font-semibold">Payment</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f1e8df]">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-[#FCF9F5]"
                      >
                        <td className="px-5 py-4 font-semibold text-[#762C36]">
                          {order.order_number}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800">
                            {order.customer_name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {order.customer_email}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {order.item_count}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#54232A]">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="capitalize text-gray-600">
                            {order.payment_status}
                          </span>
                          <p className="mt-1 text-xs uppercase text-gray-400">
                            {order.payment_method}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={order.order_status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openOrder(order.id)}
                            disabled={detailsLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#e6d6c5] px-3 py-2 font-semibold text-[#762C36] hover:bg-[#F8F1E7] disabled:opacity-50"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-[#eee2d5] p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-gray-500">
                  Showing {pagination.total ? (page - 1) * pagination.limit + 1 : 0}
                  {' '}–{' '}
                  {Math.min(page * pagination.limit, pagination.total)}
                  {' '}of {pagination.total} orders
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#e6d6c5] px-3 py-2 text-sm font-semibold text-[#762C36] disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(pagination.totalPages, current + 1)
                      )
                    }
                    disabled={page >= pagination.totalPages || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#e6d6c5] px-3 py-2 text-sm font-semibold text-[#762C36] disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {detailsLoading && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-lg">
          <RefreshCw size={16} className="animate-spin text-[#762C36]" />
          Loading order details...
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </main>
  )
}
