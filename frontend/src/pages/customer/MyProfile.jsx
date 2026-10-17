
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UserRound,
  Mail,
  Phone,
  Save,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const EMPTY_ADDRESS = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  address_type: 'Home',
  is_default: false,
}

function MyProfile() {
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const [addresses, setAddresses] = useState([])
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressFormOpen, setAddressFormOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addressSaving, setAddressSaving] = useState(false)
  const [addressActionId, setAddressActionId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addressError, setAddressError] = useState('')
  const [addressSuccess, setAddressSuccess] = useState('')

  const inputClass =
    'mt-2 w-full rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm text-burgundy outline-none transition focus:border-maroon focus:ring-1 focus:ring-maroon'

  const labelClass = 'text-sm font-medium text-burgundy'

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/auth/me')
      const profile = response.data?.data?.user

      if (!response.data?.success || !profile) {
        throw new Error('Unable to load your profile.')
      }

      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load your profile.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAddresses = useCallback(async () => {
    try {
      setAddressError('')

      const response = await api.get('/addresses')

      if (!response.data?.success) {
        throw new Error('Unable to load saved addresses.')
      }

      setAddresses(response.data.data || [])
    } catch (err) {
      setAddressError(
        err.response?.data?.message ||
          'Unable to load saved addresses. Please try again.'
      )
    }
  }, [])

  useEffect(() => {
    loadProfile()
    loadAddresses()
  }, [loadProfile, loadAddresses])

  function handleProfileChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()

    if (saving) return

    const name = formData.name.trim()
    const phone = formData.phone.trim()

    if (name.length < 2 || name.length > 120) {
      setError('Name must be between 2 and 120 characters.')
      return
    }

    if (phone.length > 20) {
      setError('Phone number must not exceed 20 characters.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await api.put('/auth/me', { name, phone })
      const updatedUser = response.data?.data?.user

      if (!response.data?.success || !updatedUser) {
        throw new Error(
          response.data?.message || 'Unable to update your profile.'
        )
      }

      setFormData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
      })

      setSuccess('Your profile has been updated successfully.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to update your profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  function openNewAddressForm() {
    setEditingAddressId(null)
    setAddressForm({
      ...EMPTY_ADDRESS,
      full_name: formData.name || user?.name || '',
      phone: formData.phone || user?.phone || '',
      is_default: addresses.length === 0,
    })
    setAddressFormOpen(true)
    setAddressError('')
    setAddressSuccess('')
  }

  function openEditAddressForm(address) {
    setEditingAddressId(address.id)
    setAddressForm({
      full_name: address.full_name || '',
      phone: address.phone || '',
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country || 'India',
      address_type: address.address_type || 'Home',
      is_default: Boolean(address.is_default),
    })
    setAddressFormOpen(true)
    setAddressError('')
    setAddressSuccess('')
  }

  function closeAddressForm() {
    if (addressSaving) return

    setAddressFormOpen(false)
    setEditingAddressId(null)
    setAddressForm(EMPTY_ADDRESS)
    setAddressError('')
  }

  function handleAddressChange(event) {
    const { name, value, checked, type } = event.target

    setAddressForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setAddressError('')
    setAddressSuccess('')
  }

  async function handleAddressSubmit(event) {
    event.preventDefault()

    if (addressSaving) return

    try {
      setAddressSaving(true)
      setAddressError('')
      setAddressSuccess('')

      const payload = {
        ...addressForm,
        full_name: addressForm.full_name.trim(),
        phone: addressForm.phone.trim(),
        address_line1: addressForm.address_line1.trim(),
        address_line2: addressForm.address_line2.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postal_code: addressForm.postal_code.trim(),
        country: addressForm.country.trim() || 'India',
      }

      if (editingAddressId !== null) {
        await api.put(`/addresses/${editingAddressId}`, payload)
        setAddressSuccess('Address updated successfully.')
      } else {
        await api.post('/addresses', payload)
        setAddressSuccess('Address saved successfully.')
      }

      setAddressFormOpen(false)
      setEditingAddressId(null)
      setAddressForm(EMPTY_ADDRESS)

      await loadAddresses()
    } catch (err) {
      setAddressError(
        err.response?.data?.message ||
          'Unable to save the address. Please check your details.'
      )
    } finally {
      setAddressSaving(false)
    }
  }

  async function handleSetDefault(addressId) {
    try {
      setAddressActionId(addressId)
      setAddressError('')
      setAddressSuccess('')

      await api.patch(`/addresses/${addressId}/default`)

      await loadAddresses()
      setAddressSuccess('Default delivery address updated.')
    } catch (err) {
      setAddressError(
        err.response?.data?.message ||
          'Unable to update the default address.'
      )
    } finally {
      setAddressActionId(null)
    }
  }

  async function handleDeleteAddress(address) {
    const confirmed = window.confirm(
      `Delete the address for ${address.full_name}?`
    )

    if (!confirmed) return

    try {
      setAddressActionId(address.id)
      setAddressError('')
      setAddressSuccess('')

      await api.delete(`/addresses/${address.id}`)

      await loadAddresses()
      setAddressSuccess('Address deleted successfully.')
    } catch (err) {
      setAddressError(
        err.response?.data?.message ||
          'Unable to delete the address.'
      )
    } finally {
      setAddressActionId(null)
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center bg-warm-white text-burgundy/70">
        <LoaderCircle
          size={30}
          className="animate-spin text-maroon"
        />
        <p className="mt-4 text-sm">Loading your profile...</p>
      </section>
    )
  }

  return (
    <main className="min-h-screen bg-warm-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-maroon transition hover:text-gold"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Your KalaKriti account
          </p>

          <h1 className="mt-3 font-display text-3xl text-burgundy sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-3 text-sm leading-6 text-burgundy/70">
            Manage your account information and delivery addresses.
          </p>
        </div>

        {/* Account details */}
        <section className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-gold/20 bg-ivory/50 p-5 sm:p-7">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-maroon">
              <UserRound size={28} />
            </div>

            <div className="min-w-0">
              <h2 className="font-display text-xl text-burgundy">
                Account Details
              </h2>

              <p className="mt-1 break-all text-sm text-burgundy/65">
                {formData.email || user?.email || ''}
              </p>

              <p className="mt-1 text-xs capitalize text-burgundy/50">
                {user?.role || 'Customer'} account
              </p>
            </div>
          </div>

          <form
            onSubmit={handleProfileSubmit}
            className="space-y-6 p-5 sm:p-7"
          >
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div>
              <label htmlFor="profile-name" className={labelClass}>
                Full Name
              </label>
              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-4 top-[26px] text-burgundy/50"
                />
                <input
                  id="profile-name"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  className={`${inputClass} pl-11`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-email" className={labelClass}>
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-[26px] text-burgundy/50"
                />
                <input
                  id="profile-email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-ivory/60 pl-11`}
                />
              </div>
              <p className="mt-2 text-xs text-burgundy/55">
                Email address cannot be changed here.
              </p>
            </div>

            <div>
              <label htmlFor="profile-phone" className={labelClass}>
                Mobile Number
              </label>
              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-4 top-[26px] text-burgundy/50"
                />
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleProfileChange}
                  autoComplete="tel"
                  maxLength={20}
                  className={`${inputClass} pl-11`}
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gold/20 pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/my-orders"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-maroon px-6 py-3 text-sm font-medium text-maroon transition hover:bg-ivory"
              >
                <ShoppingBag size={17} />
                View My Orders
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm font-medium text-white transition hover:bg-burgundy disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Saved delivery addresses */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gold/20 bg-ivory/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-maroon">
                <MapPin size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl text-burgundy">
                  Saved Addresses
                </h2>
                <p className="mt-1 text-sm text-burgundy/65">
                  Manage your delivery locations.
                </p>
              </div>
            </div>

            {!addressFormOpen && (
              <button
                type="button"
                onClick={openNewAddressForm}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-5 py-3 text-sm font-medium text-white transition hover:bg-burgundy"
              >
                <Plus size={17} />
                Add Address
              </button>
            )}
          </div>

          <div className="space-y-5 p-5 sm:p-7">
            {addressError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{addressError}</p>
              </div>
            )}

            {addressSuccess && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <p>{addressSuccess}</p>
              </div>
            )}

            {addressFormOpen && (
              <form
                onSubmit={handleAddressSubmit}
                className="space-y-5 rounded-2xl border border-gold/30 bg-ivory/30 p-4 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg text-burgundy">
                    {editingAddressId !== null
                      ? 'Edit Address'
                      : 'Add Delivery Address'}
                  </h3>

                  <button
                    type="button"
                    onClick={closeAddressForm}
                    disabled={addressSaving}
                    aria-label="Close address form"
                    className="rounded-full p-2 text-burgundy transition hover:bg-ivory"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="address-name" className={labelClass}>
                      Full Name *
                    </label>
                    <input
                      id="address-name"
                      name="full_name"
                      value={addressForm.full_name}
                      onChange={handleAddressChange}
                      autoComplete="name"
                      maxLength={120}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="address-phone" className={labelClass}>
                      Mobile Number *
                    </label>
                    <input
                      id="address-phone"
                      name="phone"
                      type="tel"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                      autoComplete="tel"
                      maxLength={20}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address-line1" className={labelClass}>
                      Address Line 1 *
                    </label>
                    <input
                      id="address-line1"
                      name="address_line1"
                      value={addressForm.address_line1}
                      onChange={handleAddressChange}
                      autoComplete="address-line1"
                      maxLength={255}
                      required
                      className={inputClass}
                      placeholder="House number, building, street"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address-line2" className={labelClass}>
                      Address Line 2
                    </label>
                    <input
                      id="address-line2"
                      name="address_line2"
                      value={addressForm.address_line2}
                      onChange={handleAddressChange}
                      autoComplete="address-line2"
                      maxLength={255}
                      className={inputClass}
                      placeholder="Landmark, area (optional)"
                    />
                  </div>

                  <div>
                    <label htmlFor="address-city" className={labelClass}>
                      City *
                    </label>
                    <input
                      id="address-city"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      autoComplete="address-level2"
                      maxLength={100}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="address-state" className={labelClass}>
                      State *
                    </label>
                    <input
                      id="address-state"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                      autoComplete="address-level1"
                      maxLength={100}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="address-postal" className={labelClass}>
                      Postal Code *
                    </label>
                    <input
                      id="address-postal"
                      name="postal_code"
                      value={addressForm.postal_code}
                      onChange={handleAddressChange}
                      autoComplete="postal-code"
                      maxLength={10}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="address-country" className={labelClass}>
                      Country *
                    </label>
                    <input
                      id="address-country"
                      name="country"
                      value={addressForm.country}
                      onChange={handleAddressChange}
                      autoComplete="country-name"
                      maxLength={100}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="address-type" className={labelClass}>
                      Address Type
                    </label>
                    <select
                      id="address-type"
                      name="address_type"
                      value={addressForm.address_type}
                      onChange={handleAddressChange}
                      className={inputClass}
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-burgundy">
                      <input
                        type="checkbox"
                        name="is_default"
                        checked={addressForm.is_default}
                        onChange={handleAddressChange}
                        className="h-4 w-4 accent-maroon"
                      />
                      Set as default address
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-gold/20 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeAddressForm}
                    disabled={addressSaving}
                    className="rounded-full border border-maroon px-5 py-3 text-sm font-medium text-maroon transition hover:bg-ivory disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-5 py-3 text-sm font-medium text-white transition hover:bg-burgundy disabled:opacity-60"
                  >
                    {addressSaving && (
                      <LoaderCircle size={17} className="animate-spin" />
                    )}
                    {addressSaving
                      ? 'Saving...'
                      : editingAddressId !== null
                        ? 'Update Address'
                        : 'Save Address'}
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 && !addressFormOpen && (
              <div className="rounded-xl border border-dashed border-gold/40 px-5 py-10 text-center">
                <MapPin size={32} className="mx-auto text-gold" />
                <h3 className="mt-3 font-medium text-burgundy">
                  No saved addresses yet
                </h3>
                <p className="mt-2 text-sm text-burgundy/65">
                  Add an address to make future checkouts easier.
                </p>
                <button
                  type="button"
                  onClick={openNewAddressForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-maroon px-5 py-2.5 text-sm text-maroon transition hover:bg-ivory"
                >
                  <Plus size={16} />
                  Add Your First Address
                </button>
              </div>
            )}

            <div className="grid gap-4">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className={`rounded-2xl border p-4 sm:p-5 ${
                    address.is_default
                      ? 'border-maroon/50 bg-ivory/30'
                      : 'border-gold/25 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-ivory px-3 py-1 text-xs font-semibold text-maroon">
                          {address.address_type}
                        </span>

                        {address.is_default && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-maroon px-3 py-1 text-xs font-medium text-white">
                            <Star size={12} />
                            Default
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 font-semibold text-burgundy">
                        {address.full_name}
                      </h3>

                      <p className="mt-1 text-sm text-burgundy/70">
                        {address.phone}
                      </p>

                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-burgundy/75">
                        {address.address_line1}
                        {address.address_line2
                          ? `, ${address.address_line2}`
                          : ''}
                        {'\n'}
                        {address.city}, {address.state} - {address.postal_code}
                        {'\n'}
                        {address.country}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {!address.is_default && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(address.id)}
                          disabled={addressActionId !== null}
                          className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-2 text-xs font-medium text-burgundy transition hover:bg-ivory disabled:opacity-50"
                        >
                          {addressActionId === address.id ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Star size={14} />
                          )}
                          Make Default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditAddressForm(address)}
                        disabled={addressActionId !== null || addressSaving}
                        className="inline-flex items-center gap-1.5 rounded-full border border-maroon/30 px-3 py-2 text-xs font-medium text-maroon transition hover:bg-ivory disabled:opacity-50"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(address)}
                        disabled={addressActionId !== null || addressSaving}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-burgundy/55">
          Your account information and saved addresses are managed securely
          through your KalaKriti account.
        </p>
      </div>
    </main>
  )
}

export default MyProfile
