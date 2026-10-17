
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

import {
  getProductReviews,
  createProductReview,
  updateMyProductReview,
  deleteMyProductReview,
} from '../controllers/reviewController.js'

import {
  protect,
  authorize,
} from '../middleware/authMiddleware.js'

const router = Router()

// Public routes
router.get('/', listProducts)
router.get('/categories', listCategories)

// Public product reviews
router.get('/:productId/reviews', getProductReviews)

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

// Customer review management
router.post(
  '/:productId/reviews',
  protect,
  authorize('customer'),
  createProductReview
)

router.put(
  '/:productId/reviews/mine',
  protect,
  authorize('customer'),
  updateMyProductReview
)

router.delete(
  '/:productId/reviews/mine',
  protect,
  authorize('customer'),
  deleteMyProductReview
)

// Public product details route must remain last
router.get('/:slug', getProduct)

export default router
