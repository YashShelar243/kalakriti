
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Tag,
  TicketPercent,
  X,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import api from '../services/api'

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function Checkout() {
  const navigate = useNavigate()
  const { cartItems, cartCount, subtotal, clearCart } = useCart()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    paymentMethod: 'cod',
  })

  const [errors, setErrors] = useState({})
  const [formMessage, setFormMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)

  // Promo code state
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState('')
  const [couponError, setCouponError] = useState('')

  const shippingCharge = Number(subtotal) >= 999 ? 0 : 60
  const discountAmount = appliedCoupon
    ? Number(appliedCoupon.discount_amount || 0)
    : 0

  const total = Math.max(
    0,
    Number(subtotal) - discountAmount + shippingCharge
  )

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))

    setFormMessage('')
  }

  function handleCouponInputChange(event) {
    setCouponInput(event.target.value.toUpperCase())
    setCouponMessage('')
    setCouponError('')
  }

  async function handleApplyCoupon(event) {
    event.preventDefault()

    const code = couponInput.trim().toUpperCase()

    if (!code) {
      setCouponError('Please enter a promo code.')
      setCouponMessage('')
      return
    }

    if (!Number(subtotal) || Number(subtotal) <= 0) {
      setCouponError('Add products to your cart before applying a code.')
      setCouponMessage('')
      return
    }

    setCouponLoading(true)
    setCouponError('')
    setCouponMessage('')

    try {
      const response = await api.post('/coupons/validate', {
        code,
        subtotal: Number(subtotal),
      })

      const result = response.data

      if (!result?.success || !result?.data) {
        throw new Error(
          result?.message || 'Unable to apply this promo code.'
        )
      }

      const coupon = result.data
      const discount = Number(coupon.discount_amount)

      if (!Number.isFinite(discount) || discount <= 0) {
        throw new Error('This promo code does not provide a valid discount.')
      }

      setAppliedCoupon({
        ...coupon,
        code: coupon.code || code,
        discount_amount: discount,
      })

      setCouponInput(coupon.code || code)
      setCouponMessage(
        `${coupon.code || code} applied successfully! You saved ${formatPrice(discount)}.`
      )
      setCouponError('')
    } catch (error) {
      setAppliedCoupon(null)
      setCouponMessage('')
      setCouponError(
        error.response?.data?.message ||
          error.message ||
          'Unable to validate the promo code. Please try again.'
      )
    } finally {
      setCouponLoading(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponMessage('')
    setCouponError('')
  }

  function validateForm() {
    const nextErrors = {}

    if (
      typeof formData.name !== 'string' ||
      formData.name.trim().length < 2 ||
      formData.name.trim().length > 120
    ) {
      nextErrors.name = 'Enter a name between 2 and 120 characters.'
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.'
    }

    if (!formData.address.trim()) {
      nextErrors.address = 'Enter your complete delivery address.'
    }

    if (!formData.city.trim()) {
      nextErrors.city = 'Enter your city.'
    }

    if (!formData.state.trim()) {
      nextErrors.state = 'Enter your state.'
    }

    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      nextErrors.pincode = 'Enter a valid 6-digit PIN code.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormMessage('')

    if (!validateForm()) {
      setFormMessage('Please correct the highlighted fields.')
      return
    }

    if (!cartItems.length) {
      setFormMessage('Your cart is empty.')
      return
    }

    setIsSubmitting(true)

    try {
      const orderPayload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        shippingAddress: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        paymentMethod: formData.paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        ...(appliedCoupon?.code
          ? { couponCode: appliedCoupon.code }
          : {}),
      }

      const response = await api.post('/orders', orderPayload)
      const result = response.data

      if (!result?.success || !result?.data) {
        throw new Error(
          result?.message || 'Unable to place your order.'
        )
      }

      setCompletedOrder(result.data)
      clearCart()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      const status = error.response?.status

      if (status === 409) {
        setFormMessage(
          error.response?.data?.message ||
            'Some products no longer have enough stock. Please review your cart.'
        )
      } else if (!error.response) {
        setFormMessage(
          'Unable to connect to the server. Please check that the backend is running.'
        )
      } else {
        setFormMessage(
          error.response?.data?.message ||
            error.message ||
            'Unable to place your order. Please try again.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/10'

  const labelClass = 'text-sm font-medium text-stone-700'

  if (completedOrder) {
    const order = completedOrder
    const savedAmount = Number(order.discount_amount || 0)

    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 size={44} />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#C5A15B]">
            KalaKriti
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-[#54232A]">
            Order placed successfully!
          </h1>

          <p className="mt-3 text-stone-600">
            Thank you for supporting handmade creations. Your order has
            been received.
          </p>

          <div className="mt-8 rounded-2xl border border-stone-200 p-5 text-left">
            <div className="flex items-center gap-3">
              <PackageCheck className="text-[#762C36]" size={24} />
              <div>
                <p className="text-sm text-stone-500">Order number</p>
                <p className="font-semibold text-stone-900">
                  {order.order_number}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-stone-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              {savedAmount > 0 && (
                <div className="flex justify-between gap-4 text-green-700">
                  <span>
                    Promo discount
                    {order.coupon_code ? ` (${order.coupon_code})` : ''}
                  </span>
                  <span>-{formatPrice(savedAmount)}</span>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <span className="text-stone-600">Shipping</span>
                <span>
                  {Number(order.shipping_fee) === 0
                    ? 'FREE'
                    : formatPrice(order.shipping_fee)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t border-stone-200 pt-3 text-base font-semibold text-[#54232A]">
                <span>Order total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>

              <p className="pt-2 text-stone-600">
                Payment method: Cash on Delivery
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/my-orders')}
              className="rounded-xl bg-[#762C36] px-6 py-3 font-medium text-white transition hover:bg-[#54232A]"
            >
              View my orders
            </button>

            <Link
              to="/shop"
              className="rounded-xl border border-stone-300 px-6 py-3 font-medium text-stone-700 transition hover:bg-stone-50"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!cartItems.length) {
    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto text-[#762C36]" size={48} />

          <h1 className="mt-5 text-2xl font-semibold text-[#54232A]">
            Your cart is empty
          </h1>

          <p className="mt-3 text-stone-600">
            Add some beautiful handmade products before checking out.
          </p>

          <Link
            to="/shop"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#762C36] px-6 py-3 font-medium text-white hover:bg-[#54232A]"
          >
            Explore the shop <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#762C36] hover:text-[#54232A]"
        >
          <ArrowLeft size={17} />
          Back to cart
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C5A15B]">
            KalaKriti
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#54232A] sm:text-4xl">
            Secure checkout
          </h1>

          <p className="mt-3 text-stone-600">
            You are just a few steps away from receiving something handmade
            with love.
          </p>
        </div>

        {formMessage && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_390px]"
        >
          <div className="space-y-6">
            {/* Delivery information */}
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8F1E7] text-[#762C36]">
                  <MapPin size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-[#54232A]">
                    Delivery details
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="name">
                    Full name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your full name"
                    maxLength={120}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="email">
                    Email address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="phone">
                    Mobile number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="10-digit mobile number"
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="address">
                    Complete address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    autoComplete="street-address"
                    rows={3}
                    maxLength={1000}
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="House number, street, area, landmark"
                    aria-invalid={Boolean(errors.address)}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="city">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Your city"
                    aria-invalid={Boolean(errors.city)}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="state">
                    State *
                  </label>
                  <input
                    id="state"
                    name="state"
                    autoComplete="address-level1"
                    value={formData.state}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Your state"
                    aria-invalid={Boolean(errors.state)}
                  />
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="pincode">
                    PIN code *
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="6-digit PIN code"
                    aria-invalid={Boolean(errors.pincode)}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Payment method */}
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-semibold text-[#54232A]">
                Payment method
              </h2>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#762C36] bg-[#F8F1E7]/60 p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleChange}
                  className="mt-1 accent-[#762C36]"
                />

                <div>
                  <p className="font-semibold text-stone-800">
                    Cash on Delivery
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Pay when your order arrives at your doorstep.
                  </p>
                </div>
              </label>
            </section>
          </div>

          {/* Order summary */}
          <aside className="space-y-6 lg:sticky lg:top-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#54232A]">
                  Order summary
                </h2>

                <span className="rounded-full bg-[#F8F1E7] px-3 py-1 text-xs font-semibold text-[#762C36]">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="mt-5 max-h-72 space-y-4 overflow-y-auto">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-stone-800">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-medium text-stone-800">
                      {formatPrice(
                        Number(item.price) * Number(item.quantity)
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div className="mt-6 border-t border-stone-200 pt-5">
                <div className="flex items-center gap-2">
                  <TicketPercent size={20} className="text-[#762C36]" />
                  <h3 className="font-semibold text-[#54232A]">
                    Promo code
                  </h3>
                </div>

                {appliedCoupon ? (
                  <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Tag size={18} className="shrink-0 text-green-700" />
                        <div className="min-w-0">
                          <p className="break-all font-semibold text-green-800">
                            {appliedCoupon.code}
                          </p>
                          <p className="mt-1 text-xs text-green-700">
                            You saved {formatPrice(discountAmount)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                        aria-label="Remove promo code"
                      >
                        <X size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={handleCouponInputChange}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            handleApplyCoupon(event)
                          }
                        }}
                        maxLength={50}
                        placeholder="Enter promo code"
                        aria-label="Promo code"
                        className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-3 text-sm uppercase outline-none focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/10"
                      />

                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#762C36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#54232A] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {couponLoading ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>

                    {couponError && (
                      <p role="alert" className="mt-2 text-sm text-red-600">
                        {couponError}
                      </p>
                    )}
                  </div>
                )}

                {couponMessage && (
                  <p className="mt-3 text-sm text-green-700">
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Price breakdown */}
              <div className="mt-6 space-y-3 border-t border-stone-200 pt-5 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-stone-600">Subtotal</span>
                  <span className="font-medium text-stone-800">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-stone-600">Shipping</span>
                  <span
                    className={
                      shippingCharge === 0
                        ? 'font-medium text-green-700'
                        : 'font-medium text-stone-800'
                    }
                  >
                    {shippingCharge === 0
                      ? 'FREE'
                      : formatPrice(shippingCharge)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between gap-3 text-green-700">
                    <span className="flex items-center gap-1">
                      <Tag size={15} />
                      Discount
                    </span>
                    <span className="font-medium">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                {shippingCharge > 0 && (
                  <p className="rounded-xl bg-[#F8F1E7] p-3 text-xs leading-relaxed text-stone-600">
                    Add products to reach ₹999 for free shipping.
                  </p>
                )}

                <div className="flex justify-between gap-3 border-t border-stone-200 pt-4 text-base font-semibold">
                  <span className="text-[#54232A]">Total</span>
                  <span className="text-[#54232A]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !cartItems.length}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#762C36] px-5 py-4 font-semibold text-white transition hover:bg-[#54232A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Placing order...
                  </>
                ) : (
                  <>
                    Place order <ArrowRight size={19} />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-stone-500">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-green-700" />
                <p>
                  Your order total is recalculated by our server before the
                  order is saved. Promo codes are checked again during
                  checkout.
                </p>
              </div>
            </section>
          </aside>
        </form>
      </div>
    </main>
  )
}

export default Checkout
