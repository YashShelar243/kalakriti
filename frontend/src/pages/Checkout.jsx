
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  PackageCheck,
  ShoppingBag,
  ShieldCheck,
  LoaderCircle,
  CheckCircle2,
} from 'lucide-react'
import Button from '../components/Button'
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

  const shippingCharge = subtotal >= 999 ? 0 : 60
  const total = subtotal + shippingCharge

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: '',
    }))

    setFormMessage('')
  }

  function validateForm() {
    const nextErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = 'Please enter your full name.'
    } else if (
      formData.name.trim().length < 2 ||
      formData.name.trim().length > 120
    ) {
      nextErrors.name = 'Name must contain 2–120 characters.'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Please enter your email address.'
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.'
    }

    if (!formData.address.trim()) {
      nextErrors.address = 'Please enter your delivery address.'
    }

    if (!formData.city.trim()) {
      nextErrors.city = 'Please enter your city.'
    }

    if (!formData.state.trim()) {
      nextErrors.state = 'Please enter your state.'
    }

    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      nextErrors.pincode = 'Enter a valid 6-digit PIN code.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) return

    if (cartItems.length === 0) {
      setFormMessage('Your shopping bag is empty. Add a product before checkout.')
      return
    }

    if (!validateForm()) {
      setFormMessage('Please correct the highlighted fields.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)
    setFormMessage('')

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
      }

      const response = await api.post('/orders', orderPayload)
      const result = response.data

      if (!result?.success || !result?.data) {
        throw new Error(result?.message || 'Unable to place your order.')
      }

      // Keep the order confirmation before clearing the cart.
      setCompletedOrder(result.data)

      // Clear the cart only after the backend confirms success.
      clearCart()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const status = error.response?.status
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to place your order. Please try again.'

      if (status === 409) {
        setFormMessage(
          `${message} Please return to your bag and review the quantities.`
        )
      } else if (!error.response) {
        setFormMessage(
          'Could not connect to the server. Check that the backend is running and try again.'
        )
      } else {
        setFormMessage(message)
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm text-burgundy outline-none transition placeholder:text-burgundy/40 focus:border-maroon focus:ring-1 focus:ring-maroon'

  const labelClass = 'text-sm font-medium text-burgundy'

  function fieldError(name) {
    return errors[name] ? (
      <p className="mt-1 text-xs text-red-600">{errors[name]}</p>
    ) : null
  }

  // Successful order confirmation
  if (completedOrder) {
    return (
      <section className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 size={44} className="text-green-600" />
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-gold">
          Thank you for supporting handmade
        </p>

        <h1 className="mt-3 font-display text-3xl text-burgundy sm:text-4xl">
          Order Placed Successfully!
        </h1>

        <p className="mt-4 text-sm leading-6 text-burgundy/70">
          Thank you for shopping with KalaKriti. Your order has been saved.
        </p>

        <div className="mt-7 w-full rounded-2xl border border-gold/30 bg-ivory/50 p-5 text-left">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-burgundy/70">Order number</span>
            <span className="break-all text-right font-semibold text-maroon">
              {completedOrder.order_number}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-gold/20 pt-4">
            <span className="text-sm text-burgundy/70">Order total</span>
            <span className="text-lg font-semibold text-maroon">
              {formatPrice(completedOrder.total_amount)}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-gold/20 pt-4">
            <span className="text-sm text-burgundy/70">Payment</span>
            <span className="text-sm font-medium text-burgundy">
              Cash on Delivery
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-burgundy/60">
          Save your order number for future reference.
        </p>

        <Link to="/shop" className="mt-7">
          <Button>Continue Shopping</Button>
        </Link>
      </section>
    )
  }

  if (cartItems.length === 0) {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <ShoppingBag size={46} className="text-gold" />

        <h1 className="mt-5 font-display text-3xl text-burgundy">
          Your bag is empty
        </h1>

        <p className="mt-3 text-sm text-burgundy/70">
          Add some handmade creations before proceeding to checkout.
        </p>

        <Link to="/shop" className="mt-6">
          <Button>Explore Creations</Button>
        </Link>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-warm-white px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/cart"
          className="mb-6 inline-flex items-center gap-2 text-sm text-maroon transition hover:text-gold"
        >
          <ArrowLeft size={16} />
          Return to shopping bag
        </Link>

        <div className="mb-8 border-b border-gold/20 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Almost yours
          </p>

          <h1 className="mt-2 font-display text-3xl text-burgundy sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-burgundy/70">
            Enter your details to place your KalaKriti order.
          </p>
        </div>

        {formMessage && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {formMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            {/* Delivery information */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-gold/20 bg-white p-5 sm:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory">
                    <MapPin size={20} className="text-maroon" />
                  </div>

                  <div>
                    <h2 className="font-display text-xl text-burgundy">
                      Delivery Details
                    </h2>
                    <p className="mt-1 text-xs text-burgundy/60">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="name">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      placeholder="Enter your full name"
                      className={inputClass}
                      aria-invalid={Boolean(errors.name)}
                    />
                    {fieldError('name')}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="email">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={inputClass}
                      aria-invalid={Boolean(errors.email)}
                    />
                    {fieldError('email')}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="phone">
                      Mobile Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel-national"
                      placeholder="10-digit mobile number"
                      className={inputClass}
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {fieldError('phone')}
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="address">
                      Complete Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      autoComplete="street-address"
                      placeholder="House number, street, area, landmark"
                      className={`${inputClass} resize-y`}
                      aria-invalid={Boolean(errors.address)}
                    />
                    {fieldError('address')}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="city">
                      City *
                    </label>
                    <input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      autoComplete="address-level2"
                      placeholder="Your city"
                      className={inputClass}
                      aria-invalid={Boolean(errors.city)}
                    />
                    {fieldError('city')}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="state">
                      State *
                    </label>
                    <input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      autoComplete="address-level1"
                      placeholder="Your state"
                      className={inputClass}
                      aria-invalid={Boolean(errors.state)}
                    />
                    {fieldError('state')}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="pincode">
                      PIN Code *
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleChange}
                      autoComplete="postal-code"
                      placeholder="6-digit PIN code"
                      className={inputClass}
                      aria-invalid={Boolean(errors.pincode)}
                    />
                    {fieldError('pincode')}
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="rounded-2xl border border-gold/20 bg-white p-5 sm:p-7">
                <h2 className="font-display text-xl text-burgundy">
                  Payment Method
                </h2>

                <p className="mt-1 text-xs text-burgundy/60">
                  Choose how you would like to pay.
                </p>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-maroon/40 bg-ivory/50 p-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleChange}
                    className="mt-1 accent-[#762C36]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-burgundy">
                      Cash on Delivery
                    </p>
                    <p className="mt-1 text-xs leading-5 text-burgundy/70">
                      Pay when your order is delivered.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order summary */}
            <aside className="rounded-2xl border border-gold/20 bg-ivory/60 p-5 sm:p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-2xl text-burgundy">
                Order Summary
              </h2>

              <div className="mt-5 max-h-80 space-y-4 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                      {(item.image_url || item.image) && (
                        <img
                          src={item.image_url || item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      )}

                      <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-[10px] text-white">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-burgundy">{item.name}</p>
                      <p className="mt-1 text-xs text-burgundy/60">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-medium text-maroon">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-gold/30 pt-5">
                <div className="flex justify-between gap-3 text-sm text-burgundy/80">
                  <span>Items ({cartCount})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between gap-3 text-sm text-burgundy/80">
                  <span>Shipping</span>
                  <span>
                    {shippingCharge === 0
                      ? 'Free'
                      : formatPrice(shippingCharge)}
                  </span>
                </div>

                {shippingCharge > 0 && (
                  <p className="text-xs leading-5 text-burgundy/60">
                    Free shipping on orders of ₹999 or more.
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-gold/30 pt-5">
                <span className="font-semibold text-burgundy">Total</span>
                <span className="text-xl font-semibold text-maroon">
                  {formatPrice(total)}
                </span>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-white p-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-gold"
                />
                <p className="text-xs leading-5 text-burgundy/70">
                  Your order details are submitted securely to the KalaKriti
                  backend.
                </p>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ArrowRight size={17} />
                      </>
                    )}
                  </span>
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-burgundy/60">
                <PackageCheck size={15} />
                Handmade and packed with care
              </div>
            </aside>
          </div>
        </form>
      </div>
    </section>
  )
}

export default Checkout
