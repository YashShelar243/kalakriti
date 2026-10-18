
import { pool } from '../config/database.js'

// GET /api/wishlist
// Get the logged-in customer's wishlist
export async function getWishlist(req, res) {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT
          wi.id AS wishlist_id,
          wi.created_at AS added_at,
          p.id,
          p.name,
          p.slug,
          p.description,
          p.price,
          p.image_url,
          p.stock_quantity,
          p.size,
          p.category_id
       FROM wishlist_items wi
       JOIN products p ON p.id = wi.product_id
       WHERE wi.user_id = $1
         AND p.is_active = TRUE
       ORDER BY wi.created_at DESC`,
      [userId]
    )

    return res.status(200).json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Get wishlist error:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to load wishlist.',
    })
  }
}

// POST /api/wishlist/:productId
// Add a product to the wishlist
export async function addToWishlist(req, res) {
  try {
    const userId = req.user.id
    const productId = Number(req.params.productId)

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      })
    }

    const product = await pool.query(
      `SELECT id
       FROM products
       WHERE id = $1 AND is_active = TRUE`,
      [productId]
    )

    if (product.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable.',
      })
    }

    const result = await pool.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING id, product_id, created_at`,
      [userId, productId]
    )

    if (result.rowCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'Product is already in your wishlist.',
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Product added to wishlist.',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Add to wishlist error:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to add product to wishlist.',
    })
  }
}

// DELETE /api/wishlist/:productId
// Remove a product from the wishlist
export async function removeFromWishlist(req, res) {
  try {
    const userId = req.user.id
    const productId = Number(req.params.productId)

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      })
    }

    const result = await pool.query(
      `DELETE FROM wishlist_items
       WHERE user_id = $1 AND product_id = $2
       RETURNING id`,
      [userId, productId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product was not found in your wishlist.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
    })
  } catch (error) {
    console.error('Remove from wishlist error:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to remove product from wishlist.',
    })
  }
}
