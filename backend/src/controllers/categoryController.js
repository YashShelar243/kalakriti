import { pool } from '../config/database.js'

function createSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getAllCategories(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.is_active,
        c.created_at,
        COUNT(p.id)::int AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.name ASC
    `)

    return res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Get categories error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to load categories.',
    })
  }
}

export async function createCategory(req, res) {
  try {
    const name = String(req.body.name || '').trim()
    const description = String(req.body.description || '').trim()
    const slug = createSlug(name)

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      })
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Category name must be 100 characters or fewer.',
      })
    }

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid category name.',
      })
    }

    const existing = await pool.query(
      `SELECT id FROM categories
       WHERE LOWER(name) = LOWER($1) OR slug = $2
       LIMIT 1`,
      [name, slug]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
      })
    }

    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, name, slug, description, is_active, created_at`,
      [name, slug, description || null]
    )

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Create category error:', error.message)

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A category with this name or slug already exists.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to create category.',
    })
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params
    const name = String(req.body.name || '').trim()
    const description = String(req.body.description || '').trim()
    const slug = createSlug(name)

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      })
    }

    if (name.length > 100 || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid category name of at most 100 characters.',
      })
    }

    const existing = await pool.query(
      `SELECT id FROM categories
       WHERE (LOWER(name) = LOWER($1) OR slug = $2)
       AND id <> $3
       LIMIT 1`,
      [name, slug, id]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Another category already uses this name.',
      })
    }

    const result = await pool.query(
      `UPDATE categories
       SET name = $1,
           slug = $2,
           description = $3
       WHERE id = $4
       RETURNING id, name, slug, description, is_active, created_at`,
      [name, slug, description || null, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      })
    }

    return res.json({
      success: true,
      message: 'Category updated successfully.',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Update category error:', error.message)

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A category with this name or slug already exists.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to update category.',
    })
  }
}

export async function updateCategoryStatus(req, res) {
  try {
    const { id } = req.params
    const { is_active } = req.body

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be true or false.',
      })
    }

    const result = await pool.query(
      `UPDATE categories
       SET is_active = $1
       WHERE id = $2
       RETURNING id, name, slug, description, is_active, created_at`,
      [is_active, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      })
    }

    return res.json({
      success: true,
      message: is_active
        ? 'Category activated successfully.'
        : 'Category deactivated successfully.',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Update category status error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to update category status.',
    })
  }
}

export async function deleteCategory(req, res) {
  const client = await pool.connect()

  try {
    const { id } = req.params

    await client.query('BEGIN')

    const categoryResult = await client.query(
      `SELECT id, name
       FROM categories
       WHERE id = $1
       FOR UPDATE`,
      [id]
    )

    if (categoryResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      })
    }

    const productResult = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM products
       WHERE category_id = $1`,
      [id]
    )

    if (productResult.rows[0].count > 0) {
      await client.query('ROLLBACK')

      return res.status(409).json({
        success: false,
        message:
          'This category contains products. Move those products to another category or deactivate this category before deleting it.',
      })
    }

    await client.query(
      'DELETE FROM categories WHERE id = $1',
      [id]
    )

    await client.query('COMMIT')

    return res.json({
      success: true,
      message: 'Category deleted successfully.',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Delete category error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to delete category.',
    })
  } finally {
    client.release()
  }
}