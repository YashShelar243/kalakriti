
import { pool } from '../config/database.js'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone)
}

function isValidPincode(pincode) {
  return /^\d{6}$/.test(pincode)
}

const allowedOrderStatuses = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

const allowedPaymentStatuses = ['pending', 'paid', 'failed']

// Create a new order for the authenticated customer
export async function createOrder(req, res) {
  const {
    customer,
    items,
    shippingAddress,
    paymentMethod = 'cod',
    couponCode: rawCouponCode,
  } = req.body ?? {}

  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to place an order.',
    })
  }

  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) {
    return res.status(400).json({
      success: false,
      message: 'Customer details are required.',
    })
  }

  const { name, email, phone } = customer
  const { address, city, state, pincode } = shippingAddress || {}

  if (
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    name.trim().length > 120 ||
    typeof email !== 'string' ||
    email.trim().length > 255 ||
    !isValidEmail(email.trim()) ||
    typeof phone !== 'string' ||
    !isValidPhone(phone.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid customer details.',
    })
  }

  if (
    typeof address !== 'string' ||
    !address.trim() ||
    address.trim().length > 1000 ||
    typeof city !== 'string' ||
    !city.trim() ||
    typeof state !== 'string' ||
    !state.trim() ||
    typeof pincode !== 'string' ||
    !isValidPincode(pincode.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a complete and valid shipping address.',
    })
  }

  if (paymentMethod !== 'cod') {
    return res.status(400).json({
      success: false,
      message: 'The selected payment method is not supported.',
    })
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Your order must contain at least one product.',
    })
  }

  const couponCode =
    typeof rawCouponCode === 'string'
      ? rawCouponCode.trim().toUpperCase()
      : ''

  if (couponCode && !/^[A-Z0-9_-]{3,50}$/.test(couponCode)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid promo code format.',
    })
  }

  const quantities = new Map()

  for (const item of items) {
    const productId = Number(item?.productId)
    const quantity = Number(item?.quantity)

    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'An order item has an invalid product ID or quantity.',
      })
    }

    quantities.set(
      productId,
      (quantities.get(productId) || 0) + quantity
    )
  }

  if ([...quantities.values()].some((quantity) => quantity > 100)) {
    return res.status(400).json({
      success: false,
      message: 'The quantity of a product exceeds the order limit.',
    })
  }

  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const productIds = [...quantities.keys()].sort((a, b) => a - b)

    const productResult = await client.query(
      `SELECT id, name, price, stock_quantity
       FROM products
       WHERE id = ANY($1::bigint[]) AND is_active = TRUE
       ORDER BY id
       FOR UPDATE`,
      [productIds.map(String)]
    )

    const productsById = new Map(
      productResult.rows.map((product) => [
        String(product.id),
        product,
      ])
    )

    if (productsById.size !== productIds.length) {
      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'One or more products are unavailable.',
      })
    }

    let subtotalInPaise = 0
    const orderItems = []

    for (const [productId, quantity] of quantities) {
      const product = productsById.get(String(productId))

      if (Number(product.stock_quantity) < quantity) {
        await client.query('ROLLBACK')

        return res.status(409).json({
          success: false,
          message: `${product.name} does not have enough stock.`,
        })
      }

      const unitPriceInPaise = Math.round(Number(product.price) * 100)
      const lineTotalInPaise = unitPriceInPaise * quantity

      if (
        !Number.isSafeInteger(unitPriceInPaise) ||
        unitPriceInPaise < 0 ||
        !Number.isSafeInteger(lineTotalInPaise)
      ) {
        throw new Error('Invalid product price.')
      }

      subtotalInPaise += lineTotalInPaise

      orderItems.push({
        productId: String(product.id),
        name: product.name,
        quantity,
        unitPrice: unitPriceInPaise / 100,
        lineTotal: lineTotalInPaise / 100,
      })
    }

    if (!Number.isSafeInteger(subtotalInPaise)) {
      throw new Error('Order total is too large.')
    }

    const subtotal = subtotalInPaise / 100
    let coupon = null
    let discountAmount = 0

    if (couponCode) {
      const couponResult = await client.query(
        `SELECT *
         FROM coupons
         WHERE code = $1
         FOR UPDATE`,
        [couponCode]
      )

      if (!couponResult.rows.length) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'This promo code does not exist.',
        })
      }

      coupon = couponResult.rows[0]
      const now = Date.now()

      if (!coupon.is_active) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'This promo code is inactive.',
        })
      }

      if (
        coupon.starts_at &&
        new Date(coupon.starts_at).getTime() > now
      ) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'This promo code is not active yet.',
        })
      }

      if (
        coupon.expires_at &&
        new Date(coupon.expires_at).getTime() <= now
      ) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'This promo code has expired.',
        })
      }

      if (
        coupon.usage_limit !== null &&
        Number(coupon.used_count) >= Number(coupon.usage_limit)
      ) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'This promo code has reached its usage limit.',
        })
      }

      if (subtotal < Number(coupon.min_order_amount)) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: `Your order subtotal must be at least ₹${Number(
            coupon.min_order_amount
          ).toFixed(2)} to use this promo code.`,
        })
      }

      if (coupon.discount_type === 'percentage') {
        discountAmount =
          subtotal * (Number(coupon.discount_value) / 100)

        if (coupon.max_discount_amount !== null) {
          discountAmount = Math.min(
            discountAmount,
            Number(coupon.max_discount_amount)
          )
        }
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = Number(coupon.discount_value)
      }

      discountAmount =
        Math.round(Math.min(discountAmount, subtotal) * 100) / 100
    }

    const shippingFee = subtotal >= 999 ? 0 : 60

    const total =
      Math.round((subtotal - discountAmount + shippingFee) * 100) / 100

    const orderNumber = `KK-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`

    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        subtotal,
        shipping_fee,
        total_amount,
        payment_method,
        payment_status,
        coupon_id,
        coupon_code,
        discount_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING
        id,
        user_id,
        order_number,
        subtotal,
        shipping_fee,
        total_amount,
        payment_method,
        payment_status,
        coupon_id,
        coupon_code,
        discount_amount,
        created_at`,
      [
        String(userId),
        orderNumber,
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        JSON.stringify({
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        }),
        subtotal,
        shippingFee,
        total,
        'cod',
        'pending',
        coupon?.id ?? null,
        coupon?.code ?? null,
        discountAmount,
      ]
    )

    const order = orderResult.rows[0]

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          String(order.id),
          item.productId,
          item.name,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
        ]
      )

      await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2`,
        [item.quantity, item.productId]
      )
    }

    if (coupon) {
      await client.query(
        `UPDATE coupons
         SET used_count = used_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [coupon.id]
      )
    }

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      message: 'Your order has been placed successfully.',
      data: {
        ...order,
        items: orderItems,
      },
    })
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Order rollback failed:', rollbackError.message)
      }
    }

    console.error('Create order error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to place your order right now. Please try again.',
    })
  } finally {
    client?.release()
  }
}

// Get orders belonging only to the authenticated customer
export async function getMyOrders(req, res) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to view your orders.',
    })
  }

  try {
    const result = await pool.query(
      `SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.shipping_address,
        o.subtotal,
        o.shipping_fee,
        o.total_amount,
        o.coupon_id,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        COALESCE(
          json_agg(
            json_build_object(
              'productId', oi.product_id,
              'name', oi.product_name,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price,
              'lineTotal', oi.line_total
            )
            ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [String(userId)]
    )

    return res.status(200).json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Get customer orders error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve your orders right now.',
    })
  }
}

// Admin: Get all orders with search, status filter and pagination
export async function getAllOrders(req, res) {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100)
    const status = String(req.query.status || '').trim()

    if (status && !allowedOrderStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status filter.',
      })
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    )
    const offset = (page - 1) * limit

    if (!Number.isSafeInteger(offset)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number.',
      })
    }

    const values = []
    const conditions = []

    if (search) {
      values.push(`%${search}%`)
      const index = values.length

      conditions.push(
        `(o.order_number ILIKE $${index}
          OR o.customer_name ILIKE $${index}
          OR o.customer_email ILIKE $${index}
          OR o.customer_phone ILIKE $${index})`
      )
    }

    if (status) {
      values.push(status)
      conditions.push(`o.order_status = $${values.length}`)
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM orders o
       ${whereClause}`,
      values
    )

    const total = countResult.rows[0].total

    const ordersResult = await pool.query(
      `SELECT
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.subtotal,
        o.shipping_fee,
        o.total_amount,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        COUNT(oi.id)::int AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${whereClause}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $${values.length + 1}
       OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    )

    return res.json({
      success: true,
      data: {
        orders: ordersResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get all orders error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve orders.',
    })
  }
}

// Admin: Get one order with items and shipping address
export async function getOrderDetails(req, res) {
  const { id } = req.params

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID.',
    })
  }

  try {
    const result = await pool.query(
      `SELECT
        o.id,
        o.order_number,
        o.user_id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.shipping_address,
        o.subtotal,
        o.shipping_fee,
        o.total_amount,
        o.coupon_id,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'productId', oi.product_id,
              'name', oi.product_name,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price,
              'lineTotal', oi.line_total
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    )

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    return res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Get order details error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve order details.',
    })
  }
}

// Admin: Update order status
export async function updateOrderStatus(req, res) {
  const { id } = req.params
  const { orderStatus } = req.body ?? {}

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID.',
    })
  }

  if (!allowedOrderStatuses.includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order status.',
    })
  }

  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const orderResult = await client.query(
      `SELECT id, order_status
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [id]
    )

    if (!orderResult.rows.length) {
      await client.query('ROLLBACK')

      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    const currentStatus = orderResult.rows[0].order_status

    if (currentStatus === orderStatus) {
      await client.query('ROLLBACK')

      return res.json({
        success: true,
        message: 'The order already has this status.',
        data: { id, orderStatus: currentStatus },
      })
    }

    if (currentStatus === 'cancelled' || currentStatus === 'delivered') {
      await client.query('ROLLBACK')

      return res.status(409).json({
        success: false,
        message: `A ${currentStatus} order cannot be changed.`,
      })
    }

    if (orderStatus === 'cancelled') {
      const itemsResult = await client.query(
        `SELECT product_id, quantity
         FROM order_items
         WHERE order_id = $1 AND product_id IS NOT NULL`,
        [id]
      )

      for (const item of itemsResult.rows) {
        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity + $1
           WHERE id = $2`,
          [item.quantity, item.product_id]
        )
      }
    }

    const updatedResult = await client.query(
      `UPDATE orders
       SET order_status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, order_number, order_status, payment_status, updated_at`,
      [orderStatus, id]
    )

    await client.query('COMMIT')

    return res.json({
      success: true,
      message: 'Order status updated successfully.',
      data: updatedResult.rows[0],
    })
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Order status rollback failed:', rollbackError.message)
      }
    }

    console.error('Update order status error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to update order status.',
    })
  } finally {
    client?.release()
  }
}

// Admin: Update payment status independently of delivery status
export async function updatePaymentStatus(req, res) {
  const { id } = req.params
  const { paymentStatus } = req.body ?? {}

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID.',
    })
  }

  if (!allowedPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment status. Use pending, paid, or failed.',
    })
  }

  try {
    const result = await pool.query(
      `UPDATE orders
       SET payment_status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING
         id,
         order_number,
         payment_method,
         payment_status,
         order_status,
         updated_at`,
      [paymentStatus, id]
    )

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    return res.json({
      success: true,
      message: 'Payment status updated successfully.',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Update payment status error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to update payment status.',
    })
  }
}
