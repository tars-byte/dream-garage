import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from '../locales/es.json'
import en from '../locales/en.json'

// Detect language from browser. Default to Spanish (Costa Rica).
// Switch to English only when the browser is explicitly set to English.
function detectLocale(): 'es' | 'en' {
  const lang = navigator.language || ''
  return lang.toLowerCase().startsWith('en') ? 'en' : 'es'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: detectLocale(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

export default i18n

export type Locale = 'es' | 'en'
