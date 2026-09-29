export function validateRecent(value) {
  if (!Array.isArray(value)) throw new Error('Invalid recent products')
  // Restore at most six entries and reject duplicate or malformed product snapshots.
  const ids = new Set()
  return value.slice(0, 6).map((item) => {
    if (
      !item ||
      !Number.isSafeInteger(item.id) ||
      item.id < 1 ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      typeof item.thumbnail !== 'string' ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      ids.has(item.id)
    ) {
      throw new Error('Invalid recent product')
    }
    ids.add(item.id)
    const { id, title, thumbnail, price } = item
    return { id, title, thumbnail, price }
  })
}

export function rememberProduct(items, product) {
  const { id, title, price } = product
  // Keep unique products newest first, with prices in USD as in the cart.
  return [
    { id, title, price, thumbnail: product.thumbnail || '' },
    ...items.filter((item) => item.id !== id),
  ].slice(0, 6)
}
