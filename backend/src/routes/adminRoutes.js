
import { Router } from 'express'
import { getDashboardStats } from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

router.get(
  '/dashboard',
  protect,
  authorize('admin'),
  getDashboardStats
)

export default router
