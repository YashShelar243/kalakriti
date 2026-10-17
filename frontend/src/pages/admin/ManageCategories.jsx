import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Tags,
  Search,
  RefreshCw,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'
import api from '../../services/api'

const emptyForm = {
  name: '',
  description: '',
}

export default function ManageCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/admin/categories')
      setCategories(response.data.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load categories.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      (category.description || '')
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && category.is_active) ||
      (statusFilter === 'inactive' && !category.is_active)

    return matchesSearch && matchesStatus
  })

  function openAddModal() {
    setEditingCategory(null)
    setForm({ ...emptyForm })
    setError('')
    setModalOpen(true)
  }

  function openEditModal(category) {
    setEditingCategory(category)
    setForm({
      name: category.name || '',
      description: category.description || '',
    })
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setEditingCategory(null)
    setForm({ ...emptyForm })
    setError('')
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      }

      if (editingCategory) {
        await api.put(
          `/admin/categories/${editingCategory.id}`,
          payload
        )
        setMessage('Category updated successfully.')
      } else {
        await api.post('/admin/categories', payload)
        setMessage('Category created successfully.')
      }

      setModalOpen(false)
      setEditingCategory(null)
      setForm({ ...emptyForm })
      await fetchCategories()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to save category.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(category) {
    const nextStatus = !category.is_active
    const action = nextStatus ? 'activate' : 'deactivate'

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${category.name}"?`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    try {
      await api.patch(
        `/admin/categories/${category.id}/status`,
        { is_active: nextStatus }
      )

      setMessage(
        nextStatus
          ? 'Category activated successfully.'
          : 'Category deactivated successfully.'
      )

      await fetchCategories()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update category status.'
      )
    }
  }

  async function handleDelete(category) {
    if (
      !window.confirm(
        `Delete "${category.name}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    try {
      await api.delete(`/admin/categories/${category.id}`)
      setMessage('Category deleted successfully.')
      await fetchCategories()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to delete category.'
      )
    }
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
              Manage Categories
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Organize your handmade products into collections.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#762C36] px-5 py-3 font-semibold text-white hover:bg-[#54232A]"
          >
            <Plus size={19} />
            Add Category
          </button>
        </div>

        {message && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
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
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-[#E9DCCB] bg-[#FFFDF9] p-5">
            <div className="rounded-xl bg-[#F3E6D2] p-3 text-[#762C36]">
              <Tags size={24} />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Categories</p>
              <p className="text-2xl font-bold text-[#54232A]">
                {categories.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#E9DCCB] bg-[#FFFDF9] p-5">
            <div className="rounded-xl bg-green-100 p-3 text-green-700">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-sm text-stone-500">Active Categories</p>
              <p className="text-2xl font-bold text-[#54232A]">
                {categories.filter((category) => category.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[#E9DCCB] bg-[#FFFDF9] p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-xl border border-[#E9DCCB] bg-white py-3 pl-10 pr-3 outline-none focus:border-[#762C36]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-[#E9DCCB] bg-white px-3 py-3 outline-none focus:border-[#762C36]"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={fetchCategories}
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
            <div className="flex min-h-60 items-center justify-center gap-3 text-stone-500">
              <RefreshCw size={21} className="animate-spin" />
              Loading categories...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Tags size={42} className="mb-4 text-[#B99B80]" />
              <h2 className="text-xl font-semibold text-[#54232A]">
                No categories found
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Try another search or create a new category.
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 rounded-xl bg-[#762C36] px-5 py-3 font-semibold text-white hover:bg-[#54232A]"
              >
                Add Category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-[#F4E8D8] text-xs uppercase tracking-wider text-[#54232A]">
                  <tr>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Slug</th>
                    <th className="px-5 py-4">Products</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EFE4D7]">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-[#FCF6EE]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#54232A]">
                          {category.name}
                        </p>
                        <p className="mt-1 max-w-sm text-sm text-stone-500">
                          {category.description || 'No description'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-stone-600">
                        {category.slug}
                      </td>

                      <td className="px-5 py-4 text-sm text-stone-700">
                        {category.product_count ?? 0}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            category.is_active
                              ? 'inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800'
                              : 'inline-flex rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700'
                          }
                        >
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            title="Edit category"
                            aria-label={`Edit ${category.name}`}
                            className="rounded-lg border border-[#E9DCCB] p-2 text-[#762C36] hover:bg-[#F3E6D2]"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleStatus(category)}
                            title={
                              category.is_active
                                ? 'Deactivate category'
                                : 'Activate category'
                            }
                            aria-label={
                              category.is_active
                                ? `Deactivate ${category.name}`
                                : `Activate ${category.name}`
                            }
                            className="rounded-lg border border-[#E9DCCB] p-2 text-stone-600 hover:bg-stone-100"
                          >
                            {category.is_active ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            title="Delete category"
                            aria-label={`Delete ${category.name}`}
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
            aria-labelledby="category-form-title"
            className="w-full max-w-lg rounded-2xl bg-[#FFFDF9] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E9DCCB] px-5 py-4 sm:px-7">
              <div>
                <h2
                  id="category-form-title"
                  className="text-xl font-bold text-[#54232A]"
                >
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Give your collection a clear name and description.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-stone-500 hover:bg-[#F3E6D2]"
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
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-semibold text-[#54232A]"
                >
                  Category name *
                </label>
                <input
                  id="category-name"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Handmade Rangoli Sheets"
                  className="w-full rounded-xl border border-[#DCCBB8] bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                />
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-semibold text-[#54232A]"
                >
                  Description
                </label>
                <textarea
                  id="category-description"
                  name="description"
                  rows={4}
                  maxLength={1000}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the types of products in this category..."
                  className="w-full resize-y rounded-xl border border-[#DCCBB8] bg-white px-4 py-3 outline-none focus:border-[#762C36]"
                />
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
                    : editingCategory
                      ? 'Save Changes'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}