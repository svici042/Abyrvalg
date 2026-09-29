import test from 'node:test'
import assert from 'node:assert/strict'
import { rememberProduct, validateRecent } from '../src/utils/recentProducts.js'
import { validSort } from '../src/utils/sorting.js'

test('recent products are unique, newest first, capped and validated', () => {
  let items = []
  for (let id = 1; id <= 8; id++)
    items = rememberProduct(items, {
      id,
      title: `Product ${id}`,
      price: id,
      thumbnail: '',
    })
  assert.equal(items.length, 6)
  const updated = rememberProduct(items, items[3])
  assert.equal(updated[0].id, 5)
  assert.equal(items[0].id, 8)
  assert.deepEqual(validateRecent(updated), updated)
  for (const invalid of [
    null,
    {},
    [null],
    [items[0], items[0]],
    [{ ...items[0], price: -1 }],
  ])
    assert.throws(() => validateRecent(invalid))
  assert.equal(validSort('price-asc'), 'price-asc')
  assert.equal(validSort('invalid'), 'default')
})
