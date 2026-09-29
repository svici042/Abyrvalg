export function readStoredValue(storage, key, fallback, validate) {
  // Fall back to usable defaults when JSON is invalid or storage access fails.
  try {
    const raw = storage.getItem(key)
    return {
      value: raw === null ? fallback : validate(JSON.parse(raw)),
      warning: '',
    }
  } catch {
    return {
      value: fallback,
      warning: 'storageRead',
    }
  }
}

export function validateLanguage(value) {
  if (value !== 'nb' && value !== 'en') throw new Error('Invalid language')
  return value
}

export function validateTheme(value) {
  if (value !== 'light' && value !== 'dark') throw new Error('Invalid theme')
  return value
}

export function validateCurrency(value) {
  if (!['NOK', 'USD'].includes(value)) throw new Error('Invalid currency')
  return value
}
