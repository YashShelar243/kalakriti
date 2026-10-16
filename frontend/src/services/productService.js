
import api from './api'

export async function fetchProducts(params = {}) {
  const response = await api.get('/products', { params })
  return response.data.data
}

export async function fetchProductBySlug(slug) {
  const response = await api.get(`/products/${encodeURIComponent(slug)}`)
  return response.data.data
}

export async function fetchCategories() {
  const response = await api.get('/products/categories')
  return response.data.data
}
