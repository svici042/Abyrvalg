import { translate } from '../i18n/messages.js'

export const contentLabels = {
  storeName: 'Store name',
  heroHeading: 'Hero heading',
  heroText: 'Hero supporting text',
  announcement: 'Announcement text',
  footer: 'Footer content',
  contact: 'Displayed fictional contact information',
}

// The original hero segments retain their line breaks and emphasis in the storefront.
export const HERO_HEADING = [
  'Everyday life, with',
  'a little more',
  'possibility.',
]

export const HERO_TEXT = [
  'From what you need to what you never knew you wanted.',
  'Find your next favourite with us.',
]

const defaults = {
  storeName: 'Abyrvalg',
  announcement: 'A little of everything. A good choice.',
  footer: 'Small finds. Big possibilities.',
  contact: 'Demo contact: hello@example.com · Example Street 1',
}

export function defaultStoreContent() {
  return Object.fromEntries(
    Object.keys(contentLabels).map((field) => [
      field,
      Object.fromEntries(
        ['en', 'nb'].map((language) => [
          language,
          field === 'heroHeading'
            ? HERO_HEADING.map((key) => translate(language, key)).join(' ')
            : field === 'heroText'
              ? HERO_TEXT.map((key) => translate(language, key)).join(' ')
              : translate(language, defaults[field]),
        ]),
      ),
    ]),
  )
}

export function contentDraft(config) {
  return { ...defaultStoreContent(), logo: '', ...config.content }
}

// Do not turn unchanged hero defaults into plain-text overrides when saving other fields.
export function contentOverrides(draft) {
  const defaults = defaultStoreContent()
  return Object.fromEntries(
    Object.entries(draft).filter(([field, value]) =>
      field === 'logo'
        ? !!value
        : JSON.stringify(value) !== JSON.stringify(defaults[field]),
    ),
  )
}
