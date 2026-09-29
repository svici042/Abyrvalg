export const CART_KEY = 'abyrvalg-cart'

export function validateCart(value) {
  // Reject the stored cart if any fields are invalid or product IDs are duplicated.
  if (!Array.isArray(value)) throw new Error('Invalid cart')
  const ids = new Set()
  return value.map((item) => {
    if (
      !item ||
      !Number.isSafeInteger(item.id) ||
      item.id < 1 ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      typeof item.thumbnail !== 'string' ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      !Number.isSafeInteger(item.stock) ||
      item.stock < 1 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > item.stock ||
      ids.has(item.id)
    ) {
      throw new Error('Invalid cart item')
    }
    ids.add(item.id)
    const { id, title, thumbnail, price, stock, quantity } = item
    return { id, title, thumbnail, price, stock, quantity }
  })
}

// Preserve USD base prices and limit repeated additions to available stock.
export function addItem(items, product, quantity = 1) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return items
  if (!Number.isSafeInteger(product.stock) || product.stock < 1) return items
  const existing = items.find((item) => item.id === product.id)
  if (existing) {
    return items.map((item) =>
      item.id === product.id
        ? {
            ...item,
            stock: product.stock,
            quantity: Math.min(item.quantity + quantity, product.stock),
          }
        : item,
    )
  }
  const { id, title, price, stock } = product
  // Append a new line without mutating the existing cart array.
  return [
    ...items,
    {
      id,
      title,
      price,
      stock,
      thumbnail: product.thumbnail || '',
      quantity: Math.min(quantity, stock),
    },
  ]
}

export function changeQuantity(items, id, quantity) {
  // Preserve other cart lines and accept only positive integer quantities.
  if (!Number.isSafeInteger(quantity) || quantity < 1) return items
  return items.map((item) =>
    item.id === id
      ? { ...item, quantity: Math.min(quantity, item.stock) }
      : item,
  )
}

// Accumulate quantities and USD cents in one pass, including an empty-cart default.
export function cartTotals(items) {
  return items.reduce(
    (totals, item) => ({
      quantity: totals.quantity + item.quantity,
      cents: totals.cents + Math.round(item.price * 100) * item.quantity,
    }),
    { quantity: 0, cents: 0 },
  )
}
