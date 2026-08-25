'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Locale } from '@/lib/i18n'

const LocaleContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
}>({
  locale: 'fr',
  setLocale: () => {},
})

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('fr')

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  return (
    <div className="language-switcher" aria-label="Language">
      <button className={locale === 'fr' ? 'selected' : ''} onClick={() => setLocale('fr')}>
        FR
      </button>
      <span>/</span>
      <button className={locale === 'en' ? 'selected' : ''} onClick={() => setLocale('en')}>
        EN
      </button>
    </div>
  )
}
