import type { LocaleText, LangRegion } from '@/types'
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
import { getPortalMessages } from './portalMessages'
import { getAdminMessages } from './adminMessages'
import { getDevMessages } from './devMessages'
import { createI18n } from 'vue-i18n'
import type { LocaleCode } from '@/types'

const baseMessages = { zh, en, ja, ko, es, fr, ar, id, ms, vi, th, fil } as const

// 合并扩展文案（健康预警、家人、手表、电商运营）
const messages: Record<string, unknown> = {}
;(Object.keys(baseMessages) as Array<keyof typeof baseMessages>).forEach((loc) => {
  messages[loc] = extendMessages(loc, baseMessages[loc])
  // 合并门户框架层文案（PortalLayout / 菜单 / 接单提醒智能体）
  ;(messages[loc] as Record<string, unknown>).portal = getPortalMessages(loc)
  // 合并管理端 / 开发端文案（zh/en 完整，其余回退英文）
  ;(messages[loc] as Record<string, unknown>).admin = getAdminMessages(loc)
  ;(messages[loc] as Record<string, unknown>).dev = getDevMessages(loc)
})
// 港澳繁體中文（zh-TW）：暂复用简体中文全量文案，保证功能完整可用
messages['zh-TW'] = JSON.parse(JSON.stringify(messages['zh']))

const STORAGE_KEY = 'qh_locale'

function detectLocale(): LocaleCode {
  const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode | null
  if (saved && saved in messages) return saved
  const raw = navigator.language
  // 港澳繁体环境 → 繁體中文
  if (['zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant'].includes(raw)) return 'zh-TW'
  const browserLang = raw.split('-')[0] as LocaleCode
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

/** 部分翻译文案：仅提供 zh/en（或更多语言），未覆盖语言回退英文 */
export type PartialLocaleText = Partial<LocaleText> & Pick<LocaleText, 'zh' | 'en'>

export function tText(text: PartialLocaleText, loc?: LocaleCode): string {
  const current = loc || getLocale()
  // 繁體中文未单独维护文案时回退简体中文
  const fallback = current === 'zh-TW' ? (text['zh-TW'] || text.zh) : text[current]
  return fallback || text.en
}

export type LocaleOption = {
  code: LocaleCode
  label: string
  nativeLabel: string
  region: LangRegion
  flag: string
}

/** 多语言选择栏：按区域分组（大陆 / 港澳 / 中东 / 东南亚 / 国际） */
export const localeOptions: LocaleOption[] = [
  // 🇨🇳 大陆
  { code: 'zh', label: 'Chinese (Simplified)', nativeLabel: '简体中文', region: 'mainland', flag: '🇨🇳' },
  // 🇭🇰🇲🇴 港澳
  { code: 'zh-TW', label: 'Chinese (Traditional)', nativeLabel: '繁體中文', region: 'hkmo', flag: '🇭🇰' },
  { code: 'en', label: 'English', nativeLabel: 'English', region: 'hkmo', flag: '🇬🇧' },
  // 🕌 中东
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', region: 'mideast', flag: '🇸🇦' },
  // 🌏 东南亚
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', region: 'sea', flag: '🇻🇳' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย', region: 'sea', flag: '🇹🇭' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', region: 'sea', flag: '🇮🇩' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu', region: 'sea', flag: '🇲🇾' },
  { code: 'fil', label: 'Filipino', nativeLabel: 'Filipino', region: 'sea', flag: '🇵🇭' },
  // 🌍 国际
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', region: 'global', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', region: 'global', flag: '🇰🇷' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', region: 'global', flag: '🇪🇸' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', region: 'global', flag: '🇫🇷' },
]

/** 区域分组顺序 */
export const langRegionOrder: LangRegion[] = ['mainland', 'hkmo', 'mideast', 'sea', 'global']

export default i18n
