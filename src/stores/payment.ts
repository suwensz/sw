import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaymentSettings, ExchangeRate } from '@/types'
import { lt } from '@/utils/locale'

const STORAGE_KEY = 'qh_payment_settings'

/** 每日基准汇率（1 外币 = X 人民币），autoDaily 时每天自动微调 */
const BASE_RATES: ExchangeRate[] = [
  { code: 'USD', symbol: '$', name: lt('美元', 'US Dollar'), rateToCny: 7.16, autoDaily: true },
  { code: 'EUR', symbol: '€', name: lt('欧元', 'Euro'), rateToCny: 7.82, autoDaily: true },
  { code: 'AED', symbol: 'د.إ', name: lt('迪拉姆', 'UAE Dirham'), rateToCny: 1.95, autoDaily: true },
  { code: 'SAR', symbol: '﷼', name: lt('沙特里亚尔', 'Saudi Riyal'), rateToCny: 1.91, autoDaily: true },
  { code: 'THB', symbol: '฿', name: lt('泰铢', 'Thai Baht'), rateToCny: 0.205, autoDaily: true },
  { code: 'VND', symbol: '₫', name: lt('越南盾', 'Vietnamese Dong'), rateToCny: 0.00029, autoDaily: true },
  { code: 'IDR', symbol: 'Rp', name: lt('印尼盾', 'Indonesian Rupiah'), rateToCny: 0.00044, autoDaily: true },
  { code: 'JPY', symbol: '¥', name: lt('日元', 'Japanese Yen'), rateToCny: 0.048, autoDaily: true },
  { code: 'GBP', symbol: '£', name: lt('英镑', 'British Pound'), rateToCny: 9.12, autoDaily: true },
]

function loadSettings(): PaymentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PaymentSettings
      return {
        settlementCny: parsed.settlementCny ?? true,
        rates: parsed.rates?.length ? parsed.rates : [...BASE_RATES],
        methods: Object.assign({ creditCard: true, wechat: true, alipay: true }, parsed.methods || {}),
      }
    }
  } catch { /* ignore */ }
  return { settlementCny: true, rates: [...BASE_RATES], methods: { creditCard: true, wechat: true, alipay: true } }
}

export const usePaymentStore = defineStore('payment', () => {
  const settings = ref<PaymentSettings>(loadSettings())
  const lastRateUpdate = ref<string>(new Date().toLocaleDateString('sv-GB'))

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  /** 每日汇率自动计算（模拟 ±0.6% 微调，保留2位小数） */
  function refreshDailyRates() {
    settings.value.rates = settings.value.rates.map((r) => {
      if (!r.autoDaily) return r
      const drifted = r.rateToCny * (1 + (Math.random() * 0.012 - 0.006))
      const digits = r.rateToCny < 0.01 ? 5 : r.rateToCny < 1 ? 4 : 2
      return { ...r, rateToCny: Number(drifted.toFixed(digits)) }
    })
    lastRateUpdate.value = new Date().toLocaleDateString('sv-GB')
    persist()
  }

  function setRate(code: string, rate: number) {
    const r = settings.value.rates.find((x) => x.code === code)
    if (r) {
      r.rateToCny = rate
      r.autoDaily = false // 手动编辑后停止自动覆盖
      persist()
    }
  }

  function setAutoDaily(code: string, auto: boolean) {
    const r = settings.value.rates.find((x) => x.code === code)
    if (r) {
      r.autoDaily = auto
      persist()
    }
  }

  function setMethod(key: keyof PaymentSettings['methods'], on: boolean) {
    settings.value.methods[key] = on
    persist()
  }

  function setSettlementCny(on: boolean) {
    settings.value.settlementCny = on
    persist()
  }

  /** 外币 → 人民币结算换算 */
  function toCny(amount: number, code: string): number {
    const r = settings.value.rates.find((x) => x.code === code)
    return Math.round(amount * (r ? r.rateToCny : 1) * 100) / 100
  }

  return { settings, lastRateUpdate, refreshDailyRates, setRate, setAutoDaily, setMethod, setSettlementCny, toCny }
})
