
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

// Admin sales report with date filters and best-selling products
export async function getSalesReport(req, res) {
  try {
    const { startDate, endDate } = req.query

    const isValidDate = (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value

    if (
      (startDate && !isValidDate(startDate)) ||
      (endDate && !isValidDate(endDate))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Dates must use YYYY-MM-DD format.',
      })
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date.',
      })
    }

    const values = []
    const conditions = ["o.order_status != 'cancelled'"]

    if (startDate) {
      values.push(startDate)
      conditions.push(`o.created_at >= $${values.length}::date`)
    }

    if (endDate) {
      values.push(endDate)
      conditions.push(
        `o.created_at < ($${values.length}::date + INTERVAL '1 day')`
      )
    }

    const whereClause = conditions.join(' AND ')

    const [summaryResult, dailyResult, productsResult] = await Promise.all([
      // Overall sales and discounts
      pool.query(
        `
          SELECT
            COUNT(*)::int AS total_orders,
            COUNT(*) FILTER (
              WHERE o.order_status = 'delivered'
            )::int AS delivered_orders,
            COUNT(*) FILTER (
              WHERE o.payment_status = 'paid'
            )::int AS paid_orders,
            COALESCE(SUM(o.total_amount), 0)::numeric(12, 2)
              AS order_value,
            COALESCE(
              SUM(o.total_amount) FILTER (
                WHERE o.payment_status = 'paid'
              ),
              0
            )::numeric(12, 2) AS paid_sales,
            COALESCE(SUM(o.discount_amount), 0)::numeric(12, 2)
              AS total_discounts
          FROM orders o
          WHERE ${whereClause}
        `,
        values
      ),

      // Daily sales chart
      pool.query(
        `
          SELECT
            DATE(o.created_at)::text AS date,
            COUNT(*)::int AS orders,
            COALESCE(SUM(o.total_amount), 0)::numeric(12, 2)
              AS sales
          FROM orders o
          WHERE ${whereClause}
          GROUP BY DATE(o.created_at)
          ORDER BY DATE(o.created_at)
        `,
        values
      ),

      // Best-selling products
      pool.query(
        `
          SELECT
            oi.product_id,
            oi.product_name,
            COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
            COALESCE(SUM(oi.line_total), 0)::numeric(12, 2)
              AS product_sales
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE ${whereClause}
          GROUP BY oi.product_id, oi.product_name
          ORDER BY units_sold DESC, product_sales DESC
          LIMIT 10
        `,
        values
      ),
    ])

    return res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        dailySales: dailyResult.rows,
        bestSellingProducts: productsResult.rows,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    })
  } catch (error) {
    console.error('Admin sales report error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to load the sales report.',
    })
  }
}
