
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  LoaderCircle,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import Button from '../../components/Button'
import { useCart } from '../../context/CartContext'
import api from '../../services/api'

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(price) || 0)
}

export default function Wishlist() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)
  const [addingId, setAddingId] = useState(null)

  const { addToCart } = useCart()

  const loadWishlist = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/wishlist')
      setProducts(response.data.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load your wishlist. Please log in and try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  async function handleRemove(productId) {
    setRemovingId(productId)
    setError('')

    try {
      await api.delete(`/wishlist/${productId}`)
      setProducts((current) =>
        current.filter((product) => product.id !== productId)
      )
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to remove this product.'
      )
    } finally {
      setRemovingId(null)
    }
  }

  async function handleAddToCart(product) {
    setAddingId(product.id)
    setError('')

    try {
      await Promise.resolve(
        addToCart({
          ...product,
          id: product.id,
          productId: product.id,
          quantity: 1,
        })
      )
    } catch (err) {
      setError(err.message || 'Unable to add this product to your cart.')
    } finally {
      setAddingId(null)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#F8F1E7] px-4">
        <div className="flex items-center gap-3 text-[#762C36]">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span>Loading your wishlist...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/shop"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#762C36] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#762C36]/10">
            <Heart className="h-7 w-7 text-[#762C36]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-[#54232A] sm:text-4xl">
              My Wishlist
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Your favorite handmade creations, all in one place.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={loadWishlist}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {products.length === 0 ? (
          <div className="rounded-2xl border border-[#762C36]/10 bg-[#FFFDF9] px-6 py-16 text-center shadow-sm">
            <Heart className="mx-auto mb-4 h-14 w-14 text-[#762C36]/40" />

            <h2 className="text-xl font-semibold text-[#54232A]">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              Explore our handmade collection and save the creations you love
              for later.
            </p>

            <Link to="/shop" className="mt-6 inline-block">
              <Button>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Explore products
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-gray-600">
              {products.length} saved{' '}
              {products.length === 1 ? 'product' : 'products'}
            </p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-[#762C36]/10 bg-[#FFFDF9] shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="block aspect-square overflow-hidden bg-white"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                  </Link>

                  <div className="p-4">
                    <Link
                      to={`/product/${product.slug}`}
                      className="line-clamp-2 font-semibold text-[#54232A] hover:text-[#762C36]"
                    >
                      {product.name}
                    </Link>

                    {product.size && (
                      <p className="mt-1 text-xs text-gray-500">
                        Size: {product.size}
                      </p>
                    )}

                    <p className="mt-3 text-lg font-bold text-[#762C36]">
                      {formatPrice(product.price)}
                    </p>

                    {Number(product.stock_quantity) <= 0 && (
                      <p className="mt-2 text-sm font-medium text-red-600">
                        Out of stock
                      </p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={
                          addingId === product.id ||
                          Number(product.stock_quantity) <= 0
                        }
                      >
                        {addingId === product.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                        <span className="ml-2">Add to cart</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleRemove(product.id)}
                        disabled={removingId === product.id}
                        aria-label={`Remove ${product.name} from wishlist`}
                        title="Remove from wishlist"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {removingId === product.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
