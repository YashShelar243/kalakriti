
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testDatabaseConnection } from './config/database.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import addressRoutes from './routes/addressRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import couponRoutes from './routes/couponRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}))

app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KalaKriti API is running',
  })
})

app.get('/api/health', async (req, res) => {
  try {
    const database = await testDatabaseConnection()

    res.json({
      success: true,
      message: 'KalaKriti API and database are working',
      databaseTime: database.current_time,
    })
  } catch (error) {
    console.error('Database connection failed:', error.message)

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    })
  }
})

app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/admin/categories', categoryRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/coupons', couponRoutes)

app.listen(PORT, () => {
  console.log(`KalaKriti API running at http://localhost:${PORT}`)
})

