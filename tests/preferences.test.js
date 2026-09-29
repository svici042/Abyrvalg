import test from 'node:test'
import assert from 'node:assert/strict'
import { addItem } from '../src/context/cartState.js'
import { validateCurrency } from '../src/utils/storage.js'

test('selected additions merge atomically, respect stock and reject invalid quantities', () => {
  const product = { id: 1, title: 'Demo', price: 9.99, stock: 5 }
  const original = []
  const first = addItem(original, product, 3)
  assert.equal(first[0].quantity, 3)
  assert.deepEqual(original, [])
  const next = addItem(first, product, 4)
  assert.equal(next.length, 1)
  assert.equal(next[0].quantity, 5)
  assert.equal(first[0].quantity, 3)
  for (const invalid of [0, -1, 1.5, NaN, Infinity])
    assert.equal(addItem(first, product, invalid), first)
})

test('currency preferences reject invalid stored choices', () => {
  for (const currency of ['NOK', 'USD'])
    assert.equal(validateCurrency(currency), currency)
  for (const invalid of ['nb', 'en', 'EUR', null])
    assert.throws(() => validateCurrency(invalid))
})
