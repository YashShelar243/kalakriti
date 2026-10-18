
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  wishlistLoading = false,
}) {
  const { addToCart } = useCart()

  const {
    id,
    name,
    slug,
    price,
    image,
    image_url,
    category,
    category_name,
    rating,
    originalPrice,
    original_price,
    isNew = false,
    is_new = false,
  } = product

  const productImage = image_url || image
  const productCategory = category_name || category || 'Handcrafted'
  const displayPrice = Number(price || 0)
  const displayOriginalPrice = Number(original_price ?? originalPrice)

  const handleAddToCart = () => {
    const result = addToCart(product)

    if (!result?.success) {
      alert(result?.message || 'Unable to add this product to your cart.')
      return
    }

    alert(result.message || 'Product added to your cart.')
    onAddToCart?.(product)
  }

  const handleWishlistClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onToggleWishlist?.(id)
  }

  return (
    <article className="group overflow-hidden rounded-2xl bg-warm-white">
      <div className="relative overflow-hidden bg-ivory">
        <Link
          to={`/products/${slug || id}`}
          aria-label={`View ${name}`}
          className="block"
        >
          {productImage ? (
            <img
              src={productImage}
              alt={name}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
              className="h-48 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-64"
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-burgundy/60 sm:h-64">
              Image coming soon
            </div>
          )}
        </Link>

        {(isNew || is_new) && (
          <span className="absolute left-3 top-3 rounded-full bg-maroon px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
            New
          </span>
        )}

        {/* Wishlist heart button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          disabled={wishlistLoading}
          aria-label={
            isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
          }
          aria-pressed={isWishlisted}
          title={
            isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
          }
          className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${
            isWishlisted
              ? 'bg-maroon text-white'
              : 'bg-white/95 text-maroon hover:bg-maroon hover:text-white'
          } ${
            wishlistLoading
              ? 'cursor-wait opacity-60'
              : 'cursor-pointer'
          }`}
        >
          <Heart
            size={19}
            fill={isWishlisted ? 'currentColor' : 'none'}
            className={wishlistLoading ? 'animate-pulse' : ''}
          />
        </button>
      </div>

      <div className="p-3 sm:p-5">
        <p className="text-[10px] uppercase tracking-wider text-gold sm:text-xs">
          {productCategory}
        </p>

        <h3 className="mt-2 min-h-10 font-display text-sm text-burgundy sm:text-lg">
          <Link
            to={`/products/${slug || id}`}
            className="transition hover:text-maroon"
          >
            {name}
          </Link>
        </h3>

        {rating != null && (
          <div className="mt-2 flex items-center gap-1 text-xs text-burgundy/70">
            <Star
              size={13}
              fill="#C5A15B"
              stroke="#C5A15B"
            />
            <span>{rating}</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-maroon">
              ₹
              {displayPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>

            {Number.isFinite(displayOriginalPrice) &&
              displayOriginalPrice > displayPrice && (
                <span className="text-xs text-burgundy/50 line-through">
                  ₹{displayOriginalPrice.toLocaleString('en-IN')}
                </span>
              )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-3 py-2 text-[10px] text-white transition hover:bg-burgundy sm:px-4 sm:text-xs"
          >
            <ShoppingBag size={13} />
            Add to Bag
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
