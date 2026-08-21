import type { LocaleText } from '@/types'

/** 快捷构造 LocaleText：ja/ko/es/fr 回退英文（tText 渲染时亦有回退逻辑） */
export function lt(zh: string, en: string): LocaleText {
  return { zh, en, ja: en, ko: en, es: en, fr: en }
}
