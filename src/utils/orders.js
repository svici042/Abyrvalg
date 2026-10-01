export const ORDER_KEY = 'abyrvalg-orders'
// Allowed fulfilment states are shared by validation, filters and editing controls.
export const ORDER_STATUSES = [
  'new',
  'processing',
  'shipped',
  'completed',
  'cancelled',
]
// Stored codes remain language independent; values are translation keys.
export const STATUS_LABELS = {
  new: 'New',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function customerErrors(customer) {
  const errors = {}
  if (
    typeof customer.name !== 'string' ||
    customer.name.trim().length < 2 ||
    customer.name.length > 100
  ) {
    errors.name = 'Enter a name (at least 2 characters).'
  }
  if (
    typeof customer.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) ||
    customer.email.length > 254
  ) {
    errors.email = 'Enter a valid email address.'
  }
  if (
    typeof customer.address !== 'string' ||
    customer.address.trim().length < 5 ||
    customer.address.length > 500
  ) {
    errors.address = 'Enter a delivery address (at least 5 characters).'
  }
  return errors
}

const isMinor = (value) => Number.isSafeInteger(value) && value >= 0

export function validateOrders(value) {
  if (!Array.isArray(value)) throw new Error('Invalid orders')
  const ids = new Set()
  for (const order of value) {
    // Validate totals and line items as well as the parsed JSON structure.
    if (
      !order ||
      typeof order.id !== 'string' ||
      !order.id.startsWith('AB-') ||
      ids.has(order.id) ||
      typeof order.createdAt !== 'string' ||
      !Number.isFinite(Date.parse(order.createdAt)) ||
      !order.customer ||
      Object.keys(customerErrors(order.customer)).length ||
      !['USD', 'NOK'].includes(order.currency) ||
      !Number.isFinite(order.rate) ||
      order.rate <= 0 ||
      order.paymentStatus !== 'simulated_paid' ||
      !ORDER_STATUSES.includes(order.status) ||
      !Array.isArray(order.lines) ||
      !order.lines.length ||
      !isMinor(order.totalMinor)
    ) {
      throw new Error('Invalid order')
    }
    // Validate each line and reject duplicate products before checking the order total.
    const productIds = new Set()
    for (const line of order.lines) {
      if (
        !line ||
        !Number.isSafeInteger(line.productId) ||
        line.productId < 1 ||
        productIds.has(line.productId) ||
        typeof line.title !== 'string' ||
        !line.title.trim() ||
        !Number.isFinite(line.basePrice) ||
        line.basePrice < 0 ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1 ||
        !isMinor(line.unitMinor) ||
        !isMinor(line.totalMinor) ||
        line.unitMinor * line.quantity !== line.totalMinor
      )
        throw new Error('Invalid order line')
      if (
        line.text &&
        ['en', 'nb'].some((language) => {
          const text = line.text[language]
          return (
            !text ||
            typeof text.title !== 'string' ||
            !text.title.trim() ||
            text.title.length > 200 ||
            typeof text.description !== 'string' ||
            text.description.length > 10000
          )
        })
      )
        throw new Error('Invalid order text')
      productIds.add(line.productId)
    }
    if (
      order.lines.reduce((sum, line) => sum + line.totalMinor, 0) !==
      order.totalMinor
    ) {
      throw new Error('Invalid order total')
    }
    ids.add(order.id)
  }
  // Validate historical amounts as saved snapshots, never against the current exchange rate.
  return value
}

// Copy checkout data so later cart edits cannot alter a saved transaction.
export function createOrder(customer, quote) {
  return {
    id: `AB-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    customer: Object.fromEntries(
      Object.entries(customer).map(([key, value]) => [key, value.trim()]),
    ),
    ...structuredClone(quote),
    paymentStatus: 'simulated_paid',
    status: 'new',
  }
}

export function readOrders(storage) {
  const raw = storage.getItem(ORDER_KEY)
  return validateOrders(raw === null ? [] : JSON.parse(raw))
}

export function commitOrders(storage, update) {
  // Read the latest stored version and persist changes before updating React state.
  const next = validateOrders(update(readOrders(storage)))
  storage.setItem(ORDER_KEY, JSON.stringify(next))
  return next
}
