
import { pool } from '../config/database.js'

export async function getDashboardStats(req, res) {
  try {
    const [
      productsResult,
      ordersResult,
      customersResult,
      salesResult,
      recentOrdersResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_products,
          COUNT(*) FILTER (WHERE is_active = true)::int AS active_products,
          COUNT(*) FILTER (
            WHERE stock_quantity <= 5 AND is_active = true
          )::int AS low_stock_products
        FROM products
      `),

      pool.query(`
        SELECT
          COUNT(*)::int AS total_orders,
          COUNT(*) FILTER (
            WHERE order_status = 'placed'
          )::int AS new_orders,
          COUNT(*) FILTER (
            WHERE order_status = 'delivered'
          )::int AS delivered_orders,
          COUNT(*) FILTER (
            WHERE order_status = 'cancelled'
          )::int AS cancelled_orders
        FROM orders
      `),

      pool.query(`
        SELECT COUNT(*)::int AS total_customers
        FROM users
        WHERE role = 'customer'
      `),

      pool.query(`
        SELECT COALESCE(
          SUM(total_amount) FILTER (
            WHERE payment_status = 'paid'
              AND order_status != 'cancelled'
          ),
          0
        )::numeric(12, 2) AS total_sales
        FROM orders
      `),

      pool.query(`
        SELECT
          id,
          order_number,
          customer_name,
          total_amount,
          payment_status,
          order_status,
          created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 10
      `),
    ])

    return res.json({
      success: true,
      data: {
        products: productsResult.rows[0],
        orders: ordersResult.rows[0],
        totalCustomers: customersResult.rows[0].total_customers,
        totalSales: salesResult.rows[0].total_sales,
        recentOrders: recentOrdersResult.rows,
      },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to load admin dashboard statistics.',
    })
  }
}
