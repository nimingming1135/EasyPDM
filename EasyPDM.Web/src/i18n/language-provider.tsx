import { useCallback, useState, type ReactNode } from "react"

import { LanguageContext } from "@/i18n/language-context"
import { translations, type Language, type TranslationKey } from "@/i18n/translations"

const STORAGE_KEY = "pdm_language"

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null && stored in translations) return stored as Language
  return defaultLanguage()
}

// 首次访问且未手动选过语言时，按浏览器语言匹配（zh→中文、de→德语、en→英语），
// 匹配不到时保持上游默认的波兰语。选择过的语言仍存入 localStorage 并优先。
function defaultLanguage(): Language {
  const lang = (typeof navigator !== "undefined" && navigator.language?.toLowerCase()) || ""
  if (lang.startsWith("zh")) return "zh"
  if (lang.startsWith("de")) return "de"
  if (lang.startsWith("en")) return "en"
  return "pl"
}

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const template = translations[language][key]
      if (!params) return template
      return Object.entries(params).reduce(
        (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
        template
      )
    },
    [language]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export { LanguageProvider }
