// 农历工具库快速验证（仅开发期使用）
import { createRequire } from 'module'
// 直接用 Node 类型剥离运行 TS
import { solar2lunar, lunar2solar, lunarMonthOptions, leapMonth, formatLunarBirth } from '../src/utils/lunar.ts'

let pass = 0
let fail = 0
function check(name, cond) {
  if (cond) {
    pass++
    console.log('  PASS', name)
  } else {
    fail++
    console.log('  FAIL', name)
  }
}

// 1. 已知春节日期
const cases = [
  ['2020-01-25', { year: 2020, month: 1, day: 1, isLeap: false }],
  ['2021-02-12', { year: 2021, month: 1, day: 1, isLeap: false }],
  ['2022-02-01', { year: 2022, month: 1, day: 1, isLeap: false }],
  ['2023-01-22', { year: 2023, month: 1, day: 1, isLeap: false }],
  ['2024-02-10', { year: 2024, month: 1, day: 1, isLeap: false }],
  ['2025-01-29', { year: 2025, month: 1, day: 1, isLeap: false }],
]
console.log('== 春节对应 ==')
for (const [solar, expect] of cases) {
  const [y, m, d] = solar.split('-').map(Number)
  const got = solar2lunar(new Date(y, m - 1, d))
  check(`${solar} -> 农历 ${expect.year}年${expect.month}月${expect.day}日`, got.year === expect.year && got.month === expect.month && got.day === expect.day && got.isLeap === expect.isLeap)
}

// 2. 2023 闰二月
console.log('== 2023 闰二月 ==')
check('2023 leap month = 2', leapMonth(2023) === 2)
const leapOpts = lunarMonthOptions(2023).filter((o) => o.isLeap)
check('2023 month options include leap 2', leapOpts.length === 1 && leapOpts[0].value === 2)
// 2023-03-22 是闰二月初一（已知：2023年3月22日 = 闰二月初一）
const l1 = solar2lunar(new Date(2023, 2, 22))
check('2023-03-22 -> 闰二月初一', l1.month === 2 && l1.day === 1 && l1.isLeap === true)
const s1 = lunar2solar(2023, 2, 1, true)
check('闰二月初一 -> 2023-03-22', s1.getFullYear() === 2023 && s1.getMonth() === 2 && s1.getDate() === 22)

// 3. 往返一致性（随机日期 1950-2090）
console.log('== 往返一致性 ==')
let roundTripOk = true
for (let i = 0; i < 2000; i++) {
  const y = 1950 + Math.floor(Math.random() * 140)
  const m = 1 + Math.floor(Math.random() * 12)
  const d = 1 + Math.floor(Math.random() * 28)
  const solar = lunar2solar(y, m, d, false)
  const back = solar2lunar(solar)
  if (back.year !== y || back.month !== m || back.day !== d || back.isLeap) {
    roundTripOk = false
    if (fail < 5) console.log('  round-trip mismatch:', y, m, d, '->', solar, '->', back)
    break
  }
}
check('2000 random solar dates round-trip', roundTripOk)

// 4. 闰月往返
let leapRoundTripOk = true
for (let y = 1900; y <= 2100; y++) {
  const lm = leapMonth(y)
  if (lm > 0) {
    const solar = lunar2solar(y, lm, 15, true)
    const back = solar2lunar(solar)
    if (!(back.year === y && back.month === lm && back.isLeap === true)) {
      leapRoundTripOk = false
      console.log('  leap round-trip mismatch:', y, lm, '->', solar, '->', back)
      break
    }
  }
}
check('all leap months (1900-2100) round-trip', leapRoundTripOk)

// 5. 多语言格式化
console.log('== 多语言格式化 ==')
console.log('  zh:', formatLunarBirth({ year: 1990, month: 6, day: 15, isLeap: false }, 'zh'))
console.log('  en:', formatLunarBirth({ year: 1990, month: 6, day: 15, isLeap: false }, 'en'))
console.log('  ja:', formatLunarBirth({ year: 2023, month: 2, day: 1, isLeap: true }, 'ja'))
console.log('  ko:', formatLunarBirth({ year: 2023, month: 2, day: 1, isLeap: true }, 'ko'))
console.log('  es:', formatLunarBirth({ year: 2023, month: 2, day: 1, isLeap: true }, 'es'))
console.log('  fr:', formatLunarBirth({ year: 2023, month: 2, day: 1, isLeap: true }, 'fr'))

// 6. 边界
console.log('== 边界 ==')
check('1900-01-31 -> 1900正月初一', (() => { const l = solar2lunar(new Date(1900, 0, 31)); return l.year === 1900 && l.month === 1 && l.day === 1 })())
check('2100-12-31 within range (no throw)', (() => { try { solar2lunar(new Date(2100, 11, 31)); return true } catch { return false } })())

console.log(`\n结果: ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
