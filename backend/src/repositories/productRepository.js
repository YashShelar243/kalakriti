
import { pool } from '../config/database.js'

// Get all active products for the public website
export async function findAllProducts({
  category,
  search,
  featured,
  limit = 20,
  offset = 0,
} = {}) {
  const conditions = ['p.is_active = TRUE']
  const values = []

  if (category) {
    values.push(category)
    conditions.push(`c.slug = $${values.length}`)
  }

  if (search) {
    values.push(`%${search}%`)
    conditions.push(
      `(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`
    )
  }

  if (featured === true) {
    conditions.push('p.is_featured = TRUE')
  }

  values.push(limit)
  const limitParam = `$${values.length}`

  values.push(offset)
  const offsetParam = `$${values.length}`

  const query = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.stock_quantity,
      p.image_url,
      p.size,
      p.is_featured,
      p.category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `

  const result = await pool.query(query, values)
  return result.rows
}

// Get one active product by slug
export async function findProductBySlug(slug) {
  const query = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.stock_quantity,
      p.image_url,
      p.size,
      p.is_featured,
      p.category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug = $1 AND p.is_active = TRUE
    LIMIT 1
  `

  const result = await pool.query(query, [slug])
  return result.rows[0] || null
}

// Get all active categories for the public website
export async function findAllCategories() {
  const query = `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      COUNT(p.id)::INTEGER AS product_count
    FROM categories c
    LEFT JOIN products p
      ON p.category_id = c.id AND p.is_active = TRUE
    WHERE c.is_active = TRUE
    GROUP BY c.id
    ORDER BY c.name ASC
  `

  const result = await pool.query(query)
  return result.rows
}

// Get products for the admin panel, including inactive products
export async function findAdminProducts({
  search,
  categoryId,
  active,
  limit = 20,
  offset = 0,
} = {}) {
  const conditions = []
  const values = []

  if (search) {
    values.push(`%${search}%`)
    conditions.push(
      `(p.name ILIKE $${values.length}
        OR p.slug ILIKE $${values.length}
        OR p.description ILIKE $${values.length}
        OR p.size ILIKE $${values.length})`
    )
  }

  if (categoryId) {
    values.push(categoryId)
    conditions.push(`p.category_id = $${values.length}`)
  }

  if (active !== undefined) {
    values.push(active)
    conditions.push(`p.is_active = $${values.length}`)
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const countQuery = `
    SELECT COUNT(*)::INTEGER AS total
    FROM products p
    ${whereClause}
  `

  const countResult = await pool.query(countQuery, values)

  const pageValues = [...values, limit, offset]

  const query = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.stock_quantity,
      p.image_url,
      p.size,
      p.is_featured,
      p.is_active,
      p.category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      p.created_at,
      p.updated_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereClause}
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT $${pageValues.length - 1}
    OFFSET $${pageValues.length}
  `

  const result = await pool.query(query, pageValues)

  return {
    products: result.rows,
    total: countResult.rows[0].total,
  }
}

// Get all categories for admin forms, including inactive categories
export async function findAdminCategories() {
  const result = await pool.query(`
    SELECT id, name, slug, is_active
    FROM categories
    ORDER BY name ASC
  `)

  return result.rows
}

// Create a product
export async function createProduct(data) {
  const result = await pool.query(
    `
      INSERT INTO products (
        category_id,
        name,
        slug,
        description,
        price,
        stock_quantity,
        image_url,
        size,
        is_featured,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      data.category_id,
      data.name,
      data.slug,
      data.description,
      data.price,
      data.stock_quantity,
      data.image_url,
      data.size ?? null,
      data.is_featured,
      data.is_active,
    ]
  )

  return result.rows[0]
}

// Find a product by ID, including inactive products
export async function findProductById(id) {
  const result = await pool.query(
    `
      SELECT *
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )

  return result.rows[0] || null
}

// Update a product
export async function updateProduct(id, data) {
  const result = await pool.query(
    `
      UPDATE products
      SET
        category_id = $1,
        name = $2,
        slug = $3,
        description = $4,
        price = $5,
        stock_quantity = $6,
        image_url = $7,
        size = $8,
        is_featured = $9,
        is_active = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `,
    [
      data.category_id,
      data.name,
      data.slug,
      data.description,
      data.price,
      data.stock_quantity,
      data.image_url,
      data.size ?? null,
      data.is_featured,
      data.is_active,
      id,
    ]
  )

  return result.rows[0] || null
}

// Activate or deactivate a product
export async function setProductActive(id, isActive) {
  const result = await pool.query(
    `
      UPDATE products
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `,
    [isActive, id]
  )

  return result.rows[0] || null
}

// Check whether a product is referenced by an order
export async function isProductUsedInOrders(id) {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM order_items
        WHERE product_id = $1
      ) AS used
    `,
    [id]
  )

  return result.rows[0].used
}

// Permanently delete a product
export async function deleteProduct(id) {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 RETURNING id',
    [id]
  )

  return result.rows[0] || null
}

// Check whether a slug is already used by another product
export async function findProductBySlugForAdmin(slug, excludeId = null) {
  const result = await pool.query(
    `
      SELECT id
      FROM products
      WHERE slug = $1
        AND ($2::bigint IS NULL OR id <> $2)
      LIMIT 1
    `,
    [slug, excludeId]
  )

  return result.rows[0] || null
}
