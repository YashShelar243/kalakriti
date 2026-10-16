
import { useEffect, useState } from 'react'
import { ShoppingBag, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SectionHeading from './SectionHeading'
import ProductCard from './ProductCard'
import { fetchProducts } from '../services/productService'
import { useCart } from '../context/CartContext'

export default function FeaturedProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wishlistMessage, setWishlistMessage] = useState('')

  const { addToCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        const data = await fetchProducts({ featured: true })

        if (!cancelled) {
          setProducts(data)
        }
      } catch (err) {
        console.error('Failed to load featured products:', err)

        if (!cancelled) {
          setError('Unable to load products. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [])

  function handleAddToCart(product) {
    addToCart(product)
    navigate('/cart')
  }

  function handleToggleWishlist(product) {
    setWishlistMessage(
      `Wishlist functionality for ${product.name} will be added later.`
    )
  }

  return (
    <section
      id="products"
      className="scroll-mt-24 bg-warm-white px-4 py-16 sm:px-6 lg:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="HANDPICKED FOR YOU"
          title="Featured Creations"
          description="Discover thoughtfully handcrafted pieces made to bring warmth and tradition into your life."
        />

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <p className="text-maroon">
              Loading handcrafted products...
            </p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-maroon px-6 py-2 text-white transition hover:bg-burgundy"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-burgundy/70">
            No featured products are available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                onToggleWishlist={() => handleToggleWishlist(product)}
              />
            ))}
          </div>
        )}

        {wishlistMessage && (
          <div
            role="status"
            className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-burgundy/70"
          >
            <Heart size={16} className="text-maroon" />
            {wishlistMessage}
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 rounded-full border border-maroon px-6 py-3 text-sm font-medium text-maroon transition hover:bg-maroon hover:text-white"
            >
              <ShoppingBag size={17} />
              Explore All Products
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
