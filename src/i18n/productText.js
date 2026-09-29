// Translate presentation only; preserve stored cart and order data.
export function productText(product, language, field = 'title', dictionaries) {
  const original = product[field] || ''
  if (language !== 'nb' || !dictionaries) return original
  const id = product.id ?? product.productId
  const source = dictionaries.english[id]
  // Changed source text must never receive an outdated translation.
  if (!source || source.title !== product.title) return original
  if (field === 'description' && source.description !== original)
    return original
  return dictionaries.norwegian[id]?.[field] || original
}
