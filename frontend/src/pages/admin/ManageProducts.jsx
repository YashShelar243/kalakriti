
import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import api from '../../services/api'

const emptyForm = {
  name: '',
  category_id: '',
  description: '',
  price: '',
  stock_quantity: '0',
  image_url: '',
  is_featured: false,
  is_active: true,
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

export default function ManageProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const fetchCategories = useCallback(async () => {
    const response = await api.get('/products/admin/categories')
    setCategories(response.data.data || [])
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {
        limit: pageSize,
        offset: page * pageSize,
      }

      if (search.trim()) params.search = search.trim()
      if (categoryId) params.categoryId = categoryId
      if (activeFilter !== 'all') {
        params.active = activeFilter === 'active' ? 'true' : 'false'
      }

      const response = await api.get('/products/admin', { params })

      setProducts(response.data.data || [])
      setTotal(response.data.pagination?.total || 0)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load products. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, activeFilter])

  useEffect(() => {
    fetchCategories().catch((err) => {
      setError(
        err.response?.data?.message ||
          'Unable to load product categories.'
      )
    })
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function openAddModal() {
    setEditingProduct(null)
    setForm({ ...emptyForm })
    setError('')
    setMessage('')
    setModalOpen(true)
  }

  function openEditModal(product) {
    setEditingProduct(product)

    setForm({
      name: product.name || '',
      category_id: product.category_id
        ? String(product.category_id)
        : '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stock_quantity: String(product.stock_quantity ?? 0),
      image_url: product.image_url || '',
      is_featured: Boolean(product.is_featured),
      is_active: Boolean(product.is_active),
    })

    setError('')
    setMessage('')
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setEditingProduct(null)
    setForm({ ...emptyForm })
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        price: form.price,
        stock_quantity: form.stock_quantity,
      }

      if (editingProduct) {
        await api.put(
          `/products/admin/${editingProduct.id}`,
          payload
        )
        setMessage('Product updated successfully.')
      } else {
        await api.post('/products', payload)
        setMessage('Product added successfully.')
      }

      setModalOpen(false)
      setEditingProduct(null)
      setForm({ ...emptyForm })
      await fetchProducts()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to save product. Please check the details.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(product) {
    const nextStatus = !product.is_active
    const action = nextStatus ? 'activate' : 'deactivate'

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${product.name}"?`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    try {
      await api.patch(`/products/admin/${product.id}/active`, {
        is_active: nextStatus,
      })

      setMessage(
        nextStatus
          ? 'Product activated successfully.'
          : 'Product deactivated successfully.'
      )

      await fetchProducts()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to change product status.'
      )
    }
  }

  async function handleDelete(product) {
    if (
      !window.confirm(
        `Permanently delete "${product.name}"? This cannot be undone.`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    try {
      await api.delete(`/products/admin/${product.id}`)
      setMessage('Product deleted successfully.')

      if (products.length === 1 && page > 0) {
        setPage((previous) => previous - 1)
      } else {
        await fetchProducts()
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to delete product. Products linked to orders must be deactivated instead.'
      )
    }
  }

  function handleSearchChange(event) {
    setSearch(event.target.value)
    setPage(0)
  }

  function handleCategoryChange(event) {
    setCategoryId(event.target.value)
    setPage(0)
  }

  function handleStatusChange(event) {
    setActiveFilter(event.target.value)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-[#F8F1E7] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#9A7541]">
              KalaKriti Administration
            </p>

            <h1 className="text-3xl font-bold text-[#54232A] sm:text-4xl">
              Manage Products
            </h1>

            <p className="mt-2 text-sm text-stone-600">
              Add products, manage inventory, and update your craft collection.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#762C36] px-5 py-3 font-semibold text-white transition hover:bg-[#54232A]"
          >
            <Plus size={19} />
            Add Product
          </button>
        </div>

        {message && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage('')}
              aria-label="Dismiss message"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {error && !modalOpen && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-[#E9DCCB] bg-[#FFFDF9] p-5">
            <div className="rounded-xl bg-[#F3E6D2] p-3 text-[#762C36]">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-stone-500">Matching Products</p>
              <p className="text-2xl font-bold text-[#54232A]">
                {total}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#E9DCCB] bg-[#FFFDF9] p-5">
            <div className="rounded-xl bg-green-100 p-3 text-green-700">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-sm text-stone-500">Active Products</p>
              <p className="text-sm font-semibold text-[#54232A]">
                Visible in the shop when in stock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#E9DCCB] bg-[#FFFDF9] p-5">
            <div className="rounded-xl bg-stone-100 p-3 text-stone-600">
              <EyeOff size={24} />
            </div>
            <div>
              <p className="text-sm text-stone-500">Product Visibility</p>
              <p className="text-sm font-semibold text-[#54232A]">
                Activate or deactivate anytime
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[#E9DCCB] bg-[#FFFDF9] p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="search"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search products..."
                className="w-full rounded-xl border border-[#E9DCCB] bg-white py-3 pl-10 pr-3 outline-none focus:border-[#762C36]"
              />
            </div>

            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="rounded-xl border border-[#E9DCCB] bg-white px-3 py-3 outline-none focus:border-[#762C36]"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {!category.is_active ? ' (Inactive)' : ''}
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={handleStatusChange}
              className="rounded-xl border border-[#E9DCCB] bg-white px-3 py-3 outline-none focus:border-[#762C36]"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={fetchProducts}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9C7B3] px-4 py-3 font-medium text-[#54232A] hover:bg-[#F8F1E7] disabled:opacity-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E9DCCB] bg-[#FFFDF9]">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-stone-500">
              <RefreshCw size={21} className="animate-spin" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <Package size={44} className="mb-4 text-[#B99B80]" />
              <h2 className="text-xl font-semibold text-[#54232A]">
                No products found
              </h2>
              <p className="mt-2 max-w-md text-sm text-stone-500">
                Try changing your filters, or add your first product.
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 rounded-xl bg-[#762C36] px-5 py-3 font-semibold text-white hover:bg-[#54232A]"
              >
                Add Product
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-[#F4E8D8] text-xs uppercase tracking-wider text-[#54232A]">
                    <tr>
                      <th className="px-5 py-4">Product</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Stock</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EFE4D7]">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-[#FCF6EE]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-14 w-14 rounded-xl border border-[#E9DCCB] object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F3E6D2] text-[#762C36]">
                                <Package size={24} />
                              </div>
                            )}

                            <div className="max-w-xs">
                              <p className="font-semibold text-[#54232A]">
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs text-stone-500">
                                {product.is_featured
                                  ? 'Featured product'
                                  : 'Regular product'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-stone-600">
                          {product.category_name || 'Uncategorized'}
                        </td>

                        <td className="px-5 py-4 font-semibold text-[#54232A]">
                          {formatPrice(product.price)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              Number(product.stock_quantity) === 0
                                ? 'font-semibold text-red-600'
                                : Number(product.stock_quantity) <= 5
                                  ? 'font-semibold text-amber-700'
                                  : 'text-stone-700'
                            }
                          >
                            {product.stock_quantity}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              product.is_active
                                ? 'inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800'
                                : 'inline-flex rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700'
                            }
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                              className="rounded-lg border border-[#E9DCCB] p-2 text-[#762C36] hover:bg-[#F3E6D2]"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleStatus(product)}
                              title={
                                product.is_active
                                  ? 'Deactivate product'
                                  : 'Activate product'
                              }
                              aria-label={
                                product.is_active
                                  ? `Deactivate ${product.name}`
                                  : `Activate ${product.name}`
                              }
                              className="rounded-lg border border-[#E9DCCB] p-2 text-stone-600 hover:bg-stone-100"
                            >
                              {product.is_active ? (
                                <EyeOff size={17} />
                              ) : (
                                <Eye size={17} />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              title="Delete product"
                              aria-label={`Delete ${product.name}`}
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

              <div className="flex flex-col gap-3 border-t border-[#E9DCCB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-stone-500">
                  Showing {page * pageSize + 1}–
                  {Math.min((page + 1) * pageSize, total)} of {total} products
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((previous) => previous - 1)}
                    className="rounded-lg border border-[#E9DCCB] px-4 py-2 text-sm font-medium text-[#54232A] hover:bg-[#F8F1E7] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-stone-600">
                    Page {page + 1} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((previous) => previous + 1)}
                    className="rounded-lg border border-[#E9DCCB] px-4 py-2 text-sm font-medium text-[#54232A] hover:bg-[#F8F1E7] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="w-full max-w-2xl rounded-2xl bg-[#FFFDF9] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E9DCCB] px-5 py-4 sm:px-7">
              <div>
                <h2
                  id="product-form-title"
                  className="text-xl font-bold text-[#54232A]"
                >
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Fill in the product details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-stone-500 hover:bg-[#F3E6D2] disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="product-name"
                  className="mb-2 block text-sm font-semibold text-[#54232A]"
                >
                  Product name *
                </label>
                <input
                  id="product-name"
                  name="name"
                  type="text"
                  required
                  maxLength={200}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Handmade Rangoli Sheet"
                  className="w-full rounded-xl border border-[#DCCBB8] bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="product-category"
                    className="mb-2 block text-sm font-semibold text-[#54232A]"
                  >
                    Category
                  </label>
                  <select
                    id="product-category"
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#DCCBB8] bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                  >
                    <option value="">No category</option>
                    {categories
                      .filter((category) => category.is_active)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="product-price"
                    className="mb-2 block text-sm font-semibold text-[#54232A]"
                  >
                    Price (₹) *
                  </label>
                  <input
                    id="product-price"
                    name="price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="299.00"
                    className="w-full rounded-xl border border-[#DCCBB8] bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-stock"
                    className="mb-2 block text-sm font-semibold text-[#54232A]"
                  >
                    Stock quantity *
                  </label>
                  <input
                    id="product-stock"
                    name="stock_quantity"
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.stock_quantity}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#DCCBB8] bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-image"
                    className="mb-2 block text-sm font-semibold text-[#54232A]"
                  >
                    Product image URL
                  </label>
                  <input
                    id="product-image"
                    name="image_url"
                    type="url"
                    value={form.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl border border-[#DCCBB8] bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                  />
                </div>
              </div>

              {form.image_url && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-[#54232A]">
                    Image preview
                  </p>
                  <img
                    src={form.image_url}
                    alt="Product preview"
                    className="h-36 w-36 rounded-xl border border-[#E9DCCB] object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                    onLoad={(event) => {
                      event.currentTarget.style.display = 'block'
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="product-description"
                  className="mb-2 block text-sm font-semibold text-[#54232A]"
                >
                  Description
                </label>
                <textarea
                  id="product-description"
                  name="description"
                  rows={4}
                  maxLength={10000}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the handmade product, materials, and details..."
                  className="w-full resize-y rounded-xl border border-[#DCCBB8] bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                />
              </div>

              <div className="space-y-3 rounded-xl bg-[#F8F1E7] p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#54232A]">
                  <input
                    name="is_featured"
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={handleChange}
                    className="h-4 w-4 accent-[#762C36]"
                  />
                  Show as a featured product
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#54232A]">
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 accent-[#762C36]"
                  />
                  Active — show this product in the public shop
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#E9DCCB] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-[#DCCBB8] px-5 py-3 font-semibold text-[#54232A] hover:bg-[#F8F1E7] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#762C36] px-6 py-3 font-semibold text-white hover:bg-[#54232A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : editingProduct
                      ? 'Save Changes'
                      : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
