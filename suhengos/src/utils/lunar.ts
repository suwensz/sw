// 农历（阴历）与公历（阳历）互转工具
// 数据表覆盖 1900-2100 年，算法基于中华农历历法通用实现
// 用法示例：
//   solar2lunar(new Date('2020-01-25'))  // => { year: 2020, month: 1, day: 1, isLeap: false }（正月初一）
//   lunar2solar(2020, 4, 5, true)        // => 2020年闰四月初五对应的公历 Date

import { localizeDigits } from './numbers'

export interface LunarDate {
  year: number
  month: number
  day: number
  isLeap: boolean
}

// 农历信息表（1900-2100）
// 低 4 位：闰月月份（0 = 无闰月）；bit16（0x10000）：闰月 30 天（否则 29 天）
// 第 4~15 位：每月天数，bit15 对应正月（1 = 30 天，0 = 29 天）
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520, // 2100
]

const MIN_YEAR = 1900
const MAX_YEAR = 2100
const BASE_SOLAR = Date.UTC(1900, 0, 31) // 1900-01-31 = 农历 1900 年正月初一
const DAY_MS = 86400000

function idx(year: number): number {
  return year - MIN_YEAR
}

/** 农历某年总天数 */
export function lunarYearDays(year: number): number {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if (LUNAR_INFO[idx(year)] & i) sum += 1
  }
  return sum + leapDays(year)
}

/** 农历某年闰月月份（0 = 无闰月） */
export function leapMonth(year: number): number {
  return LUNAR_INFO[idx(year)] & 0xf
}

/** 农历某年闰月天数（无闰月返回 0） */
export function leapDays(year: number): number {
  if (!leapMonth(year)) return 0
  return LUNAR_INFO[idx(year)] & 0x10000 ? 30 : 29
}

/** 农历某年某月（非闰）天数 */
export function lunarMonthDays(year: number, month: number): number {
  return LUNAR_INFO[idx(year)] & (0x10000 >> month) ? 30 : 29
}

/** 农历某年某月实际天数（支持闰月） */
export function lunarMonthDaysOf(year: number, month: number, isLeap: boolean): number {
  return isLeap ? leapDays(year) : lunarMonthDays(year, month)
}

/** 农历年份范围 */
export function lunarYearRange(): [number, number] {
  return [MIN_YEAR, MAX_YEAR]
}

/**
 * 阳历 → 农历
 */
export function solar2lunar(date: Date): LunarDate {
  const ms = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  let offset = Math.floor((ms - BASE_SOLAR) / DAY_MS)
  if (offset < 0) throw new Error('Date out of lunar range (before 1900)')

  // 定位农历年
  let year = MIN_YEAR
  while (year <= MAX_YEAR) {
    const days = lunarYearDays(year)
    if (offset < days) break
    offset -= days
    year++
  }
  if (year > MAX_YEAR) throw new Error('Date out of lunar range (after 2100)')

  const leap = leapMonth(year)
  let month = 1
  let isLeap = false

  while (month <= 12) {
    let days: number
    if (isLeap) {
      days = leapDays(year)
      if (offset < days) return { year, month, day: offset + 1, isLeap: true }
      offset -= days
      isLeap = false
      month++
    } else {
      days = lunarMonthDays(year, month)
      if (offset < days) return { year, month, day: offset + 1, isLeap: false }
      offset -= days
      if (leap > 0 && month === leap) {
        isLeap = true // 下一轮处理闰月
      } else {
        month++
      }
    }
  }
  // 理论上不可达
  return { year, month: 12, day: 29, isLeap: false }
}

/**
 * 农历 → 阳历（返回本地时区 Date）
 */
export function lunar2solar(year: number, month: number, day: number, isLeap: boolean): Date {
  if (year < MIN_YEAR || year > MAX_YEAR) throw new Error('Lunar year out of range')
  if (month < 1 || month > 12) throw new Error('Invalid lunar month')
  const leap = leapMonth(year)
  if (isLeap && leap !== month) throw new Error(`Year ${year} has no leap month ${month}`)

  let offset = 0
  for (let y = MIN_YEAR; y < year; y++) offset += lunarYearDays(y)

  // 累加目标月之前的月份（经过闰月时把闰月天数也算上）
  for (let m = 1; m < month; m++) {
    offset += lunarMonthDays(year, m)
    if (leap > 0 && m === leap) offset += leapDays(year)
  }
  // 闰月排在该月非闰月之后，目标是闰月时需先跨过非闰月
  if (isLeap) offset += lunarMonthDays(year, month)
  const maxDay = isLeap ? leapDays(year) : lunarMonthDays(year, month)
  if (day < 1 || day > maxDay) throw new Error(`Invalid lunar day ${day} (max ${maxDay})`)
  offset += day - 1

  const d = new Date(BASE_SOLAR + offset * DAY_MS)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/**
 * 生成某农历年用于选择器的月份列表（含闰月项）
 * 返回 [{ label, value, isLeap }]
 */
export function lunarMonthOptions(year: number): Array<{ label: string; value: number; isLeap: boolean }> {
  const list: Array<{ label: string; value: number; isLeap: boolean }> = []
  for (let m = 1; m <= 12; m++) {
    list.push({ label: String(m), value: m, isLeap: false })
    if (leapMonth(year) === m) {
      list.push({ label: `闰${m}`, value: m, isLeap: true })
    }
  }
  return list
}

// ========== 多语言农历日期显示 ==========

const MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const DAY_CN = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

/**
 * 农历日期本地化显示
 * @param lunar 农历日期
 * @param locale 语言代码（zh/en/ja/ko/es/fr/ar/id/ms/vi/th/fil）
 */
export function formatLunarDate(lunar: LunarDate, locale: string): string {
  const leapPrefix = lunar.isLeap
  const m = lunar.month
  const d = lunar.day
  const nums = (s: string | number) => localizeDigits(s, locale)
  switch (locale) {
    case 'zh':
      return `${lunar.year}年${leapPrefix ? '闰' : ''}${MONTH_CN[m - 1]}月${DAY_CN[d - 1]}`
    case 'ja':
      return `${lunar.year}年${leapPrefix ? '閏' : ''}${m}月${d}日`
    case 'ko':
      return `${lunar.year}년 ${leapPrefix ? '윤' : ''}${m}월 ${d}일`
    case 'es':
      return `Lunar ${d}/${m}/${lunar.year}${leapPrefix ? ' (bisiesto)' : ''}`
    case 'fr':
      return `Lunaire ${d}/${m}/${lunar.year}${leapPrefix ? ' (bissextile)' : ''}`
    case 'ar':
      // 阿拉伯语：从右到左，数字本地化为阿拉伯-印度数字
      return `قمرية ${nums(d)}/${nums(m)}/${nums(lunar.year)}${leapPrefix ? ' (كبيسة)' : ''}`
    case 'id':
      return `Imlek ${lunar.year}/${m}/${d}${leapPrefix ? ' (kabisat)' : ''}`
    case 'ms':
      return `Lunar ${lunar.year}/${m}/${d}${leapPrefix ? ' (lompat)' : ''}`
    case 'vi':
      return `Âm lịch ${d}/${m}/${lunar.year}${leapPrefix ? ' (nhuận)' : ''}`
    case 'th':
      // 泰语：泰文数字
      return `จันทรคติ ${nums(d)}/${nums(m)}/${nums(lunar.year)}${leapPrefix ? ' (อธิกมาส)' : ''}`
    case 'fil':
      return `Lunar ${lunar.year}/${m}/${d}${leapPrefix ? ' (leap)' : ''}`
    case 'en':
    default:
      return `Lunar ${lunar.year}/${m}/${d}${leapPrefix ? ' (leap)' : ''}`
  }
}

/** 从 FamilyMember 保存的 lunarBirth 结构生成显示串 */
export function formatLunarBirth(
  lunar: { year: number; month: number; day: number; isLeap: boolean },
  locale: string,
): string {
  return formatLunarDate(lunar, locale)
}

/** 公历 YYYY-MM-DD → 农历对象 */
export function solarStr2lunar(dateStr: string): LunarDate | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return null
  return solar2lunar(new Date(y, m - 1, d))
}
