
import { pool } from '../config/database.js'

const allowedAddressTypes = ['Home', 'Work', 'Other']

function validateAddress(body) {
  const requiredFields = [
    'full_name',
    'phone',
    'address_line1',
    'city',
    'state',
    'postal_code',
  ]

  for (const field of requiredFields) {
    if (!String(body[field] ?? '').trim()) {
      return `${field.replaceAll('_', ' ')} is required.`
    }
  }

  const limits = {
    full_name: 120,
    phone: 20,
    address_line1: 255,
    address_line2: 255,
    city: 100,
    state: 100,
    postal_code: 10,
    country: 100,
  }

  for (const [field, max] of Object.entries(limits)) {
    if (String(body[field] ?? '').trim().length > max) {
      return `${field.replaceAll('_', ' ')} must be ${max} characters or fewer.`
    }
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(String(body.phone).trim())) {
    return 'Enter a valid phone number.'
  }

  if (!/^[A-Za-z0-9\s-]{4,10}$/.test(String(body.postal_code).trim())) {
    return 'Enter a valid postal code.'
  }

  const type = body.address_type || 'Home'

  if (!allowedAddressTypes.includes(type)) {
    return 'Address type must be Home, Work, or Other.'
  }

  return null
}

function addressValues(body) {
  return [
    String(body.full_name).trim(),
    String(body.phone).trim(),
    String(body.address_line1).trim(),
    String(body.address_line2 || '').trim() || null,
    String(body.city).trim(),
    String(body.state).trim(),
    String(body.postal_code).trim(),
    String(body.country || 'India').trim(),
    body.address_type || 'Home',
  ]
}

export async function getMyAddresses(req, res) {
  try {
    const result = await pool.query(
      `SELECT *
       FROM user_addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    )

    return res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Get addresses error:', error)
    return res.status(500).json({
      success: false,
      message: 'Could not load saved addresses.',
    })
  }
}

export async function createAddress(req, res) {
  const validationError = validateAddress(req.body)

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existing = await client.query(
      'SELECT id FROM user_addresses WHERE user_id = $1',
      [req.user.id]
    )

    const makeDefault =
      req.body.is_default === true ||
      req.body.is_default === 'true' ||
      existing.rows.length === 0

    if (makeDefault) {
      await client.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.id]
      )
    }

    const result = await client.query(
      `INSERT INTO user_addresses (
        user_id, full_name, phone, address_line1, address_line2,
        city, state, postal_code, country, address_type, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        req.user.id,
        ...addressValues(req.body),
        makeDefault,
      ]
    )

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      data: result.rows[0],
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create address error:', error)

    return res.status(500).json({
      success: false,
      message: 'Could not save the address.',
    })
  } finally {
    client.release()
  }
}

export async function updateAddress(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid address ID.',
    })
  }

  const validationError = validateAddress(req.body)

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const current = await client.query(
      `SELECT * FROM user_addresses
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [id, req.user.id]
    )

    if (!current.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      })
    }

    const shouldDefault =
      req.body.is_default === true ||
      req.body.is_default === 'true' ||
      current.rows[0].is_default

    if (shouldDefault) {
      await client.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.id]
      )
    }

    const result = await client.query(
      `UPDATE user_addresses
       SET full_name = $1,
           phone = $2,
           address_line1 = $3,
           address_line2 = $4,
           city = $5,
           state = $6,
           postal_code = $7,
           country = $8,
           address_type = $9,
           is_default = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [
        ...addressValues(req.body),
        shouldDefault,
        id,
        req.user.id,
      ]
    )

    await client.query('COMMIT')

    return res.json({
      success: true,
      message: 'Address updated successfully.',
      data: result.rows[0],
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Update address error:', error)

    return res.status(500).json({
      success: false,
      message: 'Could not update the address.',
    })
  } finally {
    client.release()
  }
}

export async function setDefaultAddress(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid address ID.',
    })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const address = await client.query(
      `SELECT id FROM user_addresses
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [id, req.user.id]
    )

    if (!address.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      })
    }

    await client.query(
      'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
      [req.user.id]
    )

    const result = await client.query(
      `UPDATE user_addresses
       SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    )

    await client.query('COMMIT')

    return res.json({
      success: true,
      message: 'Default address updated.',
      data: result.rows[0],
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Set default address error:', error)

    return res.status(500).json({
      success: false,
      message: 'Could not set the default address.',
    })
  } finally {
    client.release()
  }
}

export async function deleteAddress(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid address ID.',
    })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const address = await client.query(
      `SELECT id, is_default FROM user_addresses
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [id, req.user.id]
    )

    if (!address.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      })
    }

    await client.query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )

    if (address.rows[0].is_default) {
      const next = await client.query(
        `SELECT id FROM user_addresses
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [req.user.id]
      )

      if (next.rows.length) {
        await client.query(
          `UPDATE user_addresses
           SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND user_id = $2`,
          [next.rows[0].id, req.user.id]
        )
      }
    }

    await client.query('COMMIT')

    return res.json({
      success: true,
      message: 'Address deleted successfully.',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Delete address error:', error)

    return res.status(500).json({
      success: false,
      message: 'Could not delete the address.',
    })
  } finally {
    client.release()
  }
}
