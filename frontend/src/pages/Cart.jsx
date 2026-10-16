
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  PackageCheck,
} from 'lucide-react'
import Button from '../components/Button'
import { useCart } from '../context/CartContext'

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function Cart() {
  const {
    cartItems,
    cartCount,
    subtotal,
    updateQuantity,
    removeFromCart,
  } = useCart()

  if (cartItems.length === 0) {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ivory">
          <ShoppingBag size={38} className="text-gold" />
        </div>

        <h1 className="mt-5 font-display text-3xl text-burgundy sm:text-4xl">
          Your Shopping Bag
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-burgundy/70">
          Your bag is currently empty. Discover something handmade and special
          for yourself or someone you love.
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
        {/* Page heading */}
        <div className="mb-8 border-b border-gold/20 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Your KalaKriti Selection
          </p>

          <h1 className="mt-2 font-display text-3xl text-burgundy sm:text-4xl">
            Your Shopping Bag
          </h1>

          <p className="mt-2 text-sm text-burgundy/70">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} in your bag
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Cart items */}
          <div className="space-y-5 lg:col-span-2">
            {cartItems.map((item) => {
              const itemImage = item.image_url || item.image
              const stock = Number(item.stock_quantity ?? item.stock ?? 1)

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-gold/20 bg-white p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  {/* Product image */}
                  <Link
                    to={`/products/${item.slug || item.id}`}
                    className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ivory sm:h-32 sm:w-32"
                  >
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <ShoppingBag size={32} className="text-gold" />
                    )}
                  </Link>

                  {/* Product information */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 sm:min-h-32">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gold">
                        {item.category_name || item.category || 'Handcrafted'}
                      </p>

                      <Link
                        to={`/products/${item.slug || item.id}`}
                        className="mt-1 inline-block font-display text-lg text-burgundy transition hover:text-maroon"
                      >
                        {item.name}
                      </Link>

                      <p className="mt-1 text-sm font-semibold text-maroon">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Quantity controls */}
                      <div className="flex items-center overflow-hidden rounded-full border border-gold/30">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="p-2 text-burgundy transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="min-w-9 text-center text-sm font-medium text-burgundy">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= stock}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="p-2 text-burgundy transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      {/* Item total and remove */}
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-burgundy">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="rounded-full p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 py-2 text-sm text-maroon transition hover:text-gold"
            >
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </div>

          {/* Order summary */}
          <aside className="rounded-2xl border border-gold/20 bg-ivory/60 p-5 sm:p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-2xl text-burgundy">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4 border-b border-gold/30 pb-5">
              <div className="flex items-center justify-between gap-3 text-sm text-burgundy/80">
                <span>Items ({cartCount})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-burgundy/80">
                <span>Shipping</span>
                <span className="text-xs">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 py-5">
              <span className="font-semibold text-burgundy">Subtotal</span>
              <span className="text-xl font-semibold text-maroon">
                {formatPrice(subtotal)}
              </span>
            </div>

            <p className="mb-5 text-xs leading-5 text-burgundy/70">
              Shipping charges, if applicable, will be shown during checkout.
            </p>

            <Link to="/checkout" className="block">
              <Button className="w-full">
                <span className="inline-flex items-center justify-center gap-2">
                  Proceed to Checkout
                  <ArrowRight size={17} />
                </span>
              </Button>
            </Link>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-white p-3">
              <PackageCheck
                size={20}
                className="mt-0.5 shrink-0 text-gold"
              />
              <p className="text-xs leading-5 text-burgundy/70">
                Thoughtfully handcrafted creations, packed with care.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default Cart
