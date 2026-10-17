
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  PackageCheck,
  ShieldCheck,
  Truck,
  Ruler,
  CheckCircle2,
  AlertCircle,
  Star,
  Send,
  Pencil,
  Trash2,
  MessageSquare,
} from 'lucide-react'

import { fetchProductBySlug } from '../services/productService'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function ProductDetails() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState(null)

  // Reviews
  const [reviews, setReviews] = useState([])
  const [reviewSummary, setReviewSummary] = useState({
    review_count: 0,
    average_rating: 0,
  })
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [editingReview, setEditingReview] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      try {
        setLoading(true)
        setError('')
        setProduct(null)
        setQuantity(1)
        setCartMessage(null)

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

  const loadReviews = useCallback(async () => {
    if (!product?.id) return

    try {
      setReviewsLoading(true)
      setReviewError('')

      const response = await api.get(
        `/products/${product.id}/reviews`
      )

      const data = response.data.data

      setReviews(data?.reviews || [])
      setReviewSummary(
        data?.summary || {
          review_count: 0,
          average_rating: 0,
        }
      )
    } catch (err) {
      console.error('Failed to load reviews:', err)
      setReviewError('Unable to load reviews. Please try again.')
    } finally {
      setReviewsLoading(false)
    }
  }, [product?.id])

  useEffect(() => {
    if (product?.id) {
      loadReviews()
    }
  }, [product?.id, loadReviews])

  const stock = Number(product?.stock_quantity ?? 0)
  const price = Number(product?.price ?? 0)
  const outOfStock = stock <= 0

  const myReview = reviews.find(
    (review) => String(review.user_id) === String(user?.id)
  )

  function handleAddToCart() {
    if (!product || outOfStock) return

    const result = addToCart(
      {
        ...product,
        stock_quantity: stock,
      },
      quantity
    )

    setCartMessage({
      success: result.success,
      message: result.message,
    })
  }

  function startEditingReview() {
    if (!myReview) return

    setReviewRating(Number(myReview.rating))
    setReviewText(myReview.review_text || '')
    setEditingReview(true)
    setReviewMessage(null)
  }

  function cancelEditingReview() {
    setEditingReview(false)
    setReviewRating(5)
    setReviewText('')
    setReviewMessage(null)
  }

  async function handleSubmitReview(event) {
    event.preventDefault()

    if (!isAuthenticated) {
      setReviewMessage({
        success: false,
        message: 'Please log in to submit a review.',
      })
      return
    }

    const cleanedText = reviewText.trim()

    if (cleanedText.length < 3 || cleanedText.length > 1000) {
      setReviewMessage({
        success: false,
        message: 'Your review must contain 3 to 1000 characters.',
      })
      return
    }

    try {
      setReviewSubmitting(true)
      setReviewMessage(null)

      const payload = {
        rating: reviewRating,
        review_text: cleanedText,
      }

      if (editingReview) {
        await api.put(
          `/products/${product.id}/reviews/mine`,
          payload
        )
      } else {
        await api.post(
          `/products/${product.id}/reviews`,
          payload
        )
      }

      setReviewMessage({
        success: true,
        message: editingReview
          ? 'Your review has been updated.'
          : 'Your review has been submitted.',
      })

      setReviewRating(5)
      setReviewText('')
      setEditingReview(false)

      await loadReviews()
    } catch (err) {
      console.error('Review submission failed:', err)

      setReviewMessage({
        success: false,
        message:
          err.response?.data?.message ||
          'Unable to save your review. Please try again.',
      })
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleDeleteReview() {
    const confirmed = window.confirm(
      'Are you sure you want to delete your review?'
    )

    if (!confirmed) return

    try {
      setReviewSubmitting(true)
      setReviewMessage(null)

      await api.delete(
        `/products/${product.id}/reviews/mine`
      )

      setReviewMessage({
        success: true,
        message: 'Your review has been deleted.',
      })

      setReviewRating(5)
      setReviewText('')
      setEditingReview(false)

      await loadReviews()
    } catch (err) {
      console.error('Review deletion failed:', err)

      setReviewMessage({
        success: false,
        message:
          err.response?.data?.message ||
          'Unable to delete your review. Please try again.',
      })
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-warm-white px-4">
        <p className="text-burgundy/70">
          Loading your handmade creation...
        </p>
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

            {/* Product rating summary */}
            <a
              href="#customer-reviews"
              className="mt-4 inline-flex items-center gap-2 text-sm text-burgundy/75 hover:text-maroon"
            >
              <span className="flex items-center gap-1 text-gold">
                <Star size={17} fill="currentColor" />
                <span className="font-semibold text-burgundy">
                  {Number(reviewSummary.average_rating || 0).toFixed(1)}
                </span>
              </span>

              <span>
                ({reviewSummary.review_count} reviews)
              </span>
            </a>

            <p className="mt-5 text-2xl font-semibold text-maroon sm:text-3xl">
              ₹
              {price.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            {product.size && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-burgundy/10 bg-ivory/60 p-4">
                <Ruler
                  size={21}
                  className="mt-0.5 shrink-0 text-gold"
                />

                <div>
                  <h2 className="text-sm font-semibold text-burgundy">
                    Product Size
                  </h2>

                  <p className="mt-1 text-sm text-burgundy/75">
                    {product.size}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-burgundy/10 pt-5">
              <h2 className="font-display text-lg text-burgundy">
                About this creation
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-burgundy/70">
                {product.description ||
                  'A unique handmade creation made with care.'}
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
                  onClick={() => {
                    setQuantity((value) => Math.max(1, value - 1))
                    setCartMessage(null)
                  }}
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
                  onClick={() => {
                    setQuantity((value) => Math.min(stock, value + 1))
                    setCartMessage(null)
                  }}
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

            {cartMessage && (
              <div
                role="status"
                className={`mt-4 rounded-xl border p-4 ${
                  cartMessage.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  {cartMessage.success ? (
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0 text-green-700"
                    />
                  ) : (
                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-700"
                    />
                  )}

                  <div>
                    <p
                      className={`text-sm font-medium ${
                        cartMessage.success
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {cartMessage.message}
                    </p>

                    {cartMessage.success && (
                      <Link
                        to="/cart"
                        className="mt-2 inline-block text-sm font-semibold text-maroon underline underline-offset-4 hover:text-burgundy"
                      >
                        View Bag / Go to Cart
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-burgundy/10 pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-3 text-burgundy/70">
                <PackageCheck size={21} className="shrink-0 text-gold" />
                <span className="text-xs">
                  Thoughtfully handcrafted
                </span>
              </div>

              <div className="flex items-center gap-3 text-burgundy/70">
                <Truck size={21} className="shrink-0 text-gold" />
                <span className="text-xs">
                  Delivery details at checkout
                </span>
              </div>

              <div className="flex items-center gap-3 text-burgundy/70">
                <ShieldCheck size={21} className="shrink-0 text-gold" />
                <span className="text-xs">
                  Secure shopping experience
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer reviews */}
        <section
          id="customer-reviews"
          className="mt-16 border-t border-burgundy/10 pt-10 sm:mt-20 sm:pt-14"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold">
                Customer feedback
              </p>

              <h2 className="mt-2 font-display text-3xl text-burgundy sm:text-4xl">
                Reviews & Ratings
              </h2>

              <p className="mt-2 text-sm text-burgundy/65">
                Discover what customers think about this creation.
              </p>
            </div>

            <div className="rounded-2xl border border-burgundy/10 bg-ivory/60 p-5">
              <div className="flex items-center gap-3">
                <span className="font-display text-4xl text-burgundy">
                  {Number(reviewSummary.average_rating || 0).toFixed(1)}
                </span>

                <div>
                  <div className="flex gap-1 text-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={
                          star <= Math.round(
                            Number(reviewSummary.average_rating || 0)
                          )
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    ))}
                  </div>

                  <p className="mt-1 text-xs text-burgundy/65">
                    Based on {reviewSummary.review_count} reviews
                  </p>
                </div>
              </div>
            </div>
          </div>

          {reviewMessage && (
            <div
              role="status"
              className={`mt-6 rounded-xl border p-4 text-sm ${
                reviewMessage.success
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {reviewMessage.message}
            </div>
          )}

          {/* Review form */}
          <div className="mt-8 rounded-2xl border border-burgundy/10 bg-white p-5 sm:p-7">
            {myReview && !editingReview ? (
              <div>
                <h3 className="font-display text-xl text-burgundy">
                  Your review
                </h3>

                <div className="mt-3 flex gap-1 text-gold">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      fill={
                        star <= Number(myReview.rating)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  ))}
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-burgundy/75">
                  {myReview.review_text}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startEditingReview}
                    disabled={reviewSubmitting}
                    className="inline-flex items-center gap-2 rounded-full border border-burgundy/20 px-5 py-2.5 text-sm text-burgundy hover:bg-ivory disabled:opacity-50"
                  >
                    <Pencil size={15} />
                    Edit review
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    disabled={reviewSubmitting}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Delete review
                  </button>
                </div>
              </div>
            ) : isAuthenticated ? (
              <form onSubmit={handleSubmitReview}>
                <h3 className="font-display text-xl text-burgundy">
                  {editingReview ? 'Edit your review' : 'Write a review'}
                </h3>

                <p className="mt-2 text-sm text-burgundy/65">
                  Share your experience with this handmade creation.
                  Reviews are available to customers who have purchased it.
                </p>

                <fieldset className="mt-5">
                  <legend className="text-sm font-medium text-burgundy">
                    Your rating
                  </legend>

                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        aria-label={`Rate ${star} out of 5 stars`}
                        aria-pressed={reviewRating === star}
                        className="rounded-md p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold"
                      >
                        <Star
                          size={27}
                          className={
                            star <= reviewRating
                              ? 'text-gold'
                              : 'text-burgundy/20'
                          }
                          fill={
                            star <= reviewRating
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-5">
                  <label
                    htmlFor="review-text"
                    className="block text-sm font-medium text-burgundy"
                  >
                    Your review
                  </label>

                  <textarea
                    id="review-text"
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    placeholder="What did you like about this product?"
                    minLength={3}
                    maxLength={1000}
                    required
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-burgundy/15 bg-warm-white px-4 py-3 text-sm text-burgundy outline-none transition placeholder:text-burgundy/35 focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />

                  <p className="mt-1 text-right text-xs text-burgundy/50">
                    {reviewText.length}/1000 characters
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm font-medium text-white transition hover:bg-burgundy disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={16} />
                    {reviewSubmitting
                      ? 'Saving...'
                      : editingReview
                        ? 'Update review'
                        : 'Submit review'}
                  </button>

                  {editingReview && (
                    <button
                      type="button"
                      onClick={cancelEditingReview}
                      disabled={reviewSubmitting}
                      className="rounded-full border border-burgundy/20 px-6 py-3 text-sm text-burgundy hover:bg-ivory disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-start gap-3">
                  <MessageSquare
                    size={22}
                    className="mt-1 shrink-0 text-gold"
                  />

                  <div>
                    <h3 className="font-display text-xl text-burgundy">
                      Have you purchased this creation?
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-burgundy/65">
                      Log in with your customer account to write a review
                      after purchasing this product.
                    </p>

                    <Link
                      to="/login"
                      className="mt-4 inline-flex rounded-full bg-maroon px-6 py-3 text-sm font-medium text-white transition hover:bg-burgundy"
                    >
                      Log in to review
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review list */}
          <div className="mt-8">
            <h3 className="font-display text-2xl text-burgundy">
              Customer experiences
            </h3>

            {reviewsLoading ? (
              <p className="mt-5 text-sm text-burgundy/65">
                Loading reviews...
              </p>
            ) : reviewError ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{reviewError}</p>

                <button
                  type="button"
                  onClick={loadReviews}
                  className="mt-3 text-sm font-semibold text-maroon underline"
                >
                  Try again
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-burgundy/20 bg-ivory/40 px-5 py-10 text-center">
                <MessageSquare
                  size={30}
                  className="mx-auto text-gold"
                />

                <p className="mt-3 font-medium text-burgundy">
                  No reviews yet
                </p>

                <p className="mt-1 text-sm text-burgundy/60">
                  Be the first customer to share your experience.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-burgundy/10 bg-white p-5 sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <h4 className="font-semibold text-burgundy">
                          {review.customer_name || 'Customer'}
                        </h4>

                        <div className="mt-2 flex gap-1 text-gold">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={15}
                              fill={
                                star <= Number(review.rating)
                                  ? 'currentColor'
                                  : 'none'
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-burgundy/50">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString(
                              'en-IN',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : ''}
                        {review.updated_at &&
                          review.created_at &&
                          new Date(review.updated_at).getTime() >
                            new Date(review.created_at).getTime() + 1000 && (
                            <span className="ml-2">(edited)</span>
                          )}
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-burgundy/75">
                      {review.review_text}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default ProductDetails
