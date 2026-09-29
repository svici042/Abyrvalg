import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateQuote,
  formatMinor,
  priceInMinor,
} from '../src/utils/money.js'
import {
  commitOrders,
  createOrder,
  customerErrors,
  readOrders,
  validateOrders,
} from '../src/utils/orders.js'
import { validateLanguage } from '../src/utils/storage.js'

const items = [
  { id: 1, title: 'A', price: 9.99, quantity: 3 },
  { id: 2, title: 'B', price: 0.13, quantity: 2 },
]
const customer = {
  name: 'Demo Person',
  email: 'demo@example.test',
  address: 'Demo road 12',
}

function memoryStorage() {
  let value = null
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next
    },
  }
}

test('NOK rounds unit minor amounts before totals, without modifying USD prices', () => {
  const original = structuredClone(items)
  const nok = calculateQuote(items, 'NOK')
  assert.equal(nok.lines[0].unitMinor, 10490)
  assert.equal(
    nok.totalMinor,
    nok.lines.reduce((sum, line) => sum + line.totalMinor, 0),
  )
  for (let index = 0; index < 20; index++) {
    assert.equal(calculateQuote(items, 'USD').lines[0].unitMinor, 999)
    assert.deepEqual(calculateQuote(items, 'NOK'), nok)
  }
  assert.deepEqual(items, original)
  assert.equal(priceInMinor(0.13, 10.5), 137)
})

test('order snapshots remain unchanged after language and rate changes', () => {
  const order = createOrder(customer, calculateQuote(items, 'NOK'))
  const before = structuredClone(order)
  formatMinor(order.totalMinor, order.currency, 'en')
  calculateQuote(items, 'USD')
  priceInMinor(items[0].price, 99)
  assert.deepEqual(order, before)
  // An older exchange rate is valid and must never be replaced during restoration.
  const historical = { ...order, rate: 7.25 }
  assert.deepEqual(validateOrders([historical]), [historical])
})

test('order persistence writes before success and rejects malformed data', () => {
  const storage = memoryStorage()
  const order = createOrder(customer, calculateQuote(items, 'USD'))
  commitOrders(storage, (orders) => [...orders, order])
  assert.deepEqual(readOrders(storage), [order])
  assert.throws(() =>
    commitOrders(
      {
        getItem: () => null,
        setItem() {
          throw new Error('Quota')
        },
      },
      () => [order],
    ),
  )
  assert.throws(() =>
    commitOrders(
      {
        getItem: () => '{bad',
        setItem() {
          assert.fail('Must not overwrite')
        },
      },
      () => [order],
    ),
  )
  for (const invalid of [
    null,
    {},
    [null],
    [order, order],
    [{ ...order, totalMinor: 0 }],
    [{ ...order, status: 'paid' }],
  ]) {
    assert.throws(() => validateOrders(invalid))
  }
})

test('status changes keep payment separate and customer/language validation is strict', () => {
  const storage = memoryStorage()
  const order = createOrder(customer, calculateQuote(items, 'USD'))
  commitOrders(storage, () => [order])
  commitOrders(storage, (orders) =>
    orders.map((item) => ({ ...item, status: 'cancelled' })),
  )
  assert.equal(readOrders(storage)[0].paymentStatus, 'simulated_paid')
  assert.equal(
    Object.keys(customerErrors({ name: '', email: 'wrong', address: '' }))
      .length,
    3,
  )
  assert.equal(validateLanguage('en'), 'en')
  assert.throws(() => validateLanguage('de'))
})
