
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/database.js'

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.')
  }

  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  )
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  }
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body ?? {}

    if (
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      name.trim().length > 120
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 120 characters.',
      })
    }

    if (
      typeof email !== 'string' ||
      email.length > 255 ||
      !validEmail(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address.',
      })
    }

    if (
      phone !== undefined &&
      phone !== null &&
      (typeof phone !== 'string' || phone.trim().length > 20)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid phone number.',
      })
    }

    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain 8 to 72 characters.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [normalizedEmail]
    )

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role`,
      [
        name.trim(),
        normalizedEmail,
        phone?.trim() || null,
        passwordHash,
      ]
    )

    const user = result.rows[0]
    const token = createToken(user)

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: publicUser(user),
        token,
      },
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    console.error('Registration error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to create your account.',
    })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {}

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      })
    }

    const result = await pool.query(
      `SELECT id, name, email, phone, role, password_hash
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email.trim().toLowerCase()]
    )

    const user = result.rows[0]

    if (
      !user ||
      typeof user.password_hash !== 'string' ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const token = createToken(user)

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: publicUser(user),
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to log in right now.',
    })
  }
}

export async function getMe(req, res) {
  try {
    return res.json({
      success: true,
      data: { user: publicUser(req.user) },
    })
  } catch (error) {
    console.error('Get profile error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve your profile.',
    })
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body ?? {}

    if (
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      name.trim().length > 120
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 120 characters.',
      })
    }

    if (
      phone !== undefined &&
      phone !== null &&
      (typeof phone !== 'string' || phone.trim().length > 20)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must not exceed 20 characters.',
      })
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           phone = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, email, phone, role`,
      [
        name.trim(),
        typeof phone === 'string' && phone.trim()
          ? phone.trim()
          : null,
        req.user.id,
      ]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      })
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: publicUser(result.rows[0]),
      },
    })
  } catch (error) {
    console.error('Update profile error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to update your profile.',
    })
  }
}
