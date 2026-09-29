import test from 'node:test'
import assert from 'node:assert/strict'
import english from '../src/i18n/products.en.js'
import norwegian from '../src/i18n/products.nb.js'
import { productText } from '../src/i18n/productText.js'

test('all current products have both texts and language switching preserves snapshots', () => {
  assert.equal(Object.keys(english).length, 194)
  assert.deepEqual(Object.keys(norwegian), Object.keys(english))
  for (const [id, source] of Object.entries(english)) {
    const product = { id: Number(id), ...source }
    const snapshot = structuredClone(product)
    for (const field of ['title', 'description']) {
      assert.ok(norwegian[id][field].trim())
      assert.equal(
        productText(product, 'nb', field, { english, norwegian }),
        norwegian[id][field],
      )
      assert.equal(productText(product, 'en', field), source[field])
      assert.equal(
        productText({ productId: Number(id), ...source }, 'nb', field, {
          english,
          norwegian,
        }),
        norwegian[id][field],
      )
    }
    assert.deepEqual(product, snapshot)
  }
})

test('unknown products and changed API descriptions retain their original text', () => {
  assert.equal(
    productText({ id: 2, title: 'Different product' }, 'nb', 'title', {
      english,
      norwegian,
    }),
    'Different product',
  )
  assert.equal(
    productText({ id: 999, title: 'New product' }, 'nb', 'title', {
      english,
      norwegian,
    }),
    'New product',
  )
  assert.equal(
    productText(
      { id: 2, ...english[2], description: 'Updated description' },
      'nb',
      'description',
      { english, norwegian },
    ),
    'Updated description',
  )
})
