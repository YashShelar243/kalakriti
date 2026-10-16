
import { useEffect, useState } from 'react'
import {
  Store,
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  RefreshCw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const initialStats = {
  totalProducts: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalRevenue: 0,
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-[#C5A15B]/20 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-3 text-2xl font-bold text-[#54232A]">
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>

        <div className="rounded-xl bg-[#F8F1E7] p-3 text-[#762C36]">
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function StoreOverview() {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchOverview() {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/admin/dashboard')
      const data = response.data?.data ?? response.data

      setStats({
        totalProducts: Number(data.totalProducts ?? 0),
        totalOrders: Number(data.totalOrders ?? 0),
        totalCustomers: Number(data.totalCustomers ?? 0),
        totalRevenue: Number(data.totalRevenue ?? 0),
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load store information. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#762C36]">
              <Store size={18} />
              Store Management
            </div>

            <h1 className="mt-2 text-3xl font-bold text-[#54232A]">
              Store Overview
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Review your KalaKriti store's key statistics and management links.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#762C36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#54232A] disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh Overview
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <p className="font-semibold">Could not load store statistics</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Products"
            value={loading ? '—' : stats.totalProducts.toLocaleString('en-IN')}
            icon={Package}
            description="Products in your catalogue"
          />

          <StatCard
            title="Total Orders"
            value={loading ? '—' : stats.totalOrders.toLocaleString('en-IN')}
            icon={ShoppingBag}
            description="Orders recorded by the store"
          />

          <StatCard
            title="Total Customers"
            value={loading ? '—' : stats.totalCustomers.toLocaleString('en-IN')}
            icon={Users}
            description="Registered customer accounts"
          />

          <StatCard
            title="Total Revenue"
            value={loading ? '—' : formatCurrency(stats.totalRevenue)}
            icon={IndianRupee}
            description="Revenue reported by the dashboard API"
          />
        </div>

        <section className="mt-8 rounded-2xl border border-[#C5A15B]/20 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold text-[#54232A]">
            Store Management
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Access the main tools for running your handmade products store.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link
              to="/admin/products"
              className="group flex items-center justify-between gap-4 rounded-xl border border-[#C5A15B]/25 p-5 transition hover:border-[#762C36]/40 hover:bg-[#F8F1E7]/60"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-[#F8F1E7] p-3 text-[#762C36]">
                  <Package size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-[#54232A]">
                    Manage Products
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add, edit, and manage product availability.
                  </p>
                </div>
              </div>

              <ArrowRight
                size={19}
                className="shrink-0 text-[#762C36] transition group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/admin/orders"
              className="group flex items-center justify-between gap-4 rounded-xl border border-[#C5A15B]/25 p-5 transition hover:border-[#762C36]/40 hover:bg-[#F8F1E7]/60"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-[#F8F1E7] p-3 text-[#762C36]">
                  <ShoppingBag size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-[#54232A]">
                    Manage Orders
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    View orders and update their status.
                  </p>
                </div>
              </div>

              <ArrowRight
                size={19}
                className="shrink-0 text-[#762C36] transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>

        <div className="mt-6 text-sm text-gray-500">
          Store statistics are provided by your existing admin dashboard API.
        </div>
      </div>
    </main>
  )
}

export default StoreOverview
