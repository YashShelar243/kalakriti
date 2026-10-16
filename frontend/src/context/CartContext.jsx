
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('kalakriti-cart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('kalakriti-cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product, quantity = 1) => {
    const productId = product.id
    const availableStock = Number(product.stock_quantity ?? product.stock ?? 0)
    const requestedQuantity = Math.max(1, Number(quantity) || 1)

    if (availableStock < 1) {
      return { success: false, message: 'This product is out of stock.' }
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => String(item.id) === String(productId)
      )

      if (existingItem) {
        return currentItems.map((item) =>
          String(item.id) === String(productId)
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + requestedQuantity,
                  Number(item.stock_quantity ?? item.stock ?? availableStock)
                ),
              }
            : item
        )
      }

      return [
        ...currentItems,
        { ...product, quantity: Math.min(requestedQuantity, availableStock) },
      ]
    })

    return { success: true, message: 'Added to your bag!' }
  }

  const updateQuantity = (productId, quantity) => {
    const nextQuantity = Number(quantity)

    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) return

    setCartItems((items) =>
      items.map((item) =>
        String(item.id) === String(productId)
          ? {
              ...item,
              quantity: Math.min(
                Math.floor(nextQuantity),
                Number(item.stock_quantity ?? item.stock ?? 1)
              ),
            }
          : item
      )
    )
  }

  const removeFromCart = (productId) => {
    setCartItems((items) =>
      items.filter((item) => String(item.id) !== String(productId))
    )
  }

  const clearCart = () => setCartItems([])

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const subtotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  )

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [cartItems, cartCount, subtotal]
  )

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
