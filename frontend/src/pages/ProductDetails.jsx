
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { fetchProductBySlug } from '../services/productService'

function ProductDetails() {
  const { id } = useParams()

  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      try {
        setLoading(true)
        setError('')
        setProduct(null)
        setQuantity(1)

        const data = await fetchProductBySlug(id)

        if (!cancelled) {
          setProduct(data)
        }
      } catch (err) {
        console.error('Failed to load product:', err)

        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? 'This product could not be found.'
              : 'Unable to load this product. Please try again.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      cancelled = true
    }
  }, [id])

  const stock = Number(product?.stock_quantity ?? 0)
  const price = Number(product?.price ?? 0)
  const outOfStock = stock <= 0

  function handleAddToCart() {
    alert(
      `${quantity} × ${product.name} selected. Cart functionality will be connected next.`
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-warm-white px-4">
        <p className="text-burgundy/70">Loading your handmade creation...</p>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-warm-white px-4 text-center">
        <h1 className="font-display text-3xl text-burgundy">
          {error || 'Product not found'}
        </h1>

        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm text-white hover:bg-burgundy"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-warm-white">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-12">
        <Link
          to="/shop"
          className="mb-8 inline-flex items-center gap-2 text-sm text-burgundy/70 transition hover:text-maroon"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="overflow-hidden rounded-2xl bg-ivory">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="aspect-square w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-burgundy/60">
                Product image coming soon
              </div>
            )}
          </div>

          <div className="py-2 sm:py-5">
            <p className="text-xs uppercase tracking-[0.22em] text-gold">
              {product.category_name || 'Handcrafted with love'}
            </p>

            <h1 className="mt-3 font-display text-3xl leading-tight text-burgundy sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            {product.is_featured && (
              <span className="mt-4 inline-block rounded-full bg-ivory px-4 py-1.5 text-xs text-maroon">
                Featured Creation
              </span>
            )}

            <p className="mt-5 text-2xl font-semibold text-maroon sm:text-3xl">
              ₹
              {price.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <div className="mt-5 border-t border-burgundy/10 pt-5">
              <h2 className="font-display text-lg text-burgundy">
                About this creation
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-burgundy/70">
                {product.description}
              </p>
            </div>

            <div className="mt-6">
              {outOfStock ? (
                <p className="text-sm font-medium text-red-700">
                  Currently out of stock
                </p>
              ) : stock <= 5 ? (
                <p className="text-sm text-orange-700">
                  Only {stock} left in stock
                </p>
              ) : (
                <p className="text-sm text-green-700">
                  In stock · {stock} available
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-burgundy/15">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="p-3 text-burgundy hover:text-maroon disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>

                <span
                  className="min-w-8 text-center text-sm font-medium text-burgundy"
                  aria-live="polite"
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(stock, value + 1))
                  }
                  disabled={outOfStock || quantity >= stock}
                  aria-label="Increase quantity"
                  className="p-3 text-burgundy hover:text-maroon disabled:opacity-30"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3.5 text-sm font-medium text-white transition hover:bg-burgundy disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                <ShoppingBag size={18} />
                {outOfStock ? 'Out of Stock' : 'Add to Bag'}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-burgundy/10 pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-3 text-burgundy/70">
                <PackageCheck size={21} className="shrink-0 text-gold" />
                <span className="text-xs">Thoughtfully handcrafted</span>
              </div>

              <div className="flex items-center gap-3 text-burgundy/70">
                <Truck size={21} className="shrink-0 text-gold" />
                <span className="text-xs">Delivery details at checkout</span>
              </div>

              <div className="flex items-center gap-3 text-burgundy/70">
                <ShieldCheck size={21} className="shrink-0 text-gold" />
                <span className="text-xs">Secure shopping experience</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProductDetails
