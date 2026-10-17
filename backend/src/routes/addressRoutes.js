
import { Router } from 'express'

import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController.js'

import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect, authorize('customer'))

router.get('/', getMyAddresses)
router.post('/', createAddress)
router.put('/:id', updateAddress)
router.patch('/:id/default', setDefaultAddress)
router.delete('/:id', deleteAddress)

export default router
