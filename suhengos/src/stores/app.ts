import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AssessmentResult } from '@/types'
import { currencies, shippingMethods } from '@/mock/shop'
import type { CurrencyOption, ShippingMethod } from '@/types'

const ASSESSMENT_KEY = 'qh_assessment_result'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const mobileMenuOpen = ref(false)

  const currency = ref<CurrencyOption>(currencies[0])
  const shippingMethod = ref<ShippingMethod>(shippingMethods[0])

  const assessmentResult = ref<AssessmentResult | null>(
    (() => {
      try {
        const raw = localStorage.getItem(ASSESSMENT_KEY)
        return raw ? (JSON.parse(raw) as AssessmentResult) : null
      } catch {
        return null
      }
    })(),
  )

  const healthScore = computed(() => {
    if (!assessmentResult.value) return 0
    // 基于平和质分数计算健康指数
    const balanced = assessmentResult.value.scores['balanced'] || 0
    return Math.round(balanced * 20)
  })

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setCurrency(code: string) {
    const c = currencies.find((cu) => cu.code === code)
    if (c) currency.value = c
  }

  function setShippingMethod(id: string) {
    const m = shippingMethods.find((sm) => sm.id === id)
    if (m) shippingMethod.value = m
  }

  function saveAssessmentResult(result: AssessmentResult) {
    assessmentResult.value = result
    localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(result))
  }

  function convertPrice(usdPrice: number): { value: number; symbol: string } {
    return {
      value: Number((usdPrice * currency.value.rate).toFixed(2)),
      symbol: currency.value.symbol,
    }
  }

  return {
    sidebarCollapsed,
    mobileMenuOpen,
    currency,
    shippingMethod,
    assessmentResult,
    healthScore,
    toggleSidebar,
    setCurrency,
    setShippingMethod,
    saveAssessmentResult,
    convertPrice,
  }
})
