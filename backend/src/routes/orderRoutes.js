
import { Router } from 'express'

import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
} from '../controllers/orderController.js'

import {
  protect,
  authorize,
} from '../middleware/authMiddleware.js'

const router = Router()

// Customer routes
router.get(
  '/my-orders',
  protect,
  authorize('customer'),
  getMyOrders
)

router.post(
  '/',
  protect,
  authorize('customer'),
  createOrder
)

// Admin routes
router.get(
  '/admin',
  protect,
  authorize('admin'),
  getAllOrders
)

router.get(
  '/admin/:id',
  protect,
  authorize('admin'),
  getOrderDetails
)

router.patch(
  '/admin/:id/status',
  protect,
  authorize('admin'),
  updateOrderStatus
)

export default router
