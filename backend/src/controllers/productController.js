
import {
  getProducts,
  getProductBySlug,
  getCategories,
  getAdminProducts,
  getAdminCategories,
  createAdminProduct,
  updateAdminProduct,
  changeProductActiveStatus,
  removeAdminProduct,
} from '../services/productService.js'

// GET /api/products
export async function listProducts(req, res) {
  try {
    const products = await getProducts(req.query)

    return res.json({
      success: true,
      count: products.length,
      data: products,
    })
  } catch (error) {
    console.error('List products error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch products',
    })
  }
}

// GET /api/products/:slug
export async function getProduct(req, res) {
  try {
    const product = await getProductBySlug(req.params.slug)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    return res.json({ success: true, data: product })
  } catch (error) {
    console.error('Get product error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch product',
    })
  }
}

// GET /api/products/categories
export async function listCategories(req, res) {
  try {
    const categories = await getCategories()

    return res.json({
      success: true,
      count: categories.length,
      data: categories,
    })
  } catch (error) {
    console.error('List categories error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch categories',
    })
  }
}

// GET /api/products/admin
export async function listAdminProducts(req, res) {
  try {
    const result = await getAdminProducts(req.query)

    return res.json({
      success: true,
      data: result.products,
      pagination: {
        total: result.total,
        limit: Math.min(
          Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
          100
        ),
        offset: Math.max(
          Number.parseInt(req.query.offset, 10) || 0,
          0
        ),
      },
    })
  } catch (error) {
    console.error('Admin product list error:', error.message)

    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to fetch products',
    })
  }
}

// GET /api/products/admin/categories
export async function listAdminCategories(req, res) {
  try {
    const categories = await getAdminCategories()

    return res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Admin categories error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch categories',
    })
  }
}

// POST /api/products
export async function createProduct(req, res) {
  try {
    const product = await createAdminProduct(req.body)

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    })
  } catch (error) {
    console.error('Create product error:', error.message)

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A product with these details already exists',
      })
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to create product',
    })
  }
}

// PUT /api/products/admin/:id
export async function editProduct(req, res) {
  try {
    const id = Number(req.params.id)

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      })
    }

    const product = await updateAdminProduct(id, req.body)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    })
  } catch (error) {
    console.error('Update product error:', error.message)

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A product with these details already exists',
      })
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to update product',
    })
  }
}

// PATCH /api/products/admin/:id/active
export async function changeProductStatus(req, res) {
  try {
    const id = Number(req.params.id)

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      })
    }

    const { is_active: isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be true or false',
      })
    }

    const product = await changeProductActiveStatus(id, isActive)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    return res.json({
      success: true,
      message: isActive
        ? 'Product activated successfully'
        : 'Product deactivated successfully',
      data: product,
    })
  } catch (error) {
    console.error('Change product status error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to change product status',
    })
  }
}

// DELETE /api/products/admin/:id
export async function deleteAdminProduct(req, res) {
  try {
    const id = Number(req.params.id)

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      })
    }

    const result = await removeAdminProduct(id)

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: result.message,
      })
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Delete product error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to delete product',
    })
  }
}
