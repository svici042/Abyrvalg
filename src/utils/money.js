import { DEMO_USD_TO_NOK } from '../config/currency.js'

export function currencySettings(currency) {
  if (currency === 'NOK') {
    return { currency: 'NOK', rate: DEMO_USD_TO_NOK }
  }
  return { currency: 'USD', rate: 1 }
}

export function formatMinor(amount, currency, language) {
  return new Intl.NumberFormat(language === 'nb' ? 'nb-NO' : 'en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(amount / 100)
}

// Round each unit price before multiplication so line totals agree with the grand total.
export function priceInMinor(basePrice, rate) {
  return Math.round((basePrice * rate + Number.EPSILON) * 100)
}

export function calculateQuote(items, selectedCurrency) {
  const { currency, rate } = currencySettings(selectedCurrency)
  // Each line stores its base price and rounded transaction amounts for later display.
  const lines = items.map((item) => {
    const unitMinor = priceInMinor(item.price, rate)
    return {
      productId: item.id,
      title: item.title,
      basePrice: item.price,
      quantity: item.quantity,
      unitMinor,
      totalMinor: unitMinor * item.quantity,
    }
  })
  return {
    currency,
    rate,
    lines,
    totalMinor: lines.reduce((sum, line) => sum + line.totalMinor, 0),
  }
}
