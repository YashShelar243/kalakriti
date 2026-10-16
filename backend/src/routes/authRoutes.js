
import { Router } from 'express'
import {
  register,
  login,
  getMe,
  updateProfile,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

// Public authentication routes
router.post('/register', register)
router.post('/login', login)

// Authenticated user's profile
router.get('/me', protect, getMe)

// Update the authenticated user's profile
router.put('/me', protect, updateProfile)

export default router
