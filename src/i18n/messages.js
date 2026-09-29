import norwegian from './nb.js'
import english from './en.js'

// Shared lookup and placeholder interpolation for both languages.
export function translate(language, key, values = {}) {
  let text = language === 'en' ? english[key] || key : norwegian[key] || key
  // A replacement callback keeps user text literal instead of interpreting replacement patterns.
  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{${name}}`, () => String(value))
  }
  return text
}
