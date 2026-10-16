
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { pool } from './config/database.js'

dotenv.config()

async function createAdmin() {
  try {
    const name = process.env.ADMIN_NAME
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.ADMIN_PASSWORD

    if (!name || !email || !password) {
      throw new Error(
        'Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.'
      )
    }

    if (password.length < 12) {
      throw new Error('Admin password must be at least 12 characters long.')
    }

    const existing = await pool.query(
      'SELECT id, role FROM users WHERE email = $1',
      [email]
    )

    const passwordHash = await bcrypt.hash(password, 12)

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE users
         SET name = $1,
             password_hash = $2,
             role = 'admin',
             updated_at = CURRENT_TIMESTAMP
         WHERE email = $3`,
        [name, passwordHash, email]
      )

      console.log('Existing account updated with admin access.')
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')`,
        [name, email, passwordHash]
      )

      console.log('Admin account created successfully.')
    }
  } catch (error) {
    console.error('Admin setup failed:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

createAdmin()
