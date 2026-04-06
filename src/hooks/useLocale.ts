import { useTranslation } from 'react-i18next'
import type { Locale } from '../lib/i18n'

export function useLocale() {
  const { i18n } = useTranslation()
  const locale = i18n.language as Locale

  function toggleLocale() {
    i18n.changeLanguage(locale === 'es' ? 'en' : 'es')
  }

  return { locale, toggleLocale }
}
