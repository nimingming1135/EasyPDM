import { useCallback, useEffect, useState, type ReactNode } from "react"

import { LanguageContext } from "@/i18n/language-context"
import { translations, type Language, type TranslationKey } from "@/i18n/translations"

const STORAGE_KEY = "pdm_language"

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null && stored in translations) return stored as Language
  return defaultLanguage()
}

// 首次访问且未手动选过语言时：浏览器语言为 zh/pl/de/en 时直接匹配，其余一律默认简体中文
// （fork 版 nimingming1135/EasyPDM 面向中文用户，故中文是默认值）。波兰语必须显式匹配，
// 否则上游的波兰语用户会被拉到中文界面——这是把默认值从 "pl" 改成 "zh" 时最容易漏掉的一项。
// 选择过的语言仍存入 localStorage 并优先于本默认值。
function defaultLanguage(): Language {
  const lang = (typeof navigator !== "undefined" && navigator.language?.toLowerCase()) || ""
  if (lang.startsWith("zh")) return "zh"
  if (lang.startsWith("pl")) return "pl"
  if (lang.startsWith("de")) return "de"
  if (lang.startsWith("en")) return "en"
  return "zh"
}

// <html lang> 必须跟着界面语言走，否则屏幕阅读器和浏览器"是否翻译此页"的判断都是错的
// （index.html 里写死的是 "pl"）。中文用 zh-CN，其余与语言代码一致。
const HTML_LANG: Record<Language, string> = { pl: "pl", en: "en", de: "de", zh: "zh-CN" }

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[language]
  }, [language])

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
