import { Router } from 'express'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} from '../controllers/categoryController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

// All category-management endpoints require an admin.
router.use(protect, authorize('admin'))

router.get('/', getAllCategories)
router.post('/', createCategory)
router.put('/:id', updateCategory)
router.patch('/:id/status', updateCategoryStatus)
router.delete('/:id', deleteCategory)

export default router