
import { pool } from '../config/database.js'

const MAX_REVIEW_LENGTH = 1000

function validId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

// GET /api/products/:productId/reviews
export async function getProductReviews(req, res) {
  const productId = validId(req.params.productId)

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID',
    })
  }

  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.product_id,
         r.user_id,
         r.rating,
         r.review_text,
         r.created_at,
         r.updated_at,
         u.name AS customer_name
       FROM product_reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    )

    const summary = await pool.query(
      `SELECT
         COUNT(*)::int AS review_count,
         COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating
       FROM product_reviews
       WHERE product_id = $1`,
      [productId]
    )

    return res.json({
      success: true,
      data: {
        reviews: result.rows,
        summary: summary.rows[0],
      },
    })
  } catch (error) {
    console.error('Get product reviews error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch reviews',
    })
  }
}

// POST /api/products/:productId/reviews
export async function createProductReview(req, res) {
  const productId = validId(req.params.productId)
  const userId = validId(req.user?.id)
  const rating = Number(req.body.rating)
  const reviewText =
    typeof req.body.review_text === 'string'
      ? req.body.review_text.trim()
      : ''

  if (!productId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product or customer ID',
    })
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be a whole number from 1 to 5',
    })
  }

  if (
    reviewText.length < 3 ||
    reviewText.length > MAX_REVIEW_LENGTH
  ) {
    return res.status(400).json({
      success: false,
      message: 'Review must contain 3 to 1000 characters',
    })
  }

  try {
    const product = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = TRUE',
      [productId]
    )

    if (product.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    // A customer must have ordered this product.
    // Cancelled orders do not qualify.
    const purchase = await pool.query(
      `SELECT 1
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
         AND oi.product_id = $2
         AND o.order_status <> 'cancelled'
       LIMIT 1`,
      [userId, productId]
    )

    if (purchase.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this product before reviewing it',
      })
    }

    const result = await pool.query(
      `INSERT INTO product_reviews
         (product_id, user_id, rating, review_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, user_id) DO NOTHING
       RETURNING *`,
      [productId, userId, rating, reviewText]
    )

    if (result.rowCount === 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product. Edit your existing review instead.',
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Create product review error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to submit review',
    })
  }
}

// PUT /api/products/:productId/reviews/mine
export async function updateMyProductReview(req, res) {
  const productId = validId(req.params.productId)
  const userId = validId(req.user?.id)
  const rating = Number(req.body.rating)
  const reviewText =
    typeof req.body.review_text === 'string'
      ? req.body.review_text.trim()
      : ''

  if (!productId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product or customer ID',
    })
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be a whole number from 1 to 5',
    })
  }

  if (
    reviewText.length < 3 ||
    reviewText.length > MAX_REVIEW_LENGTH
  ) {
    return res.status(400).json({
      success: false,
      message: 'Review must contain 3 to 1000 characters',
    })
  }

  try {
    const result = await pool.query(
      `UPDATE product_reviews
       SET rating = $1,
           review_text = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $3 AND user_id = $4
       RETURNING *`,
      [rating, reviewText, productId, userId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your review was not found',
      })
    }

    return res.json({
      success: true,
      message: 'Review updated successfully',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Update product review error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to update review',
    })
  }
}

// DELETE /api/products/:productId/reviews/mine
export async function deleteMyProductReview(req, res) {
  const productId = validId(req.params.productId)
  const userId = validId(req.user?.id)

  if (!productId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product or customer ID',
    })
  }

  try {
    const result = await pool.query(
      `DELETE FROM product_reviews
       WHERE product_id = $1 AND user_id = $2
       RETURNING id`,
      [productId, userId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your review was not found',
      })
    }

    return res.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Delete product review error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to delete review',
    })
  }
}
