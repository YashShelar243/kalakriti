
import { pool } from '../config/database.js'

const CODE_PATTERN = /^[A-Z0-9_-]{3,50}$/

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  })
}

function normalizeCode(code) {
  return typeof code === 'string' ? code.trim().toUpperCase() : ''
}

function calculateDiscount(coupon, subtotal) {
  let discount = 0

  if (coupon.discount_type === 'percentage') {
    discount = subtotal * (Number(coupon.discount_value) / 100)

    if (coupon.max_discount_amount !== null &&
        coupon.max_discount_amount !== undefined) {
      discount = Math.min(
        discount,
        Number(coupon.max_discount_amount)
      )
    }
  } else {
    discount = Number(coupon.discount_value)
  }

  // A discount cannot exceed the product subtotal.
  discount = Math.min(discount, subtotal)

  return Math.round(discount * 100) / 100
}

function validateCouponInput(body) {
  const code = normalizeCode(body.code)
  const description =
    typeof body.description === 'string'
      ? body.description.trim()
      : ''

  const discountType = body.discount_type
  const discountValue = Number(body.discount_value)
  const minOrderAmount = Number(body.min_order_amount ?? 0)

  const maxDiscountAmount =
    body.max_discount_amount === '' ||
    body.max_discount_amount === null ||
    body.max_discount_amount === undefined
      ? null
      : Number(body.max_discount_amount)

  const usageLimit =
    body.usage_limit === '' ||
    body.usage_limit === null ||
    body.usage_limit === undefined
      ? null
      : Number(body.usage_limit)

  const startsAt = body.starts_at || null
  const expiresAt = body.expires_at || null
  const isActive = body.is_active ?? true

  if (!CODE_PATTERN.test(code)) {
    return { error: 'Code must contain 3–50 letters, numbers, hyphens or underscores.' }
  }

  if (description.length > 255) {
    return { error: 'Description cannot exceed 255 characters.' }
  }

  if (!['percentage', 'fixed'].includes(discountType)) {
    return { error: 'Choose percentage or fixed discount.' }
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: 'Discount value must be greater than zero.' }
  }

  if (discountType === 'percentage' && discountValue > 100) {
    return { error: 'Percentage discount cannot exceed 100%.' }
  }

  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    return { error: 'Minimum order amount cannot be negative.' }
  }

  if (
    maxDiscountAmount !== null &&
    (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0)
  ) {
    return { error: 'Maximum discount must be greater than zero.' }
  }

  if (discountType === 'fixed' && maxDiscountAmount !== null) {
    return { error: 'Maximum discount is only used for percentage coupons.' }
  }

  if (
    usageLimit !== null &&
    (!Number.isSafeInteger(usageLimit) || usageLimit <= 0)
  ) {
    return { error: 'Usage limit must be a positive whole number.' }
  }

  if (typeof isActive !== 'boolean') {
    return { error: 'Invalid active status.' }
  }

  if (
    startsAt &&
    Number.isNaN(Date.parse(startsAt))
  ) {
    return { error: 'Enter a valid start date.' }
  }

  if (
    expiresAt &&
    Number.isNaN(Date.parse(expiresAt))
  ) {
    return { error: 'Enter a valid expiry date.' }
  }

  if (
    startsAt &&
    expiresAt &&
    new Date(expiresAt) <= new Date(startsAt)
  ) {
    return { error: 'Expiry date must be later than the start date.' }
  }

  return {
    value: {
      code,
      description: description || null,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      startsAt,
      expiresAt,
      isActive,
    },
  }
}

// Customer: validate a coupon before checkout.
export async function validateCoupon(req, res) {
  const code = normalizeCode(req.body?.code)
  const subtotal = Number(req.body?.subtotal)

  if (!CODE_PATTERN.test(code)) {
    return sendError(res, 400, 'Enter a valid promo code.')
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return sendError(res, 400, 'Invalid order subtotal.')
  }

  try {
    const result = await pool.query(
      `SELECT id, code, description, discount_type, discount_value,
              min_order_amount, max_discount_amount, usage_limit,
              used_count, starts_at, expires_at, is_active
       FROM coupons
       WHERE code = $1`,
      [code]
    )

    if (!result.rows.length) {
      return sendError(res, 404, 'This promo code does not exist.')
    }

    const coupon = result.rows[0]
    const now = Date.now()

    if (!coupon.is_active) {
      return sendError(res, 400, 'This promo code is inactive.')
    }

    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
      return sendError(res, 400, 'This promo code is not active yet.')
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) {
      return sendError(res, 400, 'This promo code has expired.')
    }

    if (
      coupon.usage_limit !== null &&
      Number(coupon.used_count) >= Number(coupon.usage_limit)
    ) {
      return sendError(res, 400, 'This promo code has reached its usage limit.')
    }

    if (subtotal < Number(coupon.min_order_amount)) {
      return sendError(
        res,
        400,
        `Minimum order amount for this code is ₹${Number(coupon.min_order_amount).toFixed(2)}.`
      )
    }

    const discountAmount = calculateDiscount(coupon, subtotal)

    return res.json({
      success: true,
      message: 'Promo code applied successfully.',
      data: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discount_amount: discountAmount,
        subtotal,
        discounted_subtotal: Math.round((subtotal - discountAmount) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Validate coupon error:', error.message)
    return sendError(res, 500, 'Unable to validate this promo code.')
  }
}

// Admin: list all coupons.
export async function getCoupons(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, code, description, discount_type, discount_value,
              min_order_amount, max_discount_amount, usage_limit,
              used_count, starts_at, expires_at, is_active,
              created_at, updated_at
       FROM coupons
       ORDER BY created_at DESC`
    )

    return res.json({
      success: true,
      data: { coupons: result.rows },
    })
  } catch (error) {
    console.error('Get coupons error:', error.message)
    return sendError(res, 500, 'Unable to load coupons.')
  }
}

// Admin: create a coupon.
export async function createCoupon(req, res) {
  const validation = validateCouponInput(req.body ?? {})

  if (validation.error) {
    return sendError(res, 400, validation.error)
  }

  const c = validation.value

  try {
    const result = await pool.query(
      `INSERT INTO coupons (
         code, description, discount_type, discount_value,
         min_order_amount, max_discount_amount, usage_limit,
         starts_at, expires_at, is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        c.code,
        c.description,
        c.discountType,
        c.discountValue,
        c.minOrderAmount,
        c.maxDiscountAmount,
        c.usageLimit,
        c.startsAt,
        c.expiresAt,
        c.isActive,
      ]
    )

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully.',
      data: { coupon: result.rows[0] },
    })
  } catch (error) {
    if (error.code === '23505') {
      return sendError(res, 409, 'A coupon with this code already exists.')
    }

    console.error('Create coupon error:', error.message)
    return sendError(res, 500, 'Unable to create coupon.')
  }
}

// Admin: update a coupon.
export async function updateCoupon(req, res) {
  const id = Number(req.params.id)

  if (!Number.isSafeInteger(id) || id <= 0) {
    return sendError(res, 400, 'Invalid coupon ID.')
  }

  const validation = validateCouponInput(req.body ?? {})

  if (validation.error) {
    return sendError(res, 400, validation.error)
  }

  const c = validation.value

  try {
    const result = await pool.query(
      `UPDATE coupons
       SET code = $1,
           description = $2,
           discount_type = $3,
           discount_value = $4,
           min_order_amount = $5,
           max_discount_amount = $6,
           usage_limit = $7,
           starts_at = $8,
           expires_at = $9,
           is_active = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        c.code,
        c.description,
        c.discountType,
        c.discountValue,
        c.minOrderAmount,
        c.maxDiscountAmount,
        c.usageLimit,
        c.startsAt,
        c.expiresAt,
        c.isActive,
        id,
      ]
    )

    if (!result.rows.length) {
      return sendError(res, 404, 'Coupon not found.')
    }

    return res.json({
      success: true,
      message: 'Coupon updated successfully.',
      data: { coupon: result.rows[0] },
    })
  } catch (error) {
    if (error.code === '23505') {
      return sendError(res, 409, 'A coupon with this code already exists.')
    }

    console.error('Update coupon error:', error.message)
    return sendError(res, 500, 'Unable to update coupon.')
  }
}

// Admin: change active status without changing other coupon settings.
export async function updateCouponStatus(req, res) {
  const id = Number(req.params.id)
  const { is_active: isActive } = req.body ?? {}

  if (!Number.isSafeInteger(id) || id <= 0) {
    return sendError(res, 400, 'Invalid coupon ID.')
  }

  if (typeof isActive !== 'boolean') {
    return sendError(res, 400, 'is_active must be true or false.')
  }

  try {
    const result = await pool.query(
      `UPDATE coupons
       SET is_active = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [isActive, id]
    )

    if (!result.rows.length) {
      return sendError(res, 404, 'Coupon not found.')
    }

    return res.json({
      success: true,
      message: isActive ? 'Coupon activated.' : 'Coupon deactivated.',
      data: { coupon: result.rows[0] },
    })
  } catch (error) {
    console.error('Update coupon status error:', error.message)
    return sendError(res, 500, 'Unable to update coupon status.')
  }
}

// Admin: delete a coupon.
export async function deleteCoupon(req, res) {
  const id = Number(req.params.id)

  if (!Number.isSafeInteger(id) || id <= 0) {
    return sendError(res, 400, 'Invalid coupon ID.')
  }

  try {
    const result = await pool.query(
      'DELETE FROM coupons WHERE id = $1 RETURNING id, code',
      [id]
    )

    if (!result.rows.length) {
      return sendError(res, 404, 'Coupon not found.')
    }

    return res.json({
      success: true,
      message: 'Coupon deleted successfully.',
      data: { coupon: result.rows[0] },
    })
  } catch (error) {
    console.error('Delete coupon error:', error.message)
    return sendError(res, 500, 'Unable to delete coupon.')
  }
}
