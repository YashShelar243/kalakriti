
import { useEffect, useState } from 'react'
import {
  TicketPercent,
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react'
import api from '../../services/api'

const emptyForm = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '10',
  min_order_amount: '500',
  max_discount_amount: '150',
  usage_limit: '100',
  starts_at: '',
  expires_at: '',
  is_active: true,
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function toLocalDateTime(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function ManageCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })

  async function loadCoupons() {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/coupons')

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to load coupons.')
      }

      const data = response.data.data
      setCoupons(Array.isArray(data) ? data : data?.coupons || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load coupons.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  function openCreateForm() {
    setEditingCoupon(null)
    setForm({ ...emptyForm })
    setError('')
    setNotice('')
    setShowForm(true)
  }

  function openEditForm(coupon) {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: String(coupon.discount_value ?? ''),
      min_order_amount: String(coupon.min_order_amount ?? 0),
      max_discount_amount:
        coupon.max_discount_amount == null
          ? ''
          : String(coupon.max_discount_amount),
      usage_limit:
        coupon.usage_limit == null ? '' : String(coupon.usage_limit),
      starts_at: toLocalDateTime(coupon.starts_at),
      expires_at: toLocalDateTime(coupon.expires_at),
      is_active: Boolean(coupon.is_active),
    })

    setError('')
    setNotice('')
    setShowForm(true)
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
    setEditingCoupon(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    const discountValue = Number(form.discount_value)
    const minimum = Number(form.min_order_amount)
    const maximum =
      form.max_discount_amount.trim() === ''
        ? null
        : Number(form.max_discount_amount)
    const usageLimit =
      form.usage_limit.trim() === '' ? null : Number(form.usage_limit)

    if (!/^[A-Z0-9_-]{3,50}$/.test(form.code.trim().toUpperCase())) {
      setError('Coupon code must be 3–50 letters, numbers, hyphens or underscores.')
      return
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setError('Enter a valid discount value greater than zero.')
      return
    }

    if (form.discount_type === 'percentage' && discountValue > 100) {
      setError('Percentage discount cannot exceed 100%.')
      return
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
      setError('Minimum order amount cannot be negative.')
      return
    }

    if (maximum !== null && (!Number.isFinite(maximum) || maximum <= 0)) {
      setError('Maximum discount must be greater than zero, or left empty.')
      return
    }

    if (
      usageLimit !== null &&
      (!Number.isSafeInteger(usageLimit) || usageLimit <= 0)
    ) {
      setError('Usage limit must be a positive whole number, or left empty.')
      return
    }

    if (
      form.starts_at &&
      form.expires_at &&
      new Date(form.expires_at) <= new Date(form.starts_at)
    ) {
      setError('Expiry date must be later than the start date.')
      return
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discount_type: form.discount_type,
      discount_value: discountValue,
      min_order_amount: minimum,
      max_discount_amount: maximum,
      usage_limit: usageLimit,
      starts_at: form.starts_at
        ? new Date(form.starts_at).toISOString()
        : null,
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
      is_active: form.is_active,
    }

    setSaving(true)

    try {
      const response = editingCoupon
        ? await api.put(`/coupons/${editingCoupon.id}`, payload)
        : await api.post('/coupons', payload)

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to save coupon.')
      }

      setNotice(
        editingCoupon
          ? 'Coupon updated successfully.'
          : 'Coupon created successfully.'
      )

      setShowForm(false)
      setEditingCoupon(null)
      await loadCoupons()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to save coupon.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleCoupon(coupon) {
    setError('')
    setNotice('')

    try {
      const response = await api.patch(`/coupons/${coupon.id}/status`, {
        is_active: !coupon.is_active,
      })

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to update coupon.')
      }

      setNotice(
        `Coupon ${coupon.is_active ? 'deactivated' : 'activated'} successfully.`
      )

      await loadCoupons()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to update coupon status.'
      )
    }
  }

  async function deleteCoupon(coupon) {
    const confirmed = window.confirm(
      `Delete coupon "${coupon.code}"? Existing orders will retain their recorded discount.`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const response = await api.delete(`/coupons/${coupon.id}`)

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to delete coupon.')
      }

      setNotice(`Coupon ${coupon.code} deleted successfully.`)
      await loadCoupons()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to delete coupon.'
      )
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C5A15B]">
              KalaKriti Admin
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-[#54232A]">
              Coupon management
            </h1>

            <p className="mt-2 text-sm text-stone-600">
              Create promotional codes and manage discounts for your customers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadCoupons}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#762C36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#54232A]"
            >
              <Plus size={18} />
              Create coupon
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Total coupons</p>
            <p className="mt-2 text-3xl font-semibold text-[#54232A]">
              {coupons.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Active coupons</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">
              {coupons.filter((coupon) => coupon.is_active).length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Inactive coupons</p>
            <p className="mt-2 text-3xl font-semibold text-stone-600">
              {coupons.filter((coupon) => !coupon.is_active).length}
            </p>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-stone-200 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8F1E7] text-[#762C36]">
              <TicketPercent size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-[#54232A]">All promo codes</h2>
              <p className="mt-1 text-sm text-stone-500">
                Review discounts, validity, and usage.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-stone-600">
              <LoaderCircle size={22} className="animate-spin" />
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center">
              <TicketPercent className="mx-auto text-[#C5A15B]" size={42} />
              <h3 className="mt-4 font-semibold text-[#54232A]">
                No coupons found
              </h3>
              <p className="mt-2 text-sm text-stone-500">
                Create your first promo code to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-4">Coupon</th>
                    <th className="px-5 py-4">Discount</th>
                    <th className="px-5 py-4">Minimum order</th>
                    <th className="px-5 py-4">Usage</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-stone-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#54232A]">
                          {coupon.code}
                        </p>
                        <p className="mt-1 max-w-xs text-xs text-stone-500">
                          {coupon.description || 'No description'}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-medium text-stone-800">
                        {coupon.discount_type === 'percentage'
                          ? `${Number(coupon.discount_value)}%`
                          : formatPrice(coupon.discount_value)}

                        {coupon.discount_type === 'percentage' &&
                          coupon.max_discount_amount != null && (
                            <p className="mt-1 text-xs text-stone-500">
                              Max {formatPrice(coupon.max_discount_amount)}
                            </p>
                          )}
                      </td>

                      <td className="px-5 py-4 text-stone-700">
                        {formatPrice(coupon.min_order_amount)}
                      </td>

                      <td className="px-5 py-4 text-stone-700">
                        {coupon.used_count} / {coupon.usage_limit ?? '∞'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            coupon.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(coupon)}
                            title="Edit coupon"
                            className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCoupon(coupon)}
                            title={coupon.is_active ? 'Deactivate coupon' : 'Activate coupon'}
                            className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100"
                          >
                            <Power size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteCoupon(coupon)}
                            title="Delete coupon"
                            className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
            <div className="flex min-h-full items-center justify-center py-6">
              <section className="w-full max-w-2xl rounded-3xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-200 p-5 sm:p-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#54232A]">
                      {editingCoupon ? 'Edit coupon' : 'Create coupon'}
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Configure the discount and validity period.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    aria-label="Close coupon form"
                    className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
                  >
                    <X size={21} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="coupon-code" className="text-sm font-medium text-stone-700">
                        Coupon code *
                      </label>
                      <input
                        id="coupon-code"
                        name="code"
                        value={form.code}
                        onChange={handleFormChange}
                        required
                        maxLength={50}
                        placeholder="e.g. KALA10"
                        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 uppercase outline-none focus:border-[#762C36]"
                      />
                    </div>

                    <div>
                      <label htmlFor="coupon-type" className="text-sm font-medium text-stone-700">
                        Discount type *
                      </label>
                      <select
                        id="coupon-type"
                        name="discount_type"
                        value={form.discount_type}
                        onChange={handleFormChange}
                        className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed amount (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="discount-value" className="text-sm font-medium text-stone-700">
                        Discount value *
                      </label>
                      <input
                        id="discount-value"
                        name="discount_value"
                        type="number"
                        min="0.01"
                        max={form.discount_type === 'percentage' ? 100 : undefined}
                        step="0.01"
                        value={form.discount_value}
                        onChange={handleFormChange}
                        required
                        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#762C36]"
                      />
                    </div>

                    <div>
                      <label htmlFor="minimum-order" className="text-sm font-medium text-stone-700">
                        Minimum order amount (₹)
                      </label>
                      <input
                        id="minimum-order"
                        name="min_order_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.min_order_amount}
                        onChange={handleFormChange}
                        required
                        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#762C36]"
                      />
                    </div>

                    <div>
                      <label htmlFor="maximum-discount" className="text-sm font-medium text-stone-700">
                        Maximum discount (₹)
                      </label>
                      <input
                        id="maximum-discount"
                        name="max_discount_amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.max_discount_amount}
                        onChange={handleFormChange}
                        placeholder="Leave blank for no cap"
                        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#762C36]"
                      />
                      <p className="mt-1 text-xs text-stone-500">
                        Mainly used for percentage discounts.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="usage-limit" className="text-sm font-medium text-stone-700">
                        Total usage limit
                      </label>
                      <input
                        id="usage-limit"
                        name="usage_limit"
                        type="number"
                        min="1"
                        step="1"
                        value={form.usage_limit}
                        onChange={handleFormChange}
                        placeholder="Leave blank for unlimited"
                        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#762C36]"
                      />
                    </div>

                    <div>
                      <label htmlFor="starts-at" className="text-sm font-medium text-stone-700">
                        Starts at
                      </label>
                      <input
                        id="starts-at"
                        name="starts_at"
                        type="datetime-local"
                        value={form.starts_at}
                        onChange={handleFormChange}
                        className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm outline-none focus:border-[#762C36]"
                      />
                    </div>

                    <div>
                      <label htmlFor="expires-at" className="text-sm font-medium text-stone-700">
                        Expires at
                      </label>
                      <input
                        id="expires-at"
                        name="expires_at"
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={handleFormChange}
                        className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm outline-none focus:border-[#762C36]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="coupon-description" className="text-sm font-medium text-stone-700">
                        Description
                      </label>
                      <textarea
                        id="coupon-description"
                        name="description"
                        value={form.description}
                        onChange={handleFormChange}
                        rows={2}
                        maxLength={255}
                        placeholder="Describe the promotion for your own reference"
                        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#762C36]"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl bg-[#F8F1E7] p-4 sm:col-span-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleFormChange}
                        className="h-4 w-4 accent-[#762C36]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[#54232A]">
                          Coupon is active
                        </span>
                        <span className="mt-1 block text-xs text-stone-600">
                          Customers can use this coupon while it is active and valid.
                        </span>
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={saving}
                      className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#762C36] px-5 py-3 text-sm font-semibold text-white hover:bg-[#54232A] disabled:opacity-60"
                    >
                      {saving && <LoaderCircle size={17} className="animate-spin" />}
                      {saving
                        ? 'Saving...'
                        : editingCoupon
                          ? 'Save changes'
                          : 'Create coupon'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default ManageCoupons
