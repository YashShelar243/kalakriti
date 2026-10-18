
import { Router } from 'express'
import {
  getDashboardStats,
  getSalesReport,
} from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

router.get(
  '/dashboard',
  protect,
  authorize('admin'),
  getDashboardStats
)

router.get(
  '/sales-report',
  protect,
  authorize('admin'),
  getSalesReport
)

export default router
