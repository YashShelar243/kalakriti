
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Clock,
  Plus,
  Boxes,
  Settings,
  BarChart3,
} from 'lucide-react'
import api from '../../services/api'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))

const formatDate = (date) =>
  new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const statusStyles = {
  placed: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  processing: 'bg-amber-50 text-amber-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#eee2d5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold text-[#54232A]">
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-[#F8F1E7] p-3 text-[#762C36]">
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, to, icon: Icon, action }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-[#eee2d5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C5A15B] hover:shadow-md"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="shrink-0 rounded-xl bg-[#F8F1E7] p-3 text-[#762C36] transition group-hover:bg-[#762C36] group-hover:text-white">
          <Icon size={24} />
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-[#54232A]">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#762C36]">
        <span className="hidden sm:inline">{action}</span>
        <ArrowRight
          size={18}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/admin/dashboard')

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || 'Unable to load dashboard.'
        )
      }

      setDashboard(response.data.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load dashboard. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="mx-auto animate-spin text-[#762C36]"
            size={32}
          />
          <p className="mt-4 text-sm text-gray-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-red-800">
            Unable to load dashboard
          </h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-5 rounded-lg bg-[#762C36] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#54232A]"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const products = dashboard.products
  const orders = dashboard.orders
  const recentOrders = dashboard.recentOrders || []

  return (
    <main className="min-h-screen bg-[#FCF9F5] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium tracking-widest text-[#C5A15B]">
              KALAKRITI ADMIN
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#54232A]">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              A quick overview of your handmade crafts store.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#e6d6c5] bg-white px-4 py-3 text-sm font-semibold text-[#762C36] hover:bg-[#F8F1E7] sm:self-auto"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Dashboard statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Sales"
            value={formatCurrency(dashboard.totalSales)}
            subtitle="Orders marked as paid"
            icon={IndianRupee}
          />

          <StatCard
            title="Total Orders"
            value={orders.total_orders}
            subtitle={`${orders.new_orders} newly placed`}
            icon={ShoppingBag}
          />

          <StatCard
            title="Total Products"
            value={products.total_products}
            subtitle={`${products.active_products} active products`}
            icon={Package}
          />

          <StatCard
            title="Customers"
            value={dashboard.totalCustomers}
            subtitle="Registered customer accounts"
            icon={Users}
          />
        </div>

        {/* Quick actions */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#54232A]">
              Store Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your products, customer orders and store performance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QuickActionCard
              title="Manage Products"
              description="Add handmade products, edit prices, update stock, and control shop visibility."
              to="/admin/products"
              icon={Boxes}
              action="Manage"
            />

            <QuickActionCard
              title="Manage Orders"
              description="View customer orders, check order details, and update delivery status."
              to="/admin/orders"
              icon={ShoppingBag}
              action="View orders"
            />

            <QuickActionCard
              title="Sales Reports"
              description="Review sales trends, paid orders, coupon discounts, and best-selling products."
              to="/admin/sales-reports"
              icon={BarChart3}
              action="View reports"
            />

            <QuickActionCard
              title="Add New Product"
              description="Quickly open the product form to add a new craft to your store."
              to="/admin/products"
              icon={Plus}
              action="Add product"
            />

            <QuickActionCard
              title="Store Overview"
              description="Review your sales, inventory levels, customers, and recent orders."
              to="/admin/dashboard"
              icon={Settings}
              action="Dashboard"
            />
          </div>
        </section>

        {/* Alerts and delivered orders */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="rounded-xl bg-white p-3 text-amber-700">
              <AlertTriangle size={22} />
            </div>

            <div>
              <p className="text-sm font-medium text-amber-800">
                Low Stock Products
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900">
                {products.low_stock_products}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Active products with 5 or fewer items
              </p>
              <Link
                to="/admin/products"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:underline"
              >
                Check inventory
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eee2d5] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-3 text-green-700">
                <ShoppingBag size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivered Orders</p>
                <p className="mt-1 text-2xl font-bold text-[#54232A]">
                  {orders.delivered_orders}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Cancelled orders: {orders.cancelled_orders}
            </p>
          </div>
        </div>

        {/* Recent orders */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-[#eee2d5] bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-[#eee2d5] p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#54232A]">
                Recent Orders
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                The latest orders placed by your customers.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              Latest 10 orders
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <ShoppingBag
                className="mx-auto text-gray-300"
                size={38}
              />
              <p className="mt-3 font-semibold text-[#54232A]">
                No orders yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                New customer orders will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#FCF9F5] text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Order</th>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Payment</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f1e8df]">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FCF9F5]">
                      <td className="px-5 py-4 font-semibold text-[#762C36]">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {order.customer_name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#54232A]">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-5 py-4 capitalize text-gray-600">
                        {order.payment_status}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusStyles[order.order_status] ||
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[#eee2d5] p-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#762C36] hover:text-[#54232A]"
            >
              Manage orders
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/admin/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#762C36] hover:text-[#54232A]"
            >
              Manage products
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
