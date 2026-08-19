import type { CurrencyOption, ShippingMethod } from '@/types'

export const currencies: CurrencyOption[] = [
  { code: 'USD', symbol: '$', rate: 1, label: { zh: '美元', en: 'USD', ja: '米ドル', ko: '달러', es: 'USD', fr: 'USD' } },
  { code: 'CNY', symbol: '¥', rate: 7.24, label: { zh: '人民币', en: 'CNY', ja: '人民元', ko: '위안', es: 'CNY', fr: 'CNY' } },
  { code: 'EUR', symbol: '€', rate: 0.92, label: { zh: '欧元', en: 'EUR', ja: 'ユーロ', ko: '유로', es: 'EUR', fr: 'EUR' } },
  { code: 'JPY', symbol: '¥', rate: 149.5, label: { zh: '日元', en: 'JPY', ja: '円', ko: '엔', es: 'JPY', fr: 'JPY' } },
  { code: 'KRW', symbol: '₩', rate: 1320, label: { zh: '韩元', en: 'KRW', ja: 'ウォン', ko: '원', es: 'KRW', fr: 'KRW' } },
  { code: 'GBP', symbol: '£', rate: 0.79, label: { zh: '英镑', en: 'GBP', ja: 'ポンド', ko: '파운드', es: 'GBP', fr: 'GBP' } },
]

export const shippingMethods: ShippingMethod[] = [
  {
    id: 'standard',
    name: {
      zh: '标准配送', en: 'Standard Shipping', ja: '標準配送', ko: '표준 배송', es: 'Envío estándar', fr: 'Livraison standard',
    },
    description: {
      zh: '7-15个工作日送达', en: '7-15 business days', ja: '7-15営業日', ko: '7-15 영업일', es: '7-15 días hábiles', fr: '7-15 jours ouvrables',
    },
    price: 5.99,
    estimatedDays: '7-15',
  },
  {
    id: 'express',
    name: {
      zh: '加急配送', en: 'Express Shipping', ja: '速達配送', ko: '특급 배송', es: 'Envío exprés', fr: 'Livraison express',
    },
    description: {
      zh: '3-7个工作日送达', en: '3-7 business days', ja: '3-7営業日', ko: '3-7 영업일', es: '3-7 días hábiles', fr: '3-7 jours ouvrables',
    },
    price: 15.99,
    estimatedDays: '3-7',
  },
  {
    id: 'ems',
    name: {
      zh: '国际EMS', en: 'International EMS', ja: '国際EMS', ko: '국제 EMS', es: 'EMS internacional', fr: 'EMS international',
    },
    description: {
      zh: '5-10个工作日，可追踪', en: '5-10 business days, trackable', ja: '5-10営業日、追跡可', ko: '5-10 영업일, 추적 가능', es: '5-10 días hábiles, rastreable', fr: '5-10 jours ouvrables, traçable',
    },
    price: 22.0,
    estimatedDays: '5-10',
  },
]
