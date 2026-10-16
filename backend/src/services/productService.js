
import {
  findAllProducts,
  findProductBySlug,
  findAllCategories,
  findAdminProducts,
  findAdminCategories,
  createProduct,
  findProductById,
  updateProduct,
  setProductActive,
  isProductUsedInOrders,
  deleteProduct,
  findProductBySlugForAdmin,
} from '../repositories/productRepository.js'

export async function getProducts(filters = {}) {
  const limit = Math.min(
    Math.max(Number.parseInt(filters.limit, 10) || 20, 1),
    100
  )

  const offset = Math.max(
    Number.parseInt(filters.offset, 10) || 0,
    0
  )

  const category = filters.category?.trim() || undefined
  const search = filters.search?.trim() || undefined
  const featured = filters.featured === 'true' ? true : undefined

  return findAllProducts({
    category,
    search,
    featured,
    limit,
    offset,
  })
}

export async function getProductBySlug(slug) {
  if (!slug?.trim()) {
    throw new Error('Product slug is required')
  }

  return findProductBySlug(slug.trim())
}

export async function getCategories() {
  return findAllCategories()
}

// Admin: list products with search, category and active-status filters
export async function getAdminProducts(filters = {}) {
  const limit = Math.min(
    Math.max(Number.parseInt(filters.limit, 10) || 20, 1),
    100
  )

  const offset = Math.max(
    Number.parseInt(filters.offset, 10) || 0,
    0
  )

  const search = filters.search?.trim() || undefined

  let categoryId
  if (filters.categoryId !== undefined && filters.categoryId !== '') {
    categoryId = Number(filters.categoryId)

    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      throw new Error('Invalid category ID')
    }
  }

  let active
  if (filters.active === 'true') {
    active = true
  } else if (filters.active === 'false') {
    active = false
  }

  return findAdminProducts({
    search,
    categoryId,
    active,
    limit,
    offset,
  })
}

export async function getAdminCategories() {
  return findAdminCategories()
}

function makeSlug(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function validateProductInput(input, existingProduct = null) {
  const name = typeof input.name === 'string' ? input.name.trim() : ''

  if (!name || name.length > 200) {
    throw new Error('Product name is required and must be under 200 characters')
  }

  const price = Number(input.price)
  if (
    input.price === '' ||
    input.price === null ||
    input.price === undefined ||
    !Number.isFinite(price) ||
    price < 0 ||
    !/^\d+(\.\d{1,2})?$/.test(String(input.price).trim())
  ) {
    throw new Error('Enter a valid price with up to 2 decimal places')
  }

  const stock = Number(input.stock_quantity)
  if (
    input.stock_quantity === '' ||
    input.stock_quantity === null ||
    input.stock_quantity === undefined ||
    !Number.isSafeInteger(stock) ||
    stock < 0
  ) {
    throw new Error('Stock quantity must be a non-negative whole number')
  }

  let categoryId = null

  if (input.category_id !== '' && input.category_id !== null &&
      input.category_id !== undefined) {
    categoryId = Number(input.category_id)

    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      throw new Error('Please select a valid category')
    }

    const categories = await findAdminCategories()
    const category = categories.find(
      (item) => Number(item.id) === categoryId
    )

    if (!category || !category.is_active) {
      throw new Error('Selected category is unavailable')
    }
  }

  const description =
    typeof input.description === 'string' ? input.description.trim() : ''

  if (description.length > 10000) {
    throw new Error('Description must be under 10000 characters')
  }

  const imageUrl =
    typeof input.image_url === 'string' ? input.image_url.trim() : ''

  if (imageUrl.length > 2048) {
    throw new Error('Image URL is too long')
  }

  if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) {
    throw new Error('Image URL must start with http:// or https://')
  }

  const isFeatured =
    input.is_featured === true || input.is_featured === 'true'

  const isActive = input.is_active === undefined
    ? (existingProduct?.is_active ?? true)
    : input.is_active === true || input.is_active === 'true'

  const baseSlug = makeSlug(name)

  if (!baseSlug) {
    throw new Error('Product name must contain letters or numbers')
  }

  // Generate a unique slug automatically from the product name
  let slug = baseSlug
  let suffix = 2

  while (await findProductBySlugForAdmin(slug, existingProduct?.id ?? null)) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return {
    category_id: categoryId,
    name,
    slug,
    description,
    price,
    stock_quantity: stock,
    image_url: imageUrl || null,
    is_featured: isFeatured,
    is_active: isActive,
  }
}

export async function createAdminProduct(input) {
  const data = await validateProductInput(input)
  return createProduct(data)
}

export async function updateAdminProduct(id, input) {
  const existingProduct = await findProductById(id)

  if (!existingProduct) {
    return null
  }

  const data = await validateProductInput(input, existingProduct)
  return updateProduct(id, data)
}

export async function changeProductActiveStatus(id, isActive) {
  if (typeof isActive !== 'boolean') {
    throw new Error('is_active must be true or false')
  }

  return setProductActive(id, isActive)
}

export async function removeAdminProduct(id) {
  const existingProduct = await findProductById(id)

  if (!existingProduct) {
    return { notFound: true }
  }

  const usedInOrders = await isProductUsedInOrders(id)

  if (usedInOrders) {
    return {
      conflict: true,
      message: 'This product is linked to an order. Deactivate it instead.',
    }
  }

  await deleteProduct(id)

  return { deleted: true }
}
