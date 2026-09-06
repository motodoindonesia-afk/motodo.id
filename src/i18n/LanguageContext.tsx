import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { persistLocale, readStoredLocale, translate, translateUserMessage } from "./translate"
import { DEFAULT_LOCALE, type Locale, type MessageKey, type Translate, type TranslateVars } from "./translations"

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
  tm: (message: string, fallback?: MessageKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function makeT(locale: Locale): Translate {
  return (key: MessageKey, vars?: TranslateVars) => translate(locale, key, vars)
}

const fallback: LanguageContextValue = {
  locale: "en",
  setLocale: () => undefined,
  t: makeT("en"),
  tm: (message, fallbackKey) => translateUserMessage("en", message, fallbackKey),
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window === "undefined" ? DEFAULT_LOCALE : readStoredLocale(),
  )

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    persistLocale(next)
  }, [])

  const value = useMemo<LanguageContextValue>(() => {
    const t = makeT(locale)
    return {
      locale,
      setLocale,
      t,
      tm: (message, fallbackKey) => translateUserMessage(locale, message, fallbackKey),
    }
  }, [locale, setLocale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/** Motodo uses LanguageProvider. Ritme has no provider and stays English. */
export function useLanguage() {
  return useContext(LanguageContext) ?? fallback
}

export function useT() {
  return useLanguage().t
}
