
import { Router } from 'express'
import ImageKit from '@imagekit/nodejs'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/auth', protect, authorize('admin'), (req, res) => {
  try {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY

    if (!publicKey || !privateKey) {
      return res.status(500).json({
        success: false,
        message: 'ImageKit credentials are not configured.',
      })
    }

    const imagekit = new ImageKit({ privateKey })
    const authParams = imagekit.helper.getAuthenticationParameters()

    return res.json({
      success: true,
      data: {
        ...authParams,
        publicKey,
      },
    })
  } catch (error) {
    console.error('ImageKit authentication error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to prepare image upload.',
    })
  }
})

export default router
