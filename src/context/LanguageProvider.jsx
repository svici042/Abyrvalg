import { useProductTranslations } from '../hooks/useProductTranslations'
import { useEffect } from 'react'
import { LanguageContext } from './LanguageContext'
import usePersistentState from '../hooks/usePersistentState'
import { validateLanguage } from '../utils/storage'
import { translate } from '../i18n/messages'
import { useCurrency } from '../hooks/useCurrency'
import { productText } from '../i18n/productText'
import { currencySettings, formatMinor, priceInMinor } from '../utils/money'

export function LanguageProvider({ children }) {
  const [language, setLanguage, warning] = usePersistentState(
    'abyrvalg-language',
    'nb',
    validateLanguage,
  )
  const dictionaries = useProductTranslations(language)
  const { currency } = useCurrency()
  const { rate } = currencySettings(currency)

  // Match the document language to the interface for assistive technology.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = {
    language,
    setLanguage,
    warning,
    currency,
    t: (key, values) => translate(language, key, values),
    productTitle: (product) =>
      productText(product, language, 'title', dictionaries),
    productDescription: (product) =>
      productText(product, language, 'description', dictionaries),
    formatPrice: (basePrice) =>
      formatMinor(priceInMinor(basePrice, rate), currency, language),
    formatAmount: (minor, transactionCurrency = currency) =>
      formatMinor(minor, transactionCurrency, language),
  }
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
