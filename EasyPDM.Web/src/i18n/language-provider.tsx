import { useCallback, useState, type ReactNode } from "react"

import { LanguageContext } from "@/i18n/language-context"
import { translations, type Language, type TranslationKey } from "@/i18n/translations"

const STORAGE_KEY = "pdm_language"

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null && stored in translations) return stored as Language
  return defaultLanguage()
}

// 首次访问且未手动选过语言时：浏览器语言为 zh/de/en 时直接匹配，其余一律默认简体中文
// （fork 版 nimingming1135/EasyPDM 面向中文用户，故将中文设为默认）。选择过的语言仍
// 存入 localStorage 并优先于本默认值。
function defaultLanguage(): Language {
  const lang = (typeof navigator !== "undefined" && navigator.language?.toLowerCase()) || ""
  if (lang.startsWith("zh")) return "zh"
  if (lang.startsWith("de")) return "de"
  if (lang.startsWith("en")) return "en"
  return "zh"
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
