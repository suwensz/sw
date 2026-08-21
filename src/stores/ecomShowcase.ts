import { ref } from 'vue'
import { defineStore } from 'pinia'
import { SHOWCASE_PRODUCTS, type ShowcaseProduct } from '@/mock/ecomShowcase'
import { productMarket } from '@/mock/socialData'
import type { SocialAppId } from '@/types'

/**
 * 电商展示（运营端）可编辑数据库
 * - 全部内容（品名/简介/深度说明/价格/库存/图片/分类）可增删改，localStorage 持久化
 * - 每个产品带主销国家 + 当地主流社交软件列表（图片下方展示，可增加/删除）
 */

const STORAGE_KEY = 'qh_showcase_v1'

export interface ShowcaseEditProduct extends ShowcaseProduct {
  /** 主销国家代码（决定默认社交软件） */
  market: string
  /** 图片下方展示的当地主流社交软件（可增删） */
  socialApps: SocialAppId[]
  /** 是否用户自建产品 */
  custom?: boolean
}

function withDefaults(p: ShowcaseProduct): ShowcaseEditProduct {
  const m = productMarket(p.id)
  return { ...p, market: m.code, socialApps: [...m.apps] }
}

function loadProducts(): ShowcaseEditProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ShowcaseEditProduct[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* 损坏数据回退默认 */
  }
  return SHOWCASE_PRODUCTS.map(withDefaults)
}

export const useEcomShowcaseStore = defineStore('ecomShowcase', () => {
  const products = ref<ShowcaseEditProduct[]>(loadProducts())

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products.value))
  }

  function updateProduct(id: string, patch: Partial<ShowcaseEditProduct>) {
    const idx = products.value.findIndex((p) => p.id === id)
    if (idx >= 0) {
      products.value[idx] = { ...products.value[idx], ...patch }
      persist()
    }
  }

  function addProduct(p: ShowcaseEditProduct) {
    products.value.unshift(p)
    persist()
  }

  function removeProduct(id: string) {
    products.value = products.value.filter((p) => p.id !== id)
    persist()
  }

  function resetAll() {
    products.value = SHOWCASE_PRODUCTS.map(withDefaults)
    persist()
  }

  return { products, persist, updateProduct, addProduct, removeProduct, resetAll }
})
