
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'

import ProductCard from '../components/ProductCard'
import { fetchProducts, fetchCategories } from '../services/productService'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const { addToCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const [search, setSearch] = useState(
    () => searchParams.get('search') || ''
  )

  const [category, setCategory] = useState(
    () => searchParams.get('category') || 'all'
  )

  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState(() => new Set())
  const [wishlistLoadingIds, setWishlistLoadingIds] = useState(
    () => new Set()
  )
  const [wishlistMessage, setWishlistMessage] = useState('')

  const isCustomer =
    isAuthenticated && user?.role === 'customer'

  // Synchronize search and category filters with the URL.
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setCategory(searchParams.get('category') || 'all')
  }, [searchParams])

  // Load products and categories.
  useEffect(() => {
    let cancelled = false

    async function loadShopData() {
      try {
        setLoading(true)
        setError('')

        const [productData, categoryData] = await Promise.all([
          fetchProducts({ limit: 100 }),
          fetchCategories(),
        ])

        if (!cancelled) {
          setProducts(productData)
          setCategories(categoryData)
        }
      } catch (err) {
        console.error('Failed to load shop data:', err)

        if (!cancelled) {
          setError(
            'We could not load the collection. Please try again.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadShopData()

    return () => {
      cancelled = true
    }
  }, [])

  // Load the logged-in customer's wishlist.
  useEffect(() => {
    let cancelled = false

    async function loadWishlist() {
      if (!isCustomer) {
        setWishlistIds(new Set())
        return
      }

      try {
        const response = await api.get('/wishlist')
        const items = response.data?.data || []

        if (!cancelled) {
          const ids = new Set(
            items.map((item) => Number(item.id))
          )

          setWishlistIds(ids)

          // Synchronize the Navbar badge with the server.
          window.dispatchEvent(
            new CustomEvent('kalakriti:wishlist-updated', {
              detail: { count: ids.size },
            })
          )
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err)
      }
    }

    loadWishlist()

    return () => {
      cancelled = true
    }
  }, [isCustomer, user?.id])

  // Resolve the selected category.
  const selectedCategorySlug = useMemo(() => {
    if (category === 'all') return 'all'

    const matchedCategory = categories.find(
      (item) =>
        item.slug?.toLowerCase() === category.toLowerCase() ||
        item.name?.toLowerCase() === category.toLowerCase()
    )

    return matchedCategory?.slug || category
  }, [categories, category])

  // Filter and sort products.
  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (selectedCategorySlug !== 'all') {
      result = result.filter(
        (product) =>
          product.category_slug?.toLowerCase() ===
          selectedCategorySlug.toLowerCase()
      )
    }

    const searchTerm = search.trim().toLowerCase()

    if (searchTerm) {
      result = result.filter((product) =>
        `${product.name} ${product.description || ''} ${
          product.category_name || ''
        }`
          .toLowerCase()
          .includes(searchTerm)
      )
    }

    if (sort === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sort === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [products, selectedCategorySlug, search, sort])

  function updateFilters(updates) {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') {
        nextParams.delete(key)
      } else {
        nextParams.set(key, value)
      }
    })

    setSearchParams(nextParams, { replace: true })
  }

  function handleSearchChange(event) {
    const value = event.target.value
    setSearch(value)
    updateFilters({ search: value.trim() ? value : null })
  }

  function handleCategoryChange(value) {
    setCategory(value)
    updateFilters({ category: value })
  }

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setSort('newest')
    setSearchParams({}, { replace: true })
  }

  function handleAddToCart(product) {
    addToCart(product)
    navigate('/cart')
  }

  // Notify the Navbar whenever the wishlist changes.
  function notifyWishlistCount(count) {
    window.dispatchEvent(
      new CustomEvent('kalakriti:wishlist-updated', {
        detail: { count },
      })
    )
  }

  // Add or remove a product from the wishlist.
  async function handleToggleWishlist(productId) {
    const id = Number(productId)

    if (!Number.isInteger(id) || id <= 0) {
      return
    }

    if (!isCustomer) {
      navigate('/login')
      return
    }

    if (wishlistLoadingIds.has(id)) {
      return
    }

    const alreadySaved = wishlistIds.has(id)

    setWishlistMessage('')
    setWishlistLoadingIds((previous) => new Set(previous).add(id))

    try {
      if (alreadySaved) {
        await api.delete(`/wishlist/${id}`)

        // Update local state and Navbar count.
        setWishlistIds((previous) => {
          const next = new Set(previous)
          next.delete(id)
          notifyWishlistCount(next.size)
          return next
        })

        setWishlistMessage('Product removed from your wishlist.')
      } else {
        await api.post(`/wishlist/${id}`)

        // Update local state and Navbar count.
        setWishlistIds((previous) => {
          const next = new Set(previous)
          next.add(id)
          notifyWishlistCount(next.size)
          return next
        })

        setWishlistMessage('Product added to your wishlist.')
      }
    } catch (err) {
      console.error('Failed to update wishlist:', err)

      setWishlistMessage(
        err.response?.data?.message ||
          'Could not update your wishlist. Please try again.'
      )
    } finally {
      setWishlistLoadingIds((previous) => {
        const next = new Set(previous)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <main className="min-h-screen bg-warm-white">
      <section className="bg-ivory px-4 py-12 sm:px-6 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">
            Made with love, crafted by hand
          </p>

          <h1 className="mt-3 font-display text-3xl text-burgundy sm:text-4xl lg:text-5xl">
            Shop Handmade Creations
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-burgundy/70 sm:text-base">
            Discover thoughtful handmade treasures, traditional art,
            and beautiful creations for your home and loved ones.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-burgundy/50"
            />

            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search handmade products..."
              aria-label="Search products"
              className="w-full rounded-full border border-burgundy/15 bg-white py-3 pl-11 pr-11 text-sm text-burgundy outline-none transition focus:border-maroon"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  updateFilters({ search: null })
                }}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-burgundy/60 hover:text-maroon"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal
              size={18}
              className="text-maroon"
            />

            <label
              htmlFor="shop-sort"
              className="text-sm text-burgundy/70"
            >
              Sort by
            </label>

            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="min-w-0 flex-1 rounded-full border border-burgundy/15 bg-white px-4 py-2.5 text-sm text-burgundy outline-none focus:border-maroon sm:flex-none"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm transition ${
              category === 'all'
                ? 'bg-maroon text-white'
                : 'bg-ivory text-burgundy hover:bg-ivory/70'
            }`}
          >
            All Products
          </button>

          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCategoryChange(item.slug)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm transition ${
                selectedCategorySlug === item.slug
                  ? 'bg-maroon text-white'
                  : 'bg-ivory text-burgundy hover:bg-ivory/70'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {wishlistMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-burgundy/10 bg-ivory px-4 py-3 text-sm text-burgundy"
          >
            <span>{wishlistMessage}</span>

            {isCustomer && (
              <button
                type="button"
                onClick={() => navigate('/wishlist')}
                className="font-semibold text-maroon underline underline-offset-4"
              >
                View Wishlist
              </button>
            )}

            <button
              type="button"
              onClick={() => setWishlistMessage('')}
              aria-label="Dismiss message"
              className="text-burgundy/60 hover:text-maroon"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-burgundy/70">
            Loading handmade creations...
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-maroon px-6 py-2.5 text-sm text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl bg-ivory px-5 py-16 text-center">
            <h2 className="font-display text-2xl text-burgundy">
              No creations found
            </h2>

            <p className="mt-3 text-sm text-burgundy/70">
              Try another search or select a different category.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-full bg-maroon px-6 py-2.5 text-sm text-white"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-burgundy/60">
              Showing {filteredProducts.length}{' '}
              {filteredProducts.length === 1
                ? 'creation'
                : 'creations'}
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleWishlist={() =>
                    handleToggleWishlist(product.id)
                  }
                  isWishlisted={wishlistIds.has(Number(product.id))}
                  wishlistLoading={wishlistLoadingIds.has(
                    Number(product.id)
                  )}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default Shop
