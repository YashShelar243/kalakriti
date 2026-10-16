
import { Router } from 'express'
import {
  listProducts,
  getProduct,
  listCategories,
  listAdminProducts,
  listAdminCategories,
  createProduct,
  editProduct,
  changeProductStatus,
  deleteAdminProduct,
} from '../controllers/productController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

// Public routes
// Keep these routes before /:slug.
router.get('/', listProducts)
router.get('/categories', listCategories)

// Admin routes: administrator access required
router.get(
  '/admin/categories',
  protect,
  authorize('admin'),
  listAdminCategories
)

router.get(
  '/admin',
  protect,
  authorize('admin'),
  listAdminProducts
)

router.post(
  '/',
  protect,
  authorize('admin'),
  createProduct
)

router.put(
  '/admin/:id',
  protect,
  authorize('admin'),
  editProduct
)

router.patch(
  '/admin/:id/active',
  protect,
  authorize('admin'),
  changeProductStatus
)

router.delete(
  '/admin/:id',
  protect,
  authorize('admin'),
  deleteAdminProduct
)

// Public product details route must remain last
router.get('/:slug', getProduct)

export default router
