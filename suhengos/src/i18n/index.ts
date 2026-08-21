import type { LocaleText } from '@/types'
import zh from './locales/zh'
import en from './locales/en'
import ja from './locales/ja'
import ko from './locales/ko'
import es from './locales/es'
import fr from './locales/fr'
import ar from './locales/ar'
import id from './locales/id'
import ms from './locales/ms'
import vi from './locales/vi'
import th from './locales/th'
import fil from './locales/fil'
import { extendMessages } from './extensions'
import { createI18n } from 'vue-i18n'
import type { LocaleCode } from '@/types'

const baseMessages = { zh, en, ja, ko, es, fr, ar, id, ms, vi, th, fil } as const

// 合并扩展文案（健康预警、家人、手表、电商运营）
const messages: Record<string, unknown> = {}
;(Object.keys(baseMessages) as LocaleCode[]).forEach((loc) => {
  messages[loc] = extendMessages(loc, baseMessages[loc])
})

const STORAGE_KEY = 'qh_locale'

function detectLocale(): LocaleCode {
  const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode | null
  if (saved && saved in messages) return saved
  const browserLang = navigator.language.split('-')[0] as LocaleCode
  if (browserLang in messages) return browserLang
  return 'zh'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: messages as unknown as Record<string, Record<string, unknown>> as never,
})

// RTL 语言（从右到左）：阿拉伯语
const RTL_LOCALES: LocaleCode[] = ['ar']

export function isRTL(loc: LocaleCode): boolean {
  return RTL_LOCALES.includes(loc)
}

export function setLocale(loc: LocaleCode) {
  ;(i18n.global.locale as unknown as { value: string }).value = loc
  localStorage.setItem(STORAGE_KEY, loc)
  document.documentElement.setAttribute('lang', loc)
  document.documentElement.dir = isRTL(loc) ? 'rtl' : 'ltr'
}

export function getLocale(): LocaleCode {
  return (i18n.global.locale as unknown as { value: LocaleCode }).value
}

export function tText(text: LocaleText, loc?: LocaleCode): string {
  const current = loc || getLocale()
  return text[current] || text.en
}

export const localeOptions: Array<{ code: LocaleCode; label: string; nativeLabel: string }> = [
  { code: 'zh', label: 'Chinese', nativeLabel: '简体中文' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  // 中东
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  // 东南亚
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย' },
  { code: 'fil', label: 'Filipino', nativeLabel: 'Filipino' },
]

export default i18n
