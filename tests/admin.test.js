import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyOverride,
  emptyConfig,
  imageReferences,
  reconcileCart,
  selectProducts,
  validateConfig,
} from '../src/utils/admin.js'
import { validateImage } from '../src/utils/adminImages.js'
const catalogue = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  title: `Original ${index + 1}`,
  description: 'Original description',
  category: 'beauty',
  brand: 'Demo',
  price: 20 + index,
  stock: 5,
  thumbnail: '',
  images: [],
}))
const override = {
  text: {
    en: { title: 'Edited title', description: 'Edited description' },
    nb: { title: 'Endret navn', description: 'Endret beskrivelse' },
  },
  price: 1,
  category: 'new-category',
  brand: 'Changed',
  stock: 2,
  hidden: false,
  thumbnail: 'image:test',
  images: ['image:test', 'https://example.com/image.png'],
}
test('schema round trip persists canonical edits and restoring preserves originals', () => {
  const config = validateConfig(
    JSON.parse(
      JSON.stringify({ ...emptyConfig(), products: { 25: override } }),
    ),
  )
  assert.equal(applyOverride(catalogue[24], config).price, 1)
  assert.equal(
    applyOverride(catalogue[24], config).text.nb.title,
    'Endret navn',
  )
  delete config.products[25]
  assert.deepEqual(applyOverride(catalogue[24], config), catalogue[24])
  assert.equal(catalogue[24].price, 44)
})
test('overrides precede filtering, sorting and pagination across entire catalogue', () => {
  const config = {
    ...emptyConfig(),
    products: { 25: override, 1: { ...override, hidden: true } },
  }
  assert.equal(
    selectProducts(catalogue, config, { sort: 'price-asc' }).products[0].id,
    25,
  )
  assert.deepEqual(
    selectProducts(catalogue, config, {
      category: 'new-category',
    }).products.map((product) => product.id),
    [25],
  )
  assert.deepEqual(
    selectProducts(catalogue, config, {
      search: 'Endret',
      language: 'nb',
    }).products.map((product) => product.id),
    [25],
  )
  assert.equal(selectProducts(catalogue, config, { page: 2 }).total, 24)
  assert.equal(
    selectProducts(catalogue, config, { page: 2 }).products.length,
    12,
  )
})
test('cart uses current prices, caps stock and removes hidden products without changing snapshots', () => {
  const items = catalogue
    .slice(0, 2)
    .map((product) => ({ ...product, quantity: 4 }))
  const snapshot = structuredClone(items)
  const config = {
    ...emptyConfig(),
    products: { 1: override, 2: { ...override, hidden: true } },
  }
  const result = reconcileCart(items, catalogue, config)
  assert.equal(result.length, 1)
  assert.equal(result[0].price, 1)
  assert.equal(result[0].quantity, 2)
  assert.deepEqual(items, snapshot)
  assert.equal(
    reconcileCart(items, catalogue, {
      ...config,
      products: { 1: { ...override, stock: 0 }, 2: { ...override, stock: 0 } },
    }).length,
    0,
  )
})
test('configuration rejects malformed prices, stocks, texts, unsafe image URLs and invalid versions', () => {
  for (const patch of [
    { price: -1 },
    { stock: 1.5 },
    { thumbnail: 'javascript:alert(1)' },
    { images: ['data:image/svg+xml,<svg/>'] },
    { text: { en: { title: '', description: '' } } },
  ]) {
    assert.throws(() =>
      validateConfig({
        ...emptyConfig(),
        products: { 1: { ...override, ...patch } },
      }),
    )
  }
  assert.throws(() => validateConfig({ version: 2, products: {}, content: {} }))
  assert.throws(() =>
    validateConfig({
      ...emptyConfig(),
      content: { heroHeading: { en: 'Only one language' } },
    }),
  )
  assert.deepEqual(
    imageReferences({
      ...emptyConfig(),
      products: { 1: override },
      content: { logo: 'image:test' },
    }),
    ['image:test'],
  )
})
test('uploads reject executable formats and excessive or empty image files', () => {
  validateImage({ type: 'image/png', size: 100 })
  for (const file of [
    { type: 'image/svg+xml', size: 100 },
    { type: 'image/png', size: 6 * 1024 * 1024 },
    { type: 'image/png', size: 0 },
  ])
    assert.throws(() => validateImage(file))
})

test('localized checkout text is frozen in order snapshots', async () => {
  const { calculateQuote } = await import('../src/utils/money.js')
  const { createOrder, validateOrders } = await import('../src/utils/orders.js')
  const quote = calculateQuote(
    [{ ...catalogue[0], text: override.text, quantity: 1 }],
    'USD',
  )
  const order = createOrder(
    {
      name: 'Demo Person',
      email: 'demo@example.com',
      address: 'Example Street 1',
    },
    quote,
  )
  quote.lines[0].text.nb.title = 'Later edit'
  assert.equal(order.lines[0].text.nb.title, 'Endret navn')
  assert.equal(
    validateOrders([order])[0].lines[0].text.en.title,
    'Edited title',
  )
})
