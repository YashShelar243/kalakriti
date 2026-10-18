
import { Router } from 'express'

import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
} from '../controllers/couponController.js'

import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

// Customers must be logged in to validate a promo code.
router.post('/validate', protect, authorize('customer'), validateCoupon)

// All coupon management endpoints are admin-only.
router.use(protect, authorize('admin'))

router.get('/', getCoupons)
router.post('/', createCoupon)
router.put('/:id', updateCoupon)
router.patch('/:id/status', updateCouponStatus)
router.delete('/:id', deleteCoupon)

export default router
