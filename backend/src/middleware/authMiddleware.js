
import jwt from 'jsonwebtoken'
import { pool } from '../config/database.js'

export async function protect(req, res, next) {
  try {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue.',
      })
    }

    const token = authorization.slice(7).trim()

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing.',
      })
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Authentication is not configured.',
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const result = await pool.query(
      `SELECT id, name, email, phone, role
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [decoded.sub]
    )

    if (!result.rows[0]) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please log in again.',
      })
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Your session is invalid or expired. Please log in again.',
      })
    }

    console.error('Authentication error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to verify your session.',
    })
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      })
    }

    next()
  }
}
