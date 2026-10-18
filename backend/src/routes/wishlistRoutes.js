
import { Router } from 'express'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

// All wishlist endpoints require a logged-in customer
router.use(protect, authorize('customer'))

router.get('/', getWishlist)
router.post('/:productId', addToWishlist)
router.delete('/:productId', removeFromWishlist)

export default router
