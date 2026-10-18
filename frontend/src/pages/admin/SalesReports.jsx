
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Tag,
  RefreshCw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'
import api from '../../services/api'

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`

const today = new Date()
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

const toDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function SalesReports() {
  const [startDate, setStartDate] = useState(toDateInput(firstDay))
  const [endDate, setEndDate] = useState(toDateInput(today))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/admin/sales-report', {
        params: { startDate, endDate },
      })

      setReport(response.data.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load sales report. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  const handleFilter = (event) => {
    event.preventDefault()
    loadReport()
  }

  const downloadCSV = () => {
    if (!report) return

    const rows = [
      ['Date', 'Orders', 'Sales (INR)'],
      ...report.dailySales.map((item) => [
        item.date,
        item.orders,
        item.sales,
      ]),
    ]

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\r\n')

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kalakriti-sales-${startDate}-to-${endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const summary = report?.summary || {}
  const cards = [
    {
      label: 'Order Value',
      value: formatPrice(summary.order_value),
      icon: IndianRupee,
    },
    {
      label: 'Paid Sales',
      value: formatPrice(summary.paid_sales),
      icon: TrendingUp,
    },
    {
      label: 'Total Orders',
      value: Number(summary.total_orders || 0).toLocaleString('en-IN'),
      icon: ShoppingBag,
    },
    {
      label: 'Coupon Discounts',
      value: formatPrice(summary.total_discounts),
      icon: Tag,
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8F1E7] px-4 py-6 text-[#54232A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm text-[#762C36] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Sales Reports
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Track sales, orders, discounts and popular products.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadCSV}
            disabled={!report || loading}
            className="rounded-lg bg-[#762C36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#54232A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        </header>

        <form
          onSubmit={handleFilter}
          className="flex flex-col gap-3 rounded-xl border border-[#E8DCCB] bg-white p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">
              Start date
            </label>
            <input
              type="date"
              required
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">
              End date
            </label>
            <input
              type="date"
              required
              value={endDate}
              min={startDate || undefined}
              max={toDateInput(today)}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C5A15B] px-5 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw size={16} />
            Apply Filter
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center">
            Loading sales report...
          </div>
        ) : report ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ label, value, icon: Icon }) => (
                <article
                  key={label}
                  className="rounded-xl border border-[#E8DCCB] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-600">{label}</p>
                    <Icon size={21} className="text-[#C5A15B]" />
                  </div>
                  <p className="mt-3 text-2xl font-bold">{value}</p>
                </article>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <article className="rounded-xl border border-[#E8DCCB] bg-white p-5 xl:col-span-2">
                <div className="mb-5 flex items-center gap-2">
                  <BarChart3 size={21} className="text-[#762C36]" />
                  <h2 className="text-lg font-bold">Daily Sales</h2>
                </div>

                {report.dailySales.length === 0 ? (
                  <p className="py-12 text-center text-gray-500">
                    No orders found for this date range.
                  </p>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.dailySales}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'sales' ? formatPrice(value) : value,
                            name === 'sales' ? 'Sales' : 'Orders',
                          ]}
                        />
                        <Bar
                          dataKey="sales"
                          fill="#762C36"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="rounded-xl border border-[#E8DCCB] bg-white p-5">
                <h2 className="mb-5 text-lg font-bold">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Total orders</span>
                    <strong>{summary.total_orders || 0}</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Delivered orders</span>
                    <strong>{summary.delivered_orders || 0}</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Paid orders</span>
                    <strong>{summary.paid_orders || 0}</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#E8DCCB] bg-white">
              <div className="border-b border-[#E8DCCB] p-5">
                <h2 className="text-lg font-bold">Best-Selling Products</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Top products ranked by units sold.
                </p>
              </div>

              {report.bestSellingProducts.length === 0 ? (
                <p className="p-8 text-center text-gray-500">
                  No product sales found for this date range.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-[#FBF7F1]">
                      <tr>
                        <th className="px-5 py-3">Product</th>
                        <th className="px-5 py-3 text-right">Units Sold</th>
                        <th className="px-5 py-3 text-right">Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.bestSellingProducts.map((product) => (
                        <tr
                          key={product.product_id || product.product_name}
                          className="border-t border-[#F0E7DB]"
                        >
                          <td className="px-5 py-4 font-medium">
                            {product.product_name}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {product.units_sold}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold">
                            {formatPrice(product.product_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
