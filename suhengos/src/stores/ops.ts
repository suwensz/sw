import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Marketplace,
  CompetitorProduct,
  SupplyChainItem,
  MarketDemand,
  ListingTask,
  CreativeAsset,
  MarketplaceId,
} from '@/types'
import {
  MARKETPLACES,
  generateCompetitors,
  generateSupplyChain,
  generateMarketDemands,
} from '@/mock/operations'
import { mockProducts as products } from '@/mock/products'
import { tText } from '@/i18n'
import { getLocale } from '@/i18n'

const STORAGE_CONNECTED = 'qh_connected_platforms'
const STORAGE_LISTINGS = 'qh_listing_tasks'
const STORAGE_CREATIVES = 'qh_creative_assets'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const useOpsStore = defineStore('ops', () => {
  const connectedIds = ref<Set<MarketplaceId>>(
    new Set(load<MarketplaceId[]>(STORAGE_CONNECTED, MARKETPLACES.filter((m) => m.connected).map((m) => m.id))),
  )
  const marketplaces = ref<Marketplace[]>(MARKETPLACES)

  const competitors = ref<CompetitorProduct[]>(generateCompetitors())
  const supplyChain = ref<SupplyChainItem[]>(generateSupplyChain())
  const demands = ref<MarketDemand[]>(generateMarketDemands())

  const listingTasks = ref<ListingTask[]>(load<ListingTask[]>(STORAGE_LISTINGS, []))
  const creativeAssets = ref<CreativeAsset[]>(load<CreativeAsset[]>(STORAGE_CREATIVES, []))

  const competitorKeyword = ref('')
  const competitorPlatform = ref<MarketplaceId | 'all'>('all')

  const filteredCompetitors = computed(() => {
    let list = competitors.value
    if (competitorKeyword.value) {
      const kw = competitorKeyword.value.toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(kw))
    }
    if (competitorPlatform.value !== 'all') {
      list = list.filter((c) => c.platform === competitorPlatform.value)
    }
    return list
  })

  const connectedMarketplaces = computed(() =>
    marketplaces.value.filter((m) => connectedIds.value.has(m.id)),
  )

  function togglePlatform(id: MarketplaceId) {
    if (connectedIds.value.has(id)) {
      connectedIds.value.delete(id)
    } else {
      connectedIds.value.add(id)
    }
    connectedIds.value = new Set(connectedIds.value)
    save(STORAGE_CONNECTED, Array.from(connectedIds.value))
  }

  function refreshCompetitors(keyword?: string) {
    competitors.value = generateCompetitors(keyword || competitorKeyword.value)
  }

  // AI 竞品洞察（Mock）
  function getCompetitorInsights(): string {
    const list = filteredCompetitors.value
    if (!list.length) return '暂无数据'
    const avgPrice = list.reduce((s, c) => s + c.price, 0) / list.length
    const totalSales = list.reduce((s, c) => s + c.sales30d, 0)
    const avgRating = list.reduce((s, c) => s + c.rating, 0) / list.length
    const top = [...list].sort((a, b) => b.sales30d - a.sales30d)[0]
    const locale = getLocale()
    return [
      `样本 ${list.length} 个竞品，30天总销量约 ${totalSales.toLocaleString()} 件`,
      `均价 ${avgPrice.toFixed(2)}，平均评分 ${avgRating.toFixed(1)}`,
      `销冠：${tText(top?.title ? { zh: top.title, en: top.title, ja: top.title, ko: top.title, es: top.title, fr: top.title } : { zh: '-', en: '-', ja: '-', ko: '-', es: '-', fr: '-' }, locale)}（${top.sales30d}件）`,
      '建议：价格锚定均价 90% 区间，主打"有机/无硫/原产地"差异化卖点',
    ].join('；')
  }

  // ========= 创意素材（Mock 生成，使用真实占位图） =========
  function generateImage(prompt: string, aspectRatio: string = '1:1'): Promise<CreativeAsset> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const [w, h] = aspectRatio === '16:9' ? [800, 450] : aspectRatio === '9:16' ? [450, 800] : [600, 600]
        const seed = Math.random().toString(36).slice(2, 8)
        const asset: CreativeAsset = {
          id: `img_${Date.now()}`,
          type: 'image',
          url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
          thumbnail: `https://picsum.photos/seed/${seed}/200/200`,
          prompt,
          size: `${w}x${h}`,
          createdAt: new Date().toISOString(),
        }
        creativeAssets.value.unshift(asset)
        save(STORAGE_CREATIVES, creativeAssets.value)
        resolve(asset)
      }, 1200)
    })
  }

  function generateVideo(prompt: string, duration: number = 15): Promise<CreativeAsset> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const seed = Math.random().toString(36).slice(2, 8)
        const asset: CreativeAsset = {
          id: `vid_${Date.now()}`,
          type: 'video',
          url: `https://picsum.photos/seed/${seed}/640/360`,
          thumbnail: `https://picsum.photos/seed/${seed}/320/180`,
          prompt,
          duration,
          size: '640x360',
          createdAt: new Date().toISOString(),
        }
        creativeAssets.value.unshift(asset)
        save(STORAGE_CREATIVES, creativeAssets.value)
        resolve(asset)
      }, 2000)
    })
  }

  function deleteAsset(id: string) {
    creativeAssets.value = creativeAssets.value.filter((a) => a.id !== id)
    save(STORAGE_CREATIVES, creativeAssets.value)
  }

  // ========= 自动上架 =========
  function createListingTask(productId: string, platformIds: MarketplaceId[]): ListingTask {
    const product = products.find((p) => p.id === productId)
    const locale = getLocale()
    const task: ListingTask = {
      id: `task_${Date.now()}`,
      productId,
      productName: product?.name || { zh: '未知', en: 'Unknown', ja: '不明', ko: '미상', es: 'Desconocido', fr: 'Inconnu' },
      marketplaces: platformIds,
      titles: {},
      status: 'generating',
      createdAt: new Date().toISOString(),
      progress: 10,
    }
    listingTasks.value.unshift(task)

    // 模拟 AI 生成多语言标题
    const baseName = product ? tText(product.name, locale) : 'Product'
    let p = 10
    const timer = setInterval(() => {
      p += 15
      task.progress = Math.min(p, 90)
      if (p >= 90) {
        clearInterval(timer)
        platformIds.forEach((pid) => {
          const mp = marketplaces.value.find((m) => m.id === pid)
          task.titles[pid] = `${baseName} - Premium Quality | ${mp?.name || ''}`
        })
        task.status = 'pending'
        save(STORAGE_LISTINGS, listingTasks.value)
      }
    }, 400)

    save(STORAGE_LISTINGS, listingTasks.value)
    return task
  }

  function publishTask(id: string) {
    const task = listingTasks.value.find((t) => t.id === id)
    if (task) {
      task.status = 'published'
      task.publishedAt = new Date().toISOString()
      task.progress = 100
      save(STORAGE_LISTINGS, listingTasks.value)
    }
  }

  function deleteListingTask(id: string) {
    listingTasks.value = listingTasks.value.filter((t) => t.id !== id)
    save(STORAGE_LISTINGS, listingTasks.value)
  }

  return {
    marketplaces,
    connectedIds,
    connectedMarketplaces,
    competitors,
    supplyChain,
    demands,
    listingTasks,
    creativeAssets,
    competitorKeyword,
    competitorPlatform,
    filteredCompetitors,
    togglePlatform,
    refreshCompetitors,
    getCompetitorInsights,
    generateImage,
    generateVideo,
    deleteAsset,
    createListingTask,
    publishTask,
    deleteListingTask,
  }
})
