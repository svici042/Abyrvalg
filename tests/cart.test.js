import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addItem,
  cartTotals,
  changeQuantity,
  validateCart,
} from '../src/context/cartState.js'
import { readStoredValue, validateTheme } from '../src/utils/storage.js'
import { parsePage } from '../src/utils/format.js'

const product = { id: 1, title: 'Test', thumbnail: '', price: 0.1, stock: 3 }

test('repeated additions merge immutably and stop at stock', () => {
  const first = addItem([], product)
  const second = addItem(first, product)
  assert.equal(first[0].quantity, 1)
  assert.equal(second.length, 1)
  assert.equal(second[0].quantity, 2)
  assert.equal(addItem(addItem(second, product), product)[0].quantity, 3)
  assert.deepEqual(addItem([], { ...product, stock: 0 }), [])
})

test('quantities require positive integers and totals use cents', () => {
  const items = addItem([], product)
  for (const invalid of [0, -1, 1.5, NaN, Infinity]) {
    assert.equal(changeQuantity(items, 1, invalid), items)
  }
  const updated = changeQuantity(items, 1, 100)
  assert.equal(updated[0].quantity, 3)
  assert.deepEqual(cartTotals(updated), { quantity: 3, cents: 30 })
})

test('restoration rejects invalid shapes, duplicate IDs and excess quantities', () => {
  const item = { ...product, quantity: 1 }
  assert.deepEqual(validateCart([item]), [item])
  for (const invalid of [
    null,
    {},
    [null],
    [item, item],
    [{ ...item, quantity: 4 }],
    [{ ...item, price: -1 }],
  ]) {
    assert.throws(() => validateCart(invalid))
  }
})

test('storage recovers from broken JSON and inaccessible storage', () => {
  const broken = readStoredValue(
    { getItem: () => '{broken' },
    'cart',
    [],
    validateCart,
  )
  assert.deepEqual(broken.value, [])
  assert.ok(broken.warning)
  const denied = readStoredValue(
    {
      getItem() {
        throw new Error('Denied')
      },
    },
    'cart',
    [],
    validateCart,
  )
  assert.ok(denied.warning)
  assert.deepEqual(
    readStoredValue({ getItem: () => null }, 'cart', [], validateCart).value,
    [],
  )
  assert.equal(validateTheme('dark'), 'dark')
  assert.throws(() => validateTheme('blue'))
})

test('invalid URL pages use a safe first page', () => {
  for (const invalid of [
    null,
    '',
    'abc',
    '-2',
    '0',
    '1.5',
    'Infinity',
    '9007199254740991',
  ]) {
    assert.equal(parsePage(invalid), 1)
  }
  assert.equal(parsePage('3'), 3)
})
