/**
 * 数字本地化工具
 *
 * 支持语言：
 * - ar（阿拉伯语）：阿拉伯-印度数字 ٠١٢٣٤٥٦٧٨٩，千分位逗号
 * - th（泰语）：泰语数字 ๐๑๒๓๔๕๖๗๘๙，千分位逗号
 * - 其他语言：标准拉丁数字
 */

import type { LocaleCode } from '@/types'

/** 阿拉伯-印度数字（中东地区，如阿联酋/沙特） */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
/** 泰语数字 */
const TH_DIGITS = '๐๑๒๓๔๕๖๗๘๙'

/** 将字符串中的 ASCII 数字替换为语言对应数字字符（ar/th），其余语言原样返回 */
export function localizeDigits(str: string | number, locale: string): string {
  const s = String(str)
  if (locale === 'ar') return s.replace(/\d/g, (d) => AR_DIGITS[Number(d)])
  if (locale === 'th') return s.replace(/\d/g, (d) => TH_DIGITS[Number(d)])
  return s
}

/**
 * 数字本地化（含千分位）
 * 例：12345.6 → en "12,345.6" / ar "١٢٬٣٤٥٫٦" / th "๑๒,๓๔๕.๖"
 */
export function localizeNumber(
  n: number | string,
  locale: string,
  opts: { maximumFractionDigits?: number } = {},
): string {
  const num = typeof n === 'string' ? Number(n) : n
  if (!Number.isFinite(num)) return String(n)
  const { maximumFractionDigits = 2 } = opts
  const formatted = num.toLocaleString('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  })
  return localizeDigits(formatted, locale)
}

/** 金额本地化：币种符号 + 本地化数字（如 $1,299 → ar: $١٬٢٩٩ / th: $๑,๒๙๙） */
export function localizePrice(amount: number, symbol: string, locale: string): string {
  return `${symbol}${localizeNumber(amount, locale)}`
}

/** 日期本地化：YYYY-MM-DD 或任意含数字字符串，数字按语言转换 */
export function localizeDateStr(dateStr: string, locale: string): string {
  return localizeDigits(dateStr, locale)
}

/** 判断是否为 RTL 语言 */
export function isRTL(locale: string): boolean {
  return locale === 'ar'
}

/** 当前语言代码（从 getLocale 获取，兼容组件内使用） */
export function localeCode(locale: string): LocaleCode {
  return locale as LocaleCode
}
