import { SORT_OPTIONS, validSort } from './sorting.js'
export const ADMIN_KEY = 'abyrvalg-admin'
export const emptyConfig = () => ({ version: 1, products: {}, content: {} })
// Only these text fields support independent English and Norwegian overrides.
export const contentFields = [
  'storeName',
  'heroHeading',
  'heroText',
  'announcement',
  'footer',
  'contact',
]
// Accept empty images, local upload references and HTTP(S) URLs without credentials.
export function validImage(value) {
  if (typeof value !== 'string' || value.length > 2000) return false
  if (value === '' || /^image:[a-zA-Z0-9-]+$/.test(value)) return true
  try {
    const url = new URL(value)
    return (
      /^https?:\/\//.test(value) &&
      !!url.hostname &&
      !url.username &&
      !url.password
    )
  } catch {
    return false
  }
}
// Validate and copy only supported fields before persistence or import.
export function validateConfig(value) {
  if (
    !value ||
    value.version !== 1 ||
    !value.products ||
    typeof value.products !== 'object' ||
    typeof value.content !== 'object' ||
    Array.isArray(value.content) ||
    !value.content ||
    Array.isArray(value.products)
  )
    throw Error('Invalid demo configuration')
  const result = emptyConfig()
  if (typeof value.revision === 'string') result.revision = value.revision
  for (const [id, product] of Object.entries(value.products)) {
    if (
      !/^[1-9]\d*$/.test(id) ||
      !product ||
      !Number.isFinite(product.price) ||
      product.price < 0 ||
      product.price > 1000000 ||
      !Number.isSafeInteger(product.stock) ||
      product.stock < 0 ||
      product.stock > 1000000 ||
      typeof product.hidden !== 'boolean' ||
      !validImage(product.thumbnail) ||
      !Array.isArray(product.images) ||
      product.images.length > 30 ||
      !product.images.every(validImage)
    )
      throw Error('Invalid demo configuration')
    // Validate short metadata separately from translated product descriptions.
    for (const field of ['category', 'brand'])
      if (
        typeof product[field] !== 'string' ||
        product[field].length > 200 ||
        (field === 'category' && !product[field].trim())
      )
        throw Error('Invalid demo configuration')
    const text = {}
    // Both language entries are required so switching languages keeps the edit complete.
    for (const language of ['en', 'nb']) {
      const entry = product.text?.[language]
      if (
        !entry ||
        typeof entry.title !== 'string' ||
        !entry.title.trim() ||
        entry.title.length > 200 ||
        typeof entry.description !== 'string' ||
        entry.description.length > 10000
      )
        throw Error('Invalid demo configuration')
      text[language] = { title: entry.title, description: entry.description }
    }
    result.products[id] = {
      price: product.price,
      stock: product.stock,
      hidden: product.hidden,
      category: product.category,
      brand: product.brand,
      thumbnail: product.thumbnail,
      // Copy the gallery array to keep validated settings separate from the input.
      images: [...product.images],
      text,
    }
  }
  // Missing content overrides retain storefront defaults; supplied text needs both languages.
  for (const field of contentFields) {
    if (value.content[field] === undefined) continue
    const entry = value.content[field]
    if (
      !entry ||
      ['en', 'nb'].some(
        (language) =>
          typeof entry[language] !== 'string' ||
          !entry[language].trim() ||
          entry[language].length > 5000,
      )
    )
      throw Error('Invalid demo configuration')
    result.content[field] = { en: entry.en, nb: entry.nb }
  }
  if (value.content.logo !== undefined) {
    if (!validImage(value.content.logo))
      throw Error('Invalid demo configuration')
    result.content.logo = value.content.logo
  }
  return result
}
// Keep API fields that are not editable and use English as the base product text.
export function applyOverride(product, config) {
  const override = config.products[product.id]
  return override
    ? {
        ...product,
        ...override,
        title: override.text.en.title,
        description: override.text.en.description,
      }
    : product
}
// Apply local merchandise changes before any catalogue query operation.
export function selectProducts(
  products,
  config,
  {
    search = '',
    category = '',
    page = 1,
    sort = 'default',
    language = 'en',
    pageSize = 12,
  } = {},
) {
  const term = search.toLocaleLowerCase()
  let result = products
    .map((product) => applyOverride(product, config))
    .filter(
      (product) =>
        !product.hidden &&
        (!category || product.category === category) &&
        (!term ||
          `${product.text?.[language]?.title || product.title} ${product.text?.[language]?.description || product.description} ${product.brand || ''}`
            .toLocaleLowerCase()
            .includes(term)),
    )
  const sorting = SORT_OPTIONS[validSort(sort)]
  if (sorting.sortBy)
    result = result.toSorted(
      (a, b) =>
        (a[sorting.sortBy] - b[sorting.sortBy]) *
          (sorting.order === 'desc' ? -1 : 1) || a.id - b.id,
    )
  return {
    products: result.slice((page - 1) * pageSize, page * pageSize),
    total: result.length,
  }
}
// Reconcile current merchandise; historical order snapshots never pass through this function.
export function reconcileCart(items, products, config) {
  return items.flatMap((item) => {
    const source = products.find((product) => product.id === item.id)
    if (!source) return []
    const product = applyOverride(source, config)
    if (product.hidden || product.stock < 1) return []
    const next = {
      id: item.id,
      title: product.title,
      thumbnail: product.thumbnail || '',
      price: product.price,
      stock: product.stock,
      quantity: Math.min(item.quantity, product.stock),
    }
    return [
      Object.keys(next).every((key) => next[key] === item[key]) ? item : next,
    ]
  })
}
// Collect unique uploaded image IDs from the logo, thumbnails and gallery arrays.
export function imageReferences(config) {
  return [
    ...new Set(
      [
        config.content.logo,
        ...Object.values(config.products).flatMap((product) => [
          product.thumbnail,
          ...product.images,
        ]),
      ].filter((value) => value?.startsWith('image:')),
    ),
  ]
}

// HTTP references remain readable in legacy settings, but are blocked from rendering.
export function externalHosts(config) {
  return [
    ...new Set(
      [
        config.content.logo,
        ...Object.values(config.products).flatMap((product) => [
          product.thumbnail,
          ...product.images,
        ]),
      ]
        .filter((value) => /^https?:/.test(value || ''))
        .map((value) => new URL(value).host),
    ),
  ].sort()
}
export function hasHttpImages(config) {
  return [
    config.content.logo,
    ...Object.values(config.products).flatMap((product) => [
      product.thumbnail,
      ...product.images,
    ]),
  ].some((value) => value?.startsWith('http:'))
}
